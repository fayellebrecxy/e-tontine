import { Prisma, TypeMouvementPret } from "@/lib/generated/prisma";

import { prisma } from "@/lib/prisma";
import {
  createNotification,
  markStalePretApprovalNotificationsRead,
  notifyGroupAdmins,
  notifyMembre,
} from "@/lib/notifications";
import { validateAvalistesForMontant } from "@/lib/pret-avalistes";
import { checkPretEligibility, ensureParametresPret } from "@/lib/pret-eligibility";
import {
  applyBankMovement,
  buildRepartitionFromStored,
  BANK_TX_OPTIONS,
  computeRepartitionForAmount,
  creditInterestCaisse,
  ensureCaisseInterets,
  getActiveEpargneAccounts,
  getEpargneDisponible,
} from "@/lib/pret-banque";
import {
  addDureeToDate,
  buildContratAvalisteFromForm,
  computeElapsedInterest,
  computeInterestForDuration,
  computeInterestForMonths,
  formatDureePret,
  formatPretMontant,
  parseUniteDureePret,
  roundCurrency,
  validateDureePret,
  type RepartitionBanqueEntry,
  type UniteDureePret,
} from "@/lib/pret-utils";

async function logMouvementPret(
  tx: Prisma.TransactionClient,
  data: {
    id_pret: string;
    id_groupe: string;
    type_mouvement: TypeMouvementPret;
    montant?: number;
    id_operateur?: string;
    id_membre_concerne?: string;
    details?: string;
    capital_restant_apres?: number;
    interets_restants_apres?: number;
  },
) {
  return tx.mouvementPret.create({
    data: {
      id_pret: data.id_pret,
      id_groupe: data.id_groupe,
      type_mouvement: data.type_mouvement,
      montant: new Prisma.Decimal(data.montant ?? 0),
      id_operateur: data.id_operateur,
      id_membre_concerne: data.id_membre_concerne,
      details: data.details,
      capital_restant_apres:
        data.capital_restant_apres !== undefined
          ? new Prisma.Decimal(data.capital_restant_apres)
          : undefined,
      interets_restants_apres:
        data.interets_restants_apres !== undefined
          ? new Prisma.Decimal(data.interets_restants_apres)
          : undefined,
    },
  });
}

function memberFullName(user: { prenom: string; nom: string }) {
  return `${user.prenom} ${user.nom}`;
}

async function syncPretStatutFromAvalistes(
  tx: Prisma.TransactionClient,
  pretId: string,
  _groupId: string,
) {
  const avalistes = await tx.avalistePret.findMany({
    where: { id_pret: pretId },
    select: { statut: true },
  });

  if (avalistes.length === 0) {
    await tx.pret.update({
      where: { id_pret: pretId },
      data: { statut: "EN_ATTENTE_ANALYSE" },
    });
    return;
  }

  const hasPropose = avalistes.some((a) => a.statut === "PROPOSE");
  const hasEnAttente = avalistes.some((a) => a.statut === "EN_ATTENTE");
  const hasContratSoumis = avalistes.some((a) => a.statut === "CONTRAT_SOUMIS");
  const hasAccepte = avalistes.some((a) => a.statut === "ACCEPTE");

  let statut: "EN_ATTENTE_ANALYSE" | "EN_ATTENTE_AVALISTES" | "EN_ATTENTE_CONFIRMATION_AVALISTES" =
    "EN_ATTENTE_ANALYSE";

  if (hasEnAttente || hasPropose) {
    statut = hasEnAttente ? "EN_ATTENTE_AVALISTES" : "EN_ATTENTE_ANALYSE";
  } else if (hasContratSoumis) {
    statut = "EN_ATTENTE_CONFIRMATION_AVALISTES";
  } else if (hasAccepte) {
    statut = "EN_ATTENTE_ANALYSE";
  }

  await tx.pret.update({
    where: { id_pret: pretId },
    data: { statut },
  });
}

async function getPretWithRelations(pretId: string, groupId: string) {
  return prisma.pret.findFirst({
    where: { id_pret: pretId, id_groupe: groupId },
    include: {
      emprunteur: { include: { user: true, compte_epargne: true } },
      avalistes: {
        include: { membre: { include: { user: true, compte_epargne: true } } },
      },
      mouvements: {
        orderBy: { date_operation: "desc" },
        include: { operateur: { include: { user: { select: { nom: true, prenom: true } } } } },
      },
    },
  });
}

export async function submitPretDemande({
  groupId,
  memberId,
  montantDemande,
  dureeValeurDemandee,
  dureeUniteDemandee,
  motif,
  avalisteIds = [],
}: {
  groupId: string;
  memberId: string;
  montantDemande: number;
  dureeValeurDemandee: number;
  dureeUniteDemandee: UniteDureePret;
  motif?: string;
  avalisteIds?: string[];
}) {
  if (!Number.isFinite(montantDemande) || montantDemande <= 0) {
    return { ok: false as const, status: 400, error: "Montant invalide." };
  }

  const dureeError = validateDureePret(dureeValeurDemandee, dureeUniteDemandee);
  if (dureeError) {
    return { ok: false as const, status: 400, error: dureeError };
  }

  const dureeLabel = formatDureePret(dureeValeurDemandee, dureeUniteDemandee);

  const eligibility = await checkPretEligibility(groupId, memberId, montantDemande);
  if (!eligibility.eligible) {
    return { ok: false as const, status: 400, error: eligibility.reasons.join(" ") };
  }

  const uniqueAvalistes = [...new Set(avalisteIds.filter((id) => id !== memberId))];
  if (uniqueAvalistes.length === 0) {
    return { ok: false as const, status: 400, error: "Au moins un avaliste est requis." };
  }

  const avalisteValidation = await validateAvalistesForMontant({
    groupId,
    montantDemande,
    avalisteIds: uniqueAvalistes,
    emprunteurId: memberId,
  });
  if (!avalisteValidation.ok) {
    return {
      ok: false as const,
      status: 400,
      error: avalisteValidation.errors.join(" "),
    };
  }

  const pret = await prisma.$transaction(async (tx) => {
    const created = await tx.pret.create({
      data: {
        id_groupe: groupId,
        id_emprunteur: memberId,
        statut: "EN_ATTENTE_ANALYSE",
        montant_demande: new Prisma.Decimal(montantDemande),
        duree_valeur_demandee: dureeValeurDemandee,
        duree_unite_demandee: dureeUniteDemandee,
        motif: motif?.trim() || null,
      },
    });

    await logMouvementPret(tx, {
      id_pret: created.id_pret,
      id_groupe: groupId,
      type_mouvement: "DEMANDE_SOUMISE",
      montant: montantDemande,
      id_membre_concerne: memberId,
      details: `Demande de ${formatPretMontant(montantDemande)} sur ${dureeLabel}. Avalistes : ${uniqueAvalistes.length}.`,
    });

    for (const avalisteId of uniqueAvalistes) {
      const avalisteMember = await tx.membreGroupe.findFirst({
        where: {
          id_membre_groupe: avalisteId,
          id_groupe: groupId,
          statut_adhesion: "ACTIF",
        },
        include: { user: true },
      });
      if (!avalisteMember) {
        throw new Error("Avaliste introuvable ou inactif.");
      }

      await tx.avalistePret.create({
        data: {
          id_pret: created.id_pret,
          id_membre_groupe: avalisteId,
          statut: "PROPOSE",
          propose_par_emprunteur: true,
        },
      });

      await logMouvementPret(tx, {
        id_pret: created.id_pret,
        id_groupe: groupId,
        type_mouvement: "AVALISTE_PROPOSE",
        id_membre_concerne: avalisteId,
        details: `${memberFullName(avalisteMember.user)} proposé par l'emprunteur (en attente envoi admin).`,
      });
    }

    return created;
  });

  await notifyGroupAdmins({
    groupId,
    type: "PRET_DEMANDE",
    message: `Nouvelle demande de prêt : ${formatPretMontant(montantDemande)} sur ${dureeLabel}. ${uniqueAvalistes.length} avaliste(s) proposé(s). À analyser.`,
  });

  return { ok: true as const, pret };
}

export async function adminSendToAvalistes({
  groupId,
  pretId,
  adminMemberId,
}: {
  groupId: string;
  pretId: string;
  adminMemberId: string;
}) {
  const pret = await getPretWithRelations(pretId, groupId);
  if (!pret || pret.statut !== "EN_ATTENTE_ANALYSE") {
    return { ok: false as const, status: 400, error: "Demande non envoyable aux avalistes." };
  }

  const proposes = pret.avalistes.filter((a) => a.statut === "PROPOSE");
  if (proposes.length === 0) {
    return { ok: false as const, status: 400, error: "Aucun avaliste proposé en attente d'envoi." };
  }

  const montantLabel = formatPretMontant(Number(pret.montant_demande));

  await prisma.$transaction(async (tx) => {
    for (const avaliste of proposes) {
      await tx.avalistePret.update({
        where: { id_avaliste_pret: avaliste.id_avaliste_pret },
        data: { statut: "EN_ATTENTE" },
      });
    }

    await tx.pret.update({
      where: { id_pret: pretId },
      data: { statut: "EN_ATTENTE_AVALISTES" },
    });

    await logMouvementPret(tx, {
      id_pret: pretId,
      id_groupe: groupId,
      type_mouvement: "ENVOI_DEMANDE_AVALISTES",
      id_operateur: adminMemberId,
      details: `Demande envoyée à ${proposes.length} avaliste(s) pour validation.`,
    });
  });

  for (const avaliste of proposes) {
    await notifyMembre({
      id_membre_groupe: avaliste.id_membre_groupe,
      type: "PRET_AVALISTE_DEMANDE",
      message: `L'administrateur vous demande d'être avaliste pour un prêt de ${montantLabel}. Remplissez le contrat de garantie dans Prêts.`,
    });
  }

  await notifyMembre({
    id_membre_groupe: pret.id_emprunteur,
    type: "PRET_AVALISTE_DEMANDE",
    message: `Votre demande de prêt a été transmise aux avalistes pour validation.`,
  });

  return { ok: true as const };
}

export async function respondAvaliste({
  groupId,
  pretId,
  avalisteMemberId,
  accept,
  motifRefus,
  dateContrat,
  signatureNom,
  acceptationSaisie,
}: {
  groupId: string;
  pretId: string;
  avalisteMemberId: string;
  accept: boolean;
  motifRefus?: string;
  dateContrat?: string;
  signatureNom?: string;
  acceptationSaisie?: boolean;
}) {
  const pret = await getPretWithRelations(pretId, groupId);
  if (!pret) return { ok: false as const, status: 404, error: "Prêt introuvable." };

  if (!["EN_ATTENTE_AVALISTES", "EN_ATTENTE_CONFIRMATION_AVALISTES"].includes(pret.statut)) {
    return { ok: false as const, status: 400, error: "Ce prêt n'accepte plus de réponse avaliste." };
  }

  const avaliste = pret.avalistes.find((a) => a.id_membre_groupe === avalisteMemberId);
  if (!avaliste || avaliste.statut !== "EN_ATTENTE") {
    return { ok: false as const, status: 400, error: "Avaliste introuvable ou déjà répondu." };
  }

  if (!accept) {
    await prisma.$transaction(async (tx) => {
      await tx.avalistePret.update({
        where: { id_avaliste_pret: avaliste.id_avaliste_pret },
        data: {
          statut: "REFUSE",
          motif_refus: motifRefus?.trim() || "Refus sans motif.",
          date_reponse: new Date(),
        },
      });

      await logMouvementPret(tx, {
        id_pret: pretId,
        id_groupe: groupId,
        type_mouvement: "AVALISTE_REFUSE",
        id_membre_concerne: avalisteMemberId,
        id_operateur: avalisteMemberId,
        details: `Refus avaliste. Motif : ${motifRefus?.trim() || "Non précisé"}`,
      });

      await syncPretStatutFromAvalistes(tx, pretId, groupId);
    });

    await notifyGroupAdmins({
      groupId,
      type: "PRET_AVALISTE_REFUSE",
      message: `${memberFullName(avaliste.membre.user)} a refusé d'être avaliste.`,
    });
    await notifyMembre({
      id_membre_groupe: pret.id_emprunteur,
      type: "PRET_AVALISTE_REFUSE",
      message: `Votre avaliste ${memberFullName(avaliste.membre.user)} a refusé.`,
    });

    return { ok: true as const };
  }

  if (!acceptationSaisie) {
    return {
      ok: false as const,
      status: 400,
      error: "Vous devez accepter la saisie de vos fonds d'épargne en cas de défaut.",
    };
  }
  if (!signatureNom?.trim() || signatureNom.trim().length < 3) {
    return { ok: false as const, status: 400, error: "Signature (nom complet) obligatoire." };
  }

  const dateContratParsed = dateContrat ? new Date(dateContrat) : new Date();
  if (Number.isNaN(dateContratParsed.getTime())) {
    return { ok: false as const, status: 400, error: "Date du contrat invalide." };
  }

  const contratTexte = buildContratAvalisteFromForm({
    avaliste_nom: memberFullName(avaliste.membre.user),
    emprunteur_nom: memberFullName(pret.emprunteur.user),
    montant: formatPretMontant(Number(pret.montant_demande)),
    duree: formatDureePret(pret.duree_valeur_demandee, pret.duree_unite_demandee),
    date_contrat: dateContratParsed.toLocaleDateString("fr-FR"),
    signature_nom: signatureNom.trim(),
  });

  await prisma.$transaction(async (tx) => {
    await tx.avalistePret.update({
      where: { id_avaliste_pret: avaliste.id_avaliste_pret },
      data: {
        statut: "CONTRAT_SOUMIS",
        contrat_texte: contratTexte,
        acceptation_saisie: true,
        signature_nom: signatureNom.trim(),
        date_contrat: dateContratParsed,
        date_reponse: new Date(),
      },
    });

    await logMouvementPret(tx, {
      id_pret: pretId,
      id_groupe: groupId,
      type_mouvement: "CONTRAT_AVALISTE_SOUMIS",
      id_membre_concerne: avalisteMemberId,
      id_operateur: avalisteMemberId,
      details: `Contrat soumis le ${dateContratParsed.toLocaleDateString("fr-FR")} — ${contratTexte}`,
    });

    await syncPretStatutFromAvalistes(tx, pretId, groupId);
  });

  await notifyGroupAdmins({
    groupId,
    type: "PRET_AVALISTE_ACCEPTE",
    message: `${memberFullName(avaliste.membre.user)} a soumis son contrat de garantie. Confirmez l'acceptation.`,
  });

  return { ok: true as const };
}

export async function adminConfirmAvaliste({
  groupId,
  pretId,
  adminMemberId,
  avalistePretId,
}: {
  groupId: string;
  pretId: string;
  adminMemberId: string;
  avalistePretId: string;
}) {
  const pret = await getPretWithRelations(pretId, groupId);
  if (
    !pret ||
    !["EN_ATTENTE_ANALYSE", "EN_ATTENTE_AVALISTES", "EN_ATTENTE_CONFIRMATION_AVALISTES"].includes(
      pret.statut,
    )
  ) {
    return { ok: false as const, status: 400, error: "Aucune confirmation avaliste en attente." };
  }

  const avaliste = pret.avalistes.find((a) => a.id_avaliste_pret === avalistePretId);
  if (!avaliste || avaliste.statut !== "CONTRAT_SOUMIS") {
    return { ok: false as const, status: 400, error: "Contrat avaliste introuvable ou déjà confirmé." };
  }

  await prisma.$transaction(async (tx) => {
    const compte = avaliste.membre.compte_epargne;
    const disponible = compte ? await getEpargneDisponible(compte.id_compte, tx) : 0;

    await tx.avalistePret.update({
      where: { id_avaliste_pret: avaliste.id_avaliste_pret },
      data: {
        statut: "ACCEPTE",
        montant_engagement: new Prisma.Decimal(disponible),
        date_confirmation_admin: new Date(),
      },
    });

    if (compte && disponible > 0) {
      await tx.engagementEpargne.create({
        data: {
          id_groupe: groupId,
          id_compte: compte.id_compte,
          id_membre_groupe: avaliste.id_membre_groupe,
          id_pret: pretId,
          type_engagement: "GARANTIE_AVALISTE",
          montant_engage: new Prisma.Decimal(disponible),
        },
      });
    }

    await logMouvementPret(tx, {
      id_pret: pretId,
      id_groupe: groupId,
      type_mouvement: "CONFIRMATION_AVALISTE_ADMIN",
      id_operateur: adminMemberId,
      id_membre_concerne: avaliste.id_membre_groupe,
      details: `Admin confirme l'avaliste ${memberFullName(avaliste.membre.user)}. Engagement : ${formatPretMontant(disponible)}.`,
    });

    await syncPretStatutFromAvalistes(tx, pretId, groupId);
  });

  await notifyMembre({
    id_membre_groupe: avaliste.id_membre_groupe,
    type: "PRET_AVALISTE_ACCEPTE",
    message: `Votre contrat de garantie a été confirmé par l'administrateur.`,
  });

  const updated = await getPretWithRelations(pretId, groupId);
  if (updated?.statut === "EN_ATTENTE_ANALYSE") {
    const allConfirmed = updated.avalistes.every(
      (a) => a.statut === "ACCEPTE" || a.statut === "REFUSE",
    );
    const hasAccepte = updated.avalistes.some((a) => a.statut === "ACCEPTE");
    if (allConfirmed && hasAccepte) {
      await notifyMembre({
        id_membre_groupe: pret.id_emprunteur,
        type: "PRET_DEMANDE",
        message: `Tous les avalistes ont répondu. Votre demande est prête pour approbation par l'admin.`,
      });
    }
  }

  return { ok: true as const };
}

export async function adminAddAvaliste({
  groupId,
  pretId,
  adminMemberId,
  avalisteMemberId,
  montantEngagement,
}: {
  groupId: string;
  pretId: string;
  adminMemberId: string;
  avalisteMemberId: string;
  montantEngagement?: number;
}) {
  const pret = await prisma.pret.findFirst({ where: { id_pret: pretId, id_groupe: groupId } });
  if (!pret || !["EN_ATTENTE_ANALYSE", "EN_ATTENTE_AVALISTES"].includes(pret.statut)) {
    return { ok: false as const, status: 400, error: "Demande non modifiable." };
  }

  const statutAvaliste = pret.statut === "EN_ATTENTE_AVALISTES" ? "EN_ATTENTE" : "PROPOSE";

  await prisma.avalistePret.upsert({
    where: {
      id_pret_id_membre_groupe: { id_pret: pretId, id_membre_groupe: avalisteMemberId },
    },
    create: {
      id_pret: pretId,
      id_membre_groupe: avalisteMemberId,
      statut: statutAvaliste,
      propose_par_emprunteur: false,
      montant_engagement: new Prisma.Decimal(montantEngagement ?? 0),
    },
    update: {
      statut: statutAvaliste,
      montant_engagement: new Prisma.Decimal(montantEngagement ?? 0),
      date_reponse: null,
      motif_refus: null,
      contrat_texte: null,
      acceptation_saisie: false,
      signature_nom: null,
      date_contrat: null,
      date_confirmation_admin: null,
    },
  });

  if (statutAvaliste === "EN_ATTENTE") {
    await notifyMembre({
      id_membre_groupe: avalisteMemberId,
      type: "PRET_AVALISTE_DEMANDE",
      message: "L'administrateur vous demande d'être avaliste. Remplissez le contrat dans Prêts.",
    });
  }

  await prisma.mouvementPret.create({
    data: {
      id_pret: pretId,
      id_groupe: groupId,
      type_mouvement: "AVALISTE_PROPOSE",
      id_operateur: adminMemberId,
      id_membre_concerne: avalisteMemberId,
      details: `Avaliste ajouté par l'admin.`,
    },
  });

  return { ok: true as const };
}

export async function adminAnalyzePret({
  groupId,
  pretId,
  adminMemberId,
  decision,
  montantApprouve,
  dureeValeurApprouvee,
  dureeUniteApprouvee,
  tauxInteretMensuel,
  notesAdmin,
  motifRefus,
}: {
  groupId: string;
  pretId: string;
  adminMemberId: string;
  decision: "APPROUVE" | "REFUSE";
  montantApprouve?: number;
  dureeValeurApprouvee?: number;
  dureeUniteApprouvee?: UniteDureePret;
  tauxInteretMensuel?: number;
  notesAdmin?: string;
  motifRefus?: string;
}) {
  const pret = await getPretWithRelations(pretId, groupId);
  if (!pret || pret.statut !== "EN_ATTENTE_ANALYSE") {
    return { ok: false as const, status: 400, error: "Demande non analysable pour approbation." };
  }

  if (decision === "REFUSE") {
    await prisma.$transaction(async (tx) => {
      await tx.pret.update({
        where: { id_pret: pretId },
        data: { statut: "REFUSE", motif_refus: motifRefus?.trim() || "Refusé par l'administrateur.", notes_admin: notesAdmin?.trim() || null },
      });
      await logMouvementPret(tx, {
        id_pret: pretId,
        id_groupe: groupId,
        type_mouvement: "REFUS",
        id_operateur: adminMemberId,
        details: motifRefus?.trim() || "Refus administrateur.",
      });
    });

    await notifyMembre({
      id_membre_groupe: pret.id_emprunteur,
      type: "PRET_REFUSE",
      message: `Votre demande de prêt a été refusée. ${motifRefus ?? ""}`,
    });

    return { ok: true as const };
  }

  if (decision !== "APPROUVE") {
    return { ok: false as const, status: 400, error: "Décision invalide." };
  }

  if (!montantApprouve || !dureeValeurApprouvee || !dureeUniteApprouvee || tauxInteretMensuel === undefined) {
    return { ok: false as const, status: 400, error: "Montant, durée et taux requis pour approuver." };
  }

  const dureeError = validateDureePret(dureeValeurApprouvee, dureeUniteApprouvee);
  if (dureeError) {
    return { ok: false as const, status: 400, error: dureeError };
  }

  const dureeLabel = formatDureePret(dureeValeurApprouvee, dureeUniteApprouvee);

  const eligibility = await checkPretEligibility(
    groupId,
    pret.id_emprunteur,
    montantApprouve,
    pretId,
  );
  if (!eligibility.eligible) {
    return { ok: false as const, status: 400, error: eligibility.reasons.join(" ") };
  }

  const parametres = await ensureParametresPret(groupId);
  const compte = pret.emprunteur.compte_epargne;
  if (!compte) return { ok: false as const, status: 400, error: "Compte épargne emprunteur introuvable." };

  const soldeEmprunteur = Number(compte.solde_actuel);
  if (montantApprouve <= soldeEmprunteur) {
    return {
      ok: false as const,
      status: 400,
      error: "Le montant approuvé doit être supérieur à l'épargne de l'emprunteur.",
    };
  }

  if (soldeEmprunteur === 0 && parametres.refus_sans_epargne) {
    const acceptedAvalistes = pret.avalistes.filter((a) => a.statut === "ACCEPTE").length;
    if (acceptedAvalistes === 0) {
      return { ok: false as const, status: 400, error: "Avalistes acceptés requis (épargne nulle)." };
    }
  }

  const pendingAvalistes = pret.avalistes.some(
    (a) => ["PROPOSE", "EN_ATTENTE", "CONTRAT_SOUMIS"].includes(a.statut),
  );
  if (pendingAvalistes) {
    return {
      ok: false as const,
      status: 400,
      error: "Tous les avalistes doivent être confirmés avant d'approuver le prêt.",
    };
  }

  const acceptedAvalistes = pret.avalistes.filter((a) => a.statut === "ACCEPTE").length;
  if (pret.avalistes.length > 0 && acceptedAvalistes === 0) {
    return { ok: false as const, status: 400, error: "Au moins un avaliste confirmé est requis." };
  }

  const interetsTotal = computeInterestForDuration(
    montantApprouve,
    tauxInteretMensuel,
    dureeValeurApprouvee,
    dureeUniteApprouvee,
  );
  const dateFin = addDureeToDate(new Date(), dureeValeurApprouvee, dureeUniteApprouvee);

  await prisma.$transaction(async (tx) => {
    await tx.pret.update({
      where: { id_pret: pretId },
      data: {
        statut: "APPROUVE",
        montant_approuve: new Prisma.Decimal(montantApprouve),
        duree_valeur_approuvee: dureeValeurApprouvee,
        duree_unite_approuvee: dureeUniteApprouvee,
        taux_interet_mensuel: new Prisma.Decimal(tauxInteretMensuel),
        montant_interets_total: new Prisma.Decimal(interetsTotal),
        montant_capital_restant: new Prisma.Decimal(montantApprouve),
        montant_interets_restant: new Prisma.Decimal(interetsTotal),
        montant_garantie_emprunteur: new Prisma.Decimal(soldeEmprunteur),
        notes_admin: notesAdmin?.trim() || null,
        date_approbation: new Date(),
        date_fin: dateFin,
      },
    });

    await tx.engagementEpargne.create({
      data: {
        id_groupe: groupId,
        id_compte: compte.id_compte,
        id_membre_groupe: pret.id_emprunteur,
        id_pret: pretId,
        type_engagement: "GARANTIE_EMPRUNTEUR",
        montant_engage: new Prisma.Decimal(soldeEmprunteur),
      },
    });

    await logMouvementPret(tx, {
      id_pret: pretId,
      id_groupe: groupId,
      type_mouvement: "APPROBATION",
      montant: montantApprouve,
      id_operateur: adminMemberId,
      details: `Approuvé : ${formatPretMontant(montantApprouve)}, ${dureeLabel}, ${tauxInteretMensuel}%/mois, intérêts ${formatPretMontant(interetsTotal)}.`,
      capital_restant_apres: montantApprouve,
      interets_restants_apres: interetsTotal,
    });
  });

  await notifyMembre({
    id_membre_groupe: pret.id_emprunteur,
    type: "PRET_APPROUVE",
    message: `Prêt approuvé : ${formatPretMontant(montantApprouve)}. En attente de décaissement par l'admin.`,
  });

  return { ok: true as const };
}

export async function disbursePret({
  groupId,
  pretId,
  adminMemberId,
}: {
  groupId: string;
  pretId: string;
  adminMemberId: string;
}) {
  const pret = await getPretWithRelations(pretId, groupId);
  if (!pret || pret.statut !== "APPROUVE") {
    return { ok: false as const, status: 400, error: "Prêt non approuvé ou déjà décaissé." };
  }

  const montant = Number(pret.montant_approuve ?? 0);
  if (montant <= 0) return { ok: false as const, status: 400, error: "Montant approuvé invalide." };

  const accounts = await getActiveEpargneAccounts(groupId);
  const bankTotal = accounts.reduce((s, a) => s + Number(a.solde_actuel), 0);
  if (montant > bankTotal) {
    return { ok: false as const, status: 400, error: `Banque insuffisante (${formatPretMontant(bankTotal)}).` };
  }

  const repartition = computeRepartitionForAmount(
    accounts.map((a) => ({
      id_compte: a.id_compte,
      id_membre_groupe: a.id_membre_groupe,
      solde: Number(a.solde_actuel),
    })),
    montant,
  );

  const emprunteurName = memberFullName(pret.emprunteur.user);

  try {
    await prisma.$transaction(async (tx) => {
      const mouvement = await logMouvementPret(tx, {
        id_pret: pretId,
        id_groupe: groupId,
        type_mouvement: "DECAISSEMENT",
        montant,
        id_operateur: adminMemberId,
        details: `Décaissement de ${formatPretMontant(montant)} à ${emprunteurName}.`,
        capital_restant_apres: montant,
        interets_restants_apres: Number(pret.montant_interets_restant),
      });

      await applyBankMovement({
        tx,
        groupId,
        pretId,
        mouvementPretId: mouvement.id_mouvement,
        entries: repartition,
        direction: "DEBIT",
        motif: `Prêt décaissé — ${emprunteurName} (${formatPretMontant(montant)})`,
        operatorMemberId: adminMemberId,
        epargneType: "PRET_DEBIT_BANQUE",
      });

      await tx.pret.update({
        where: { id_pret: pretId },
        data: {
          statut: "EN_COURS",
          date_decaissement: new Date(),
          repartition_decaissement: repartition as unknown as Prisma.InputJsonValue,
        },
      });
    }, BANK_TX_OPTIONS);
  } catch (error) {
    console.error("disbursePret:", error);
    const message = error instanceof Error ? error.message : "Erreur lors du décaissement.";
    if (message.includes("Solde insuffisant")) {
      return { ok: false as const, status: 400, error: message };
    }
    if (
      (error as { code?: string }).code === "P2028" ||
      message.includes("Transaction already closed") ||
      message.includes("timeout")
    ) {
      return {
        ok: false as const,
        status: 503,
        error: "Décaissement interrompu (délai dépassé). Réessayez dans quelques secondes.",
      };
    }
    return { ok: false as const, status: 500, error: message };
  }

  const members = await prisma.membreGroupe.findMany({
    where: { id_groupe: groupId, statut_adhesion: "ACTIF" },
    select: { id_user: true, id_membre_groupe: true },
  });

  const emprunteurUserId = pret.emprunteur.id_user;

  for (const member of members) {
    if (member.id_membre_groupe === pret.id_emprunteur) continue;
    const impact = repartition.find((r) => r.id_membre_groupe === member.id_membre_groupe);
    const impactLabel = impact
      ? ` Impact sur votre épargne : −${formatPretMontant(impact.montant)}.`
      : "";
    await createNotification({
      userId: member.id_user,
      groupId,
      type: "PRET_DECAISSEMENT",
      message: `Prêt de ${formatPretMontant(montant)} décaissé à ${emprunteurName}.${impactLabel}`,
    });
  }

  await markStalePretApprovalNotificationsRead({
    userId: emprunteurUserId,
    groupId,
  });

  await notifyMembre({
    id_membre_groupe: pret.id_emprunteur,
    type: "PRET_DECAISSEMENT",
    message: `Votre prêt de ${formatPretMontant(montant)} a été versé. Vous pouvez consulter le détail dans Mes prêts.`,
  });

  return { ok: true as const, repartition };
}

function recalculateInterestDue(pret: {
  montant_approuve: Prisma.Decimal | null;
  taux_interet_mensuel: Prisma.Decimal | null;
  date_decaissement: Date | null;
  date_fin: Date | null;
  montant_interets_total: Prisma.Decimal;
  montant_capital_restant: Prisma.Decimal;
  statut: string;
}) {
  const principal = Number(pret.montant_approuve ?? 0);
  const rate = Number(pret.taux_interet_mensuel ?? 0);
  const start = pret.date_decaissement ?? new Date();
  const now = new Date();
  const end = pret.date_fin ?? now;

  if (!pret.date_decaissement || principal <= 0) {
    return Number(pret.montant_interets_total);
  }

  if (now <= end) {
    return computeElapsedInterest(principal, rate, start, now);
  }

  const periodInterest = computeInterestForMonths(
    principal,
    rate,
    monthsFromDates(start, end),
  );
  const remainingCapital = Number(pret.montant_capital_restant);
  const lateInterest = computeElapsedInterest(remainingCapital, rate, end, now);

  return roundCurrency(periodInterest + lateInterest);
}

function monthsFromDates(start: Date, end: Date) {
  return Math.max(1, Math.round((end.getTime() - start.getTime()) / (30 * 24 * 60 * 60 * 1000)));
}

export async function recordPretRepayment({
  groupId,
  pretId,
  adminMemberId,
  montant,
  note,
}: {
  groupId: string;
  pretId: string;
  adminMemberId: string;
  montant: number;
  note?: string;
}) {
  if (!Number.isFinite(montant) || montant <= 0) {
    return { ok: false as const, status: 400, error: "Montant invalide." };
  }

  const pret = await getPretWithRelations(pretId, groupId);
  if (!pret || !["EN_COURS", "EN_RETARD"].includes(pret.statut)) {
    return { ok: false as const, status: 400, error: "Prêt non remboursable." };
  }

  const storedRepartition = pret.repartition_decaissement as RepartitionBanqueEntry[] | null;
  if (!storedRepartition?.length) {
    return { ok: false as const, status: 400, error: "Répartition banque introuvable." };
  }

  let capitalRestant = Number(pret.montant_capital_restant);
  let interetsRestants = Number(pret.montant_interets_restant);

  const interestDueNow = recalculateInterestDue(pret);
  const interetsDejaPayes = Number(pret.montant_interets_total) - interetsRestants;
  interetsRestants = Math.max(0, roundCurrency(interestDueNow - interetsDejaPayes));

  const toInterest = Math.min(montant, interetsRestants);
  let toCapital = roundCurrency(montant - toInterest);
  if (toCapital > capitalRestant) {
    toCapital = capitalRestant;
  }

  interetsRestants = roundCurrency(interetsRestants - toInterest);
  capitalRestant = roundCurrency(capitalRestant - toCapital);

  const emprunteurName = memberFullName(pret.emprunteur.user);

  await prisma.$transaction(async (tx) => {
    if (toInterest > 0) {
      await logMouvementPret(tx, {
        id_pret: pretId,
        id_groupe: groupId,
        type_mouvement: "REMBOURSEMENT_INTERET",
        montant: toInterest,
        id_operateur: adminMemberId,
        details: note?.trim() || "Remboursement intérêts.",
        capital_restant_apres: capitalRestant,
        interets_restants_apres: interetsRestants,
      });

      await creditInterestCaisse({
        tx,
        groupId,
        montant: toInterest,
        pretId,
        operatorMemberId: adminMemberId,
      });
    }

    if (toCapital > 0) {
      const repartition = buildRepartitionFromStored(storedRepartition, toCapital);
      const mv = await logMouvementPret(tx, {
        id_pret: pretId,
        id_groupe: groupId,
        type_mouvement: "REMBOURSEMENT_CAPITAL",
        montant: toCapital,
        id_operateur: adminMemberId,
        details: note?.trim() || "Remboursement capital — retour banque.",
        capital_restant_apres: capitalRestant,
        interets_restants_apres: interetsRestants,
      });

      await applyBankMovement({
        tx,
        groupId,
        pretId,
        mouvementPretId: mv.id_mouvement,
        entries: repartition,
        direction: "CREDIT",
        motif: `Remboursement capital prêt — ${emprunteurName} (+${formatPretMontant(toCapital)})`,
        operatorMemberId: adminMemberId,
        epargneType: "PRET_CREDIT_BANQUE",
      });
    }

    const now = new Date();
    const isLate = pret.date_fin && now > pret.date_fin && (capitalRestant > 0 || interetsRestants > 0);
    let newStatut = pret.statut;
    if (capitalRestant <= 0 && interetsRestants <= 0) {
      newStatut = "SOLDE";
    } else if (isLate) {
      newStatut = "EN_RETARD";
    }

    await tx.pret.update({
      where: { id_pret: pretId },
      data: {
        statut: newStatut,
        montant_capital_restant: new Prisma.Decimal(capitalRestant),
        montant_interets_restant: new Prisma.Decimal(interetsRestants),
      },
    });

    if (newStatut === "SOLDE") {
      await tx.engagementEpargne.updateMany({
        where: { id_pret: pretId, actif: true },
        data: { actif: false, date_liberation: new Date() },
      });
    }
  });

  const members = await prisma.membreGroupe.findMany({
    where: { id_groupe: groupId, statut_adhesion: "ACTIF" },
    select: { id_user: true, id_membre_groupe: true },
  });

  for (const member of members) {
    await createNotification({
      userId: member.id_user,
      groupId,
      type: "PRET_REMBOURSEMENT",
      message: `Remboursement prêt ${emprunteurName} : ${formatPretMontant(montant)} (intérêts ${formatPretMontant(toInterest)}, capital ${formatPretMontant(toCapital)}). Reste dû : ${formatPretMontant(capitalRestant + interetsRestants)}.`,
    });
  }

  return { ok: true as const, capitalRestant, interetsRestants };
}

export async function saisieGarantiePret({
  groupId,
  pretId,
  adminMemberId,
  avalisteMemberId,
  montant,
  motif,
}: {
  groupId: string;
  pretId: string;
  adminMemberId: string;
  avalisteMemberId: string;
  montant: number;
  motif: string;
}) {
  const compte = await prisma.compteEpargne.findFirst({
    where: { id_membre_groupe: avalisteMemberId, id_groupe: groupId },
  });
  if (!compte) return { ok: false as const, status: 404, error: "Compte avaliste introuvable." };

  const soldeAvant = Number(compte.solde_actuel);
  if (montant > soldeAvant) {
    return { ok: false as const, status: 400, error: "Montant supérieur au solde avaliste." };
  }

  await prisma.$transaction(async (tx) => {
    const soldeApres = roundCurrency(soldeAvant - montant);

    await tx.compteEpargne.update({
      where: { id_compte: compte.id_compte },
      data: {
        solde_actuel: new Prisma.Decimal(soldeApres),
        statut: "BLOQUE",
      },
    });

    await tx.mouvementEpargne.create({
      data: {
        id_compte: compte.id_compte,
        id_groupe: groupId,
        id_membre_groupe: avalisteMemberId,
        id_operateur: adminMemberId,
        role_acteur: "ADMIN",
        type_operation: "PRET_SAISIE_GARANTIE",
        montant: new Prisma.Decimal(montant),
        motif,
        solde_avant: new Prisma.Decimal(soldeAvant),
        solde_apres: new Prisma.Decimal(soldeApres),
      },
    });

    await logMouvementPret(tx, {
      id_pret: pretId,
      id_groupe: groupId,
      type_mouvement: "SAISIE_GARANTIE",
      montant,
      id_operateur: adminMemberId,
      id_membre_concerne: avalisteMemberId,
      details: motif,
    });
  });

  await notifyMembre({
    id_membre_groupe: avalisteMemberId,
    type: "PRET_SAISIE_GARANTIE",
    message: `Saisie sur garantie : ${formatPretMontant(montant)}. ${motif}`,
  });

  return { ok: true as const };
}

export async function redistributeInterets({
  groupId,
  adminMemberId,
  montant,
  mode: _mode,
  note,
}: {
  groupId: string;
  adminMemberId: string;
  montant: number;
  mode: "EQUITABLE_EPARGNE";
  note?: string;
}) {
  const caisse = await ensureCaisseInterets(groupId);
  const soldeCaisse = Number(caisse.solde_actuel);
  if (montant <= 0 || montant > soldeCaisse) {
    return { ok: false as const, status: 400, error: "Montant invalide pour la caisse intérêts." };
  }

  const members = await prisma.membreGroupe.findMany({
    where: { id_groupe: groupId, statut_adhesion: "ACTIF", compte_epargne: { isNot: null } },
    include: { compte_epargne: true, user: true },
  });

  if (members.length === 0) {
    return { ok: false as const, status: 400, error: "Aucun compte épargne actif." };
  }

  const part = Math.floor(montant / members.length);
  let remainder = montant - part * members.length;

  await prisma.$transaction(async (tx) => {
    const caisseRow = await tx.caisseFinanciere.findUniqueOrThrow({
      where: { id_caisse: caisse.id_caisse },
    });
    const caisseAvant = Number(caisseRow.solde_actuel);
    const caisseApres = roundCurrency(caisseAvant - montant);

    await tx.caisseFinanciere.update({
      where: { id_caisse: caisse.id_caisse },
      data: { solde_actuel: new Prisma.Decimal(caisseApres) },
    });

    await tx.mouvementFinancier.create({
      data: {
        id_groupe: groupId,
        id_caisse: caisse.id_caisse,
        type_mouvement: "SORTIE",
        source: "RETRAIT_GENERAL",
        montant: new Prisma.Decimal(montant),
        motif: note?.trim() || "Redistribution intérêts prêts",
        solde_avant: new Prisma.Decimal(caisseAvant),
        solde_apres: new Prisma.Decimal(caisseApres),
        id_admin_createur: adminMemberId,
        reference_type: "PRET_INTERETS",
      },
    });

    for (const member of members) {
      const account = member.compte_epargne;
      if (!account || account.statut !== "ACTIF") continue;

      let credit = part;
      if (remainder > 0) {
        credit += 1;
        remainder -= 1;
      }
      if (credit <= 0) continue;

      const soldeAvant = Number(account.solde_actuel);
      const soldeApres = roundCurrency(soldeAvant + credit);

      await tx.compteEpargne.update({
        where: { id_compte: account.id_compte },
        data: { solde_actuel: new Prisma.Decimal(soldeApres) },
      });

      await tx.mouvementEpargne.create({
        data: {
          id_compte: account.id_compte,
          id_groupe: groupId,
          id_membre_groupe: member.id_membre_groupe,
          id_operateur: adminMemberId,
          role_acteur: "ADMIN",
          type_operation: "PRET_REDISTRIBUTION_INTERETS",
          montant: new Prisma.Decimal(credit),
          motif: note?.trim() || "Part redistribution intérêts prêts",
          solde_avant: new Prisma.Decimal(soldeAvant),
          solde_apres: new Prisma.Decimal(soldeApres),
        },
      });

      await createNotification({
        userId: member.id_user,
        groupId,
        type: "PRET_REDISTRIBUTION",
        message: `Redistribution intérêts prêts : +${formatPretMontant(credit)} sur votre épargne.`,
      });
    }
  });

  return { ok: true as const };
}

export async function cancelPretDemande({
  groupId,
  pretId,
  operatorMemberId,
}: {
  groupId: string;
  pretId: string;
  operatorMemberId: string;
}) {
  const pret = await getPretWithRelations(pretId, groupId);
  if (!pret) return { ok: false as const, status: 404, error: "Introuvable." };

  if (pret.id_emprunteur !== operatorMemberId) {
    return {
      ok: false as const,
      status: 403,
      error: "Seul l'emprunteur peut annuler sa demande de prêt.",
    };
  }

  if (
    !["EN_ATTENTE_ANALYSE", "EN_ATTENTE_AVALISTES", "EN_ATTENTE_CONFIRMATION_AVALISTES", "APPROUVE"].includes(
      pret.statut,
    )
  ) {
    return { ok: false as const, status: 400, error: "Annulation impossible à ce stade (prêt déjà versé ou clos)." };
  }

  const emprunteurName = memberFullName(pret.emprunteur.user);

  await prisma.$transaction(async (tx) => {
    await tx.pret.update({ where: { id_pret: pretId }, data: { statut: "ANNULE" } });
    await tx.engagementEpargne.updateMany({
      where: { id_pret: pretId, actif: true },
      data: { actif: false, date_liberation: new Date() },
    });
    await logMouvementPret(tx, {
      id_pret: pretId,
      id_groupe: groupId,
      type_mouvement: "ANNULATION",
      id_operateur: operatorMemberId,
      details: `Demande annulée par l'emprunteur ${emprunteurName}.`,
    });
  });

  void notifyGroupAdmins({
    groupId,
    type: "PRET_ANNULE",
    message: `${emprunteurName} a annulé sa demande de prêt de ${formatPretMontant(Number(pret.montant_demande))}.`,
  });

  for (const avaliste of pret.avalistes) {
    if (["EN_ATTENTE", "CONTRAT_SOUMIS", "ACCEPTE"].includes(avaliste.statut)) {
      void notifyMembre({
        id_membre_groupe: avaliste.id_membre_groupe,
        type: "PRET_ANNULE",
        message: `La demande de prêt de ${emprunteurName} (${formatPretMontant(Number(pret.montant_demande))}) a été annulée.`,
      });
    }
  }

  return { ok: true as const };
}

export async function deletePretDemande({
  groupId,
  pretId,
  operatorMemberId,
}: {
  groupId: string;
  pretId: string;
  operatorMemberId: string;
}) {
  const pret = await prisma.pret.findFirst({
    where: { id_pret: pretId, id_groupe: groupId },
    select: {
      id_pret: true,
      id_emprunteur: true,
      statut: true,
      date_decaissement: true,
    },
  });

  if (!pret) return { ok: false as const, status: 404, error: "Introuvable." };

  if (pret.id_emprunteur !== operatorMemberId) {
    return {
      ok: false as const,
      status: 403,
      error: "Seul l'emprunteur peut supprimer sa demande.",
    };
  }

  if (pret.statut !== "ANNULE") {
    return {
      ok: false as const,
      status: 400,
      error: "Seules les demandes annulées peuvent être supprimées.",
    };
  }

  if (pret.date_decaissement) {
    return {
      ok: false as const,
      status: 400,
      error: "Impossible de supprimer un prêt déjà décaissé.",
    };
  }

  await prisma.pret.delete({ where: { id_pret: pretId } });

  return { ok: true as const };
}

export { getPretWithRelations, ensureParametresPret };
