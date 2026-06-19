import type { PaymentTransaction } from "@/lib/generated/prisma";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import {
  getRubriqueSolde,
  notifyGroupMembersRubriqueRetrait,
} from "@/lib/rubrique-caisse";
import { majStatutMembre } from "@/lib/membre-statut";
import {
  allocateMemberPayment,
  getMemberDebtSummary,
} from "@/lib/cycle-member-debts";
import { applyPaymentAllocations } from "@/lib/cycle-payment-processor";
import { applyAutomaticOverduePenalties } from "@/lib/cycle-penalties";
import { getCycleTurnSnapshot } from "@/lib/cycle-turns";
import {
  getBeneficiaireTour,
  versementExistePourTour,
  calculerPotTour,
} from "@/lib/cycle-distributions";
import { finalizeTourPenalties } from "@/lib/cycle-penalties";
import {
  caisseAmendesReunion,
  caisseCycle,
  caisseGenerale,
  caissePenalitesCycle,
  caisseRubrique,
  recordMouvementFinancier,
} from "@/lib/financial-journal";
import { recordEpargneOperation } from "@/lib/epargne";
import { disbursePret, getPretWithRelations, recordPretRepayment } from "@/lib/pret";
import type { PaymentMetadata } from "@/lib/payment-amounts";
import { runExtendedTransaction } from "@/lib/prisma-transaction";

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

function asMetadata(value: unknown): PaymentMetadata {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as PaymentMetadata;
  }
  return {};
}

async function resolveOperatorId(groupId: string, memberId: string) {
  const admin = await prisma.membreGroupe.findFirst({
    where: { id_groupe: groupId, role: "ADMIN", statut_adhesion: "ACTIF" },
    select: { id_membre_groupe: true },
    orderBy: { date_adhesion: "asc" },
  });
  return admin?.id_membre_groupe ?? memberId;
}

function paymentTransactionNote(transaction: PaymentTransaction) {
  return `Mobile Money tx:${transaction.id_transaction} ref:${transaction.provider_reference ?? "pending"}`;
}

async function findRubriquePaymentResult(
  transaction: PaymentTransaction,
  rubriqueId: string,
  memberId: string,
) {
  if (transaction.id_resultat) {
    return transaction.id_resultat;
  }

  const existingPaiement = await prisma.paiementRubrique.findFirst({
    where: {
      id_rubrique: rubriqueId,
      id_membre_groupe: memberId,
      note: { contains: transaction.id_transaction },
    },
    orderBy: { date_paiement: "desc" },
    select: { id_paiement: true },
  });

  if (existingPaiement) {
    return existingPaiement.id_paiement;
  }

  const existingMovement = await prisma.mouvementFinancier.findFirst({
    where: {
      id_groupe: transaction.id_groupe,
      reference_type: "payment_transactions",
      reference_id: transaction.id_transaction,
    },
    select: { id_mouvement: true },
  });

  if (!existingMovement) {
    return null;
  }

  return null;
}

export async function finalizePaymentTransaction(
  transaction: PaymentTransaction,
): Promise<{ ok: true; resultId?: string } | { ok: false; error: string }> {
  if (transaction.id_resultat) {
    return { ok: true, resultId: transaction.id_resultat };
  }

  const existingMovement = await prisma.mouvementFinancier.findFirst({
    where: {
      id_groupe: transaction.id_groupe,
      reference_type: "payment_transactions",
      reference_id: transaction.id_transaction,
    },
    select: { id_mouvement: true },
  });

  if (existingMovement) {
    return { ok: true, resultId: transaction.id_resultat ?? undefined };
  }

  const metadata = asMetadata(transaction.metadata);
  const operatorId = await resolveOperatorId(transaction.id_groupe, transaction.id_membre_groupe);

  try {
    switch (transaction.context_type) {
      case "CYCLE_COTISATION":
        return finalizeCycleCotisation(transaction, metadata, operatorId);
      case "RUBRIQUE":
        return finalizeRubriquePayment(transaction, metadata, operatorId);
      case "AMENDE_REUNION":
        return finalizeAmendePayment(transaction, metadata, operatorId);
      case "EPARGNE_DEPOT":
        return finalizeEpargneDepot(transaction, metadata, operatorId);
      case "PRET_REMBOURSEMENT":
        return finalizePretRepayment(transaction, metadata);
      case "CYCLE_DISTRIBUTION":
        return finalizeCycleDistribution(transaction, metadata, operatorId);
      case "PRET_DECAISSEMENT":
        return finalizePretDecaissement(transaction, metadata, operatorId);
      case "RUBRIQUE_RETRAIT":
        return finalizeRubriqueRetrait(transaction, metadata, operatorId);
      case "PENALITE_RETRAIT":
        return finalizePenaliteRetrait(transaction, metadata, operatorId);
      case "AMENDE_RETRAIT":
        return finalizeAmendeRetrait(transaction, metadata, operatorId);
      case "EPARGNE_RETRAIT":
        return finalizeEpargneRetrait(transaction, metadata, operatorId);
      default:
        return { ok: false, error: "Contexte non pris en charge." };
    }
  } catch {
    return { ok: false, error: "Erreur lors de la finalisation du paiement." };
  }
}

async function finalizeCycleCotisation(
  transaction: PaymentTransaction,
  metadata: PaymentMetadata,
  operatorId: string,
) {
  const cycleId = String(metadata.cycleId ?? transaction.context_id);
  const targetMemberId = String(metadata.targetMemberId ?? transaction.id_membre_groupe);
  const montant = Number(metadata.montant ?? transaction.montant);
  const datePaiement = new Date();

  const cycle = await prisma.cycleTontine.findFirst({
    where: { id_cycle: cycleId, id_groupe: transaction.id_groupe },
    select: {
      id_cycle: true,
      nom_cycle: true,
      date_debut: true,
      duree_tour_de_gain: true,
      mode_penalite: true,
      valeur_penalite: true,
      versements: { select: { numero_tour: true, date_versement: true } },
    },
  });

  if (!cycle) return { ok: false as const, error: "Cycle introuvable." };

  await applyAutomaticOverduePenalties(cycleId);
  const debt = await getMemberDebtSummary(cycleId, targetMemberId, datePaiement);
  if (!debt || debt.totalDue <= 0) {
    return { ok: false as const, error: "Aucune dette en attente." };
  }

  const montantRecu = roundCurrency(montant);
  if (montantRecu > debt.totalDue) {
    return { ok: false as const, error: "Montant supérieur à la dette." };
  }

  const { allocations, error } = allocateMemberPayment(montantRecu, debt.slices);
  if (error) return { ok: false as const, error };

  const createdIds = await runExtendedTransaction((tx) =>
    applyPaymentAllocations(tx, {
      groupId: transaction.id_groupe,
      cycle: {
        id_cycle: cycle.id_cycle,
        nom_cycle: cycle.nom_cycle,
        date_debut: cycle.date_debut,
        duree_tour_de_gain: cycle.duree_tour_de_gain,
        mode_penalite: cycle.mode_penalite,
        valeur_penalite: cycle.valeur_penalite ? Number(cycle.valeur_penalite) : null,
      },
      versements: cycle.versements,
      memberId: targetMemberId,
      adminId: operatorId,
      datePaiement,
      allocations,
    }),
  );

  const snapshot = await getCycleTurnSnapshot(cycleId);
  const targetMember = await prisma.membreGroupe.findUnique({
    where: { id_membre_groupe: targetMemberId },
    select: { id_user: true, groupe: { select: { nom: true } } },
  });

  if (targetMember) {
    const tourLabel = snapshot.activeTour
      ? `tour actif ${snapshot.activeTour}`
      : "règlement des arriérés";

    await createNotification({
      userId: targetMember.id_user,
      groupId: transaction.id_groupe,
      type: "PAIEMENT_RECU",
      message: `Votre versement Mobile Money de ${montantRecu.toLocaleString("fr-FR")} (${tourLabel}) du cycle "${cycle.nom_cycle}" (Groupe : ${targetMember.groupe.nom}) a été confirmé. Réf. ${transaction.provider_reference}.`,
    });
  }

  majStatutMembre(targetMemberId).catch(() => null);
  return { ok: true as const, resultId: createdIds[0] };
}

async function finalizeRubriquePayment(
  transaction: PaymentTransaction,
  metadata: PaymentMetadata,
  operatorId: string,
) {
  const rubriqueId = String(metadata.rubriqueId ?? transaction.context_id);
  const memberId = transaction.id_membre_groupe;
  const montant = Number(metadata.montant ?? transaction.montant);

  const rubrique = await prisma.rubriqueCotisation.findFirst({
    where: { id_rubrique: rubriqueId, id_groupe: transaction.id_groupe },
    select: {
      nom: true,
      montant_fixe: true,
      paiements: {
        where: { id_membre_groupe: memberId },
        select: { montant_paye: true },
      },
      membres_concernes: {
        where: { id_membre_groupe: memberId },
        select: { id_membre_rubrique: true },
      },
    },
  });

  if (!rubrique || rubrique.membres_concernes.length === 0) {
    return { ok: false as const, error: "Rubrique ou membre invalide." };
  }

  const due = Number(rubrique.montant_fixe);
  const paid = rubrique.paiements.reduce((acc, p) => acc + Number(p.montant_paye), 0);
  const remaining = roundCurrency(due - paid);
  if (montant > remaining) return { ok: false as const, error: "Montant trop élevé." };

  const existingResultId = await findRubriquePaymentResult(transaction, rubriqueId, memberId);
  if (existingResultId) {
    return { ok: true as const, resultId: existingResultId };
  }

  const paiement = await runExtendedTransaction(async (tx) => {
    const existingMovement = await tx.mouvementFinancier.findFirst({
      where: {
        id_groupe: transaction.id_groupe,
        reference_type: "payment_transactions",
        reference_id: transaction.id_transaction,
      },
      select: { id_mouvement: true },
    });

    if (existingMovement) {
      const existing = await tx.paiementRubrique.findFirst({
        where: {
          id_rubrique: rubriqueId,
          id_membre_groupe: memberId,
          note: { contains: transaction.id_transaction },
        },
        include: { membre: { select: { id_user: true } }, rubrique: { select: { nom: true } } },
      });
      if (existing) {
        return existing;
      }
    }

    const created = await tx.paiementRubrique.create({
      data: {
        id_rubrique: rubriqueId,
        id_membre_groupe: memberId,
        montant_paye: montant,
        note: paymentTransactionNote(transaction),
      },
      include: { membre: { select: { id_user: true } }, rubrique: { select: { nom: true } } },
    });

    await recordMouvementFinancier(tx, {
      groupId: transaction.id_groupe,
      caisse: caisseRubrique(rubriqueId, rubrique.nom),
      type: "ENTREE",
      source: "PAIEMENT_RUBRIQUE",
      montant,
      motif: `Paiement Mobile Money rubrique ${rubrique.nom}`,
      adminId: operatorId,
      membreId: memberId,
      referenceType: "payment_transactions",
      referenceId: transaction.id_transaction,
      dateMouvement: new Date(),
    });

    return created;
  });

  await createNotification({
    userId: paiement.membre.id_user,
    groupId: transaction.id_groupe,
    type: "PAIEMENT_RECU",
    message: `Votre paiement Mobile Money de ${montant.toLocaleString("fr-FR")} pour "${paiement.rubrique.nom}" a été confirmé. Réf. ${transaction.provider_reference}.`,
  });

  majStatutMembre(memberId).catch(() => null);
  return { ok: true as const, resultId: paiement.id_paiement };
}

async function finalizeAmendePayment(
  transaction: PaymentTransaction,
  metadata: PaymentMetadata,
  operatorId: string,
) {
  const presenceId = String(metadata.presenceId ?? transaction.context_id);

  const presence = await prisma.presenceReunion.findFirst({
    where: {
      id_presence: presenceId,
      id_membre_groupe: transaction.id_membre_groupe,
      reunion: { id_groupe: transaction.id_groupe },
    },
    select: {
      id_presence: true,
      amende_payee: true,
      statut_presence: true,
      reunion: {
        select: {
          titre: true,
          date_reunion: true,
          montant_amende: true,
          id_groupe: true,
          statut: true,
        },
      },
      membre_groupe: { select: { id_user: true } },
    },
  });

  if (!presence) {
    return { ok: false as const, error: "Amende introuvable." };
  }
  if (presence.amende_payee) {
    return { ok: true as const, resultId: presenceId };
  }

  const montantAmende = Number(presence.reunion.montant_amende ?? 0);

  await runExtendedTransaction(async (tx) => {
    await tx.presenceReunion.update({
      where: { id_presence: presenceId },
      data: { amende_payee: true },
    });

    await recordMouvementFinancier(tx, {
      groupId: transaction.id_groupe,
      caisse: caisseAmendesReunion(),
      type: "ENTREE",
      source: "AMENDE_REUNION",
      montant: montantAmende,
      motif: `Amende Mobile Money - ${presence.reunion.titre}`,
      adminId: operatorId,
      membreId: transaction.id_membre_groupe,
      referenceType: "payment_transactions",
      referenceId: transaction.id_transaction,
      dateMouvement: new Date(),
    });
  });

  await createNotification({
    userId: presence.membre_groupe.id_user,
    groupId: transaction.id_groupe,
    type: "AMENDE_PAYEE",
    message: `✅ Votre amende Mobile Money de ${montantAmende.toLocaleString("fr-FR")} pour "${presence.reunion.titre}" a été confirmée. Réf. ${transaction.provider_reference}.`,
  });

  majStatutMembre(transaction.id_membre_groupe).catch(() => null);
  return { ok: true as const, resultId: presenceId };
}

async function finalizeEpargneDepot(
  transaction: PaymentTransaction,
  metadata: PaymentMetadata,
  operatorId: string,
) {
  const accountId = String(metadata.accountId ?? transaction.context_id);
  const montant = Number(metadata.montant ?? transaction.montant);

  const result = await recordEpargneOperation({
    groupId: transaction.id_groupe,
    accountId,
    operatorMemberId: operatorId,
    type: "DEPOT",
    montant,
    motif: `Dépôt Mobile Money - ${transaction.provider_reference}`,
  });

  if (!result.ok) return { ok: false as const, error: result.error };
  return { ok: true as const, resultId: result.movement?.id_mouvement };
}

async function finalizePretRepayment(transaction: PaymentTransaction, metadata: PaymentMetadata) {
  const pretId = String(metadata.pretId ?? transaction.context_id);
  const montant = Number(metadata.montant ?? transaction.montant);
  const initiatedBy =
    typeof metadata.initiatedByMemberId === "string" ? metadata.initiatedByMemberId : null;
  const operatorId =
    initiatedBy ?? (await resolveOperatorId(transaction.id_groupe, transaction.id_membre_groupe));

  const result = await recordPretRepayment({
    groupId: transaction.id_groupe,
    pretId,
    adminMemberId: operatorId,
    montant,
    note: `Mobile Money - ${transaction.provider_reference}`,
  });

  if (!result.ok) return { ok: false as const, error: result.error };
  return { ok: true as const, resultId: pretId };
}

async function finalizeCycleDistribution(
  transaction: PaymentTransaction,
  metadata: PaymentMetadata,
  operatorId: string,
) {
  const cycleId = String(metadata.cycleId ?? transaction.context_id);
  const numeroTour = Number(metadata.numero_tour);
  const montantVerse = Number(metadata.montant ?? transaction.montant);

  if (await versementExistePourTour(cycleId, numeroTour)) {
    return { ok: false as const, error: "Tour déjà distribué." };
  }

  const cycle = await prisma.cycleTontine.findFirst({
    where: { id_cycle: cycleId, id_groupe: transaction.id_groupe },
    select: {
      id_cycle: true,
      nom_cycle: true,
      groupe: { select: { nom: true, devise: true } },
    },
  });

  if (!cycle) return { ok: false as const, error: "Cycle introuvable." };

  const beneficiaireParticipant = await getBeneficiaireTour(cycleId, numeroTour);
  if (!beneficiaireParticipant) {
    return { ok: false as const, error: "Bénéficiaire introuvable." };
  }

  await finalizeTourPenalties(cycleId, numeroTour);

  const versement = await runExtendedTransaction(async (tx) => {
    const created = await tx.versement.create({
      data: {
        id_cycle: cycleId,
        id_beneficiaire: beneficiaireParticipant.id_membre_groupe,
        numero_tour: numeroTour,
        montant_verse: montantVerse,
        date_versement: new Date(),
        mode_versement: "MOBILE_MONEY",
        reference_externe: transaction.provider_reference,
        id_admin_valideur: operatorId,
      },
      select: { id_versement: true },
    });

    await recordMouvementFinancier(tx, {
      groupId: transaction.id_groupe,
      caisse: caisseCycle(cycleId, cycle.nom_cycle),
      type: "SORTIE",
      source: "VERSEMENT_BENEFICIAIRE",
      montant: montantVerse,
      motif: `Versement Mobile Money tour ${numeroTour}`,
      adminId: operatorId,
      membreId: beneficiaireParticipant.id_membre_groupe,
      referenceType: "payment_transactions",
      referenceId: transaction.id_transaction,
      dateMouvement: new Date(),
    });

    return created;
  });

  const nomBeneficiaire = `${beneficiaireParticipant.membre_groupe.user.prenom} ${beneficiaireParticipant.membre_groupe.user.nom}`;

  await createNotification({
    userId: beneficiaireParticipant.membre_groupe.id_user,
    groupId: transaction.id_groupe,
    type: "PAIEMENT_RECU",
    message: `🎉 Vous avez reçu ${montantVerse.toLocaleString("fr-FR")} ${cycle.groupe.devise} via Mobile Money (tour ${numeroTour}). Réf. ${transaction.provider_reference}.`,
  });

  await calculerPotTour(cycleId, numeroTour);
  return { ok: true as const, resultId: versement.id_versement };
}

async function finalizePretDecaissement(
  transaction: PaymentTransaction,
  metadata: PaymentMetadata,
  operatorId: string,
) {
  const pretId = String(metadata.pretId ?? transaction.context_id);
  const result = await disbursePret({
    groupId: transaction.id_groupe,
    pretId,
    adminMemberId: operatorId,
  });

  if (!result.ok) return { ok: false as const, error: result.error };

  const pret = await getPretWithRelations(pretId, transaction.id_groupe);
  if (pret) {
    await createNotification({
      userId: pret.emprunteur.id_user,
      groupId: transaction.id_groupe,
      type: "PRET_DECAISSEMENT",
      message: `Votre prêt de ${Number(pret.montant_approuve).toLocaleString("fr-FR")} a été versé via Mobile Money. Réf. ${transaction.provider_reference}.`,
    });
  }

  return { ok: true as const, resultId: pretId };
}

async function finalizeRubriqueRetrait(
  transaction: PaymentTransaction,
  metadata: PaymentMetadata,
  operatorId: string,
) {
  const montant = Number(metadata.montant ?? transaction.montant);
  const motif = String(metadata.motif ?? "Retrait Mobile Money");
  const rubriqueId =
    typeof metadata.rubriqueId === "string" ? metadata.rubriqueId : undefined;

  const rubrique = rubriqueId
    ? await prisma.rubriqueCotisation.findFirst({
        where: { id_rubrique: rubriqueId, id_groupe: transaction.id_groupe },
        select: { id_rubrique: true, nom: true },
      })
    : null;

  const retrait = await runExtendedTransaction(async (tx) => {
    const created = await tx.retrait.create({
      data: {
        id_groupe: transaction.id_groupe,
        id_admin_valideur: operatorId,
        montant,
        motif: `${motif} - ${transaction.provider_reference}`,
        id_rubrique: rubriqueId,
      },
    });

    await recordMouvementFinancier(tx, {
      groupId: transaction.id_groupe,
      caisse: rubrique
        ? caisseRubrique(rubrique.id_rubrique, rubrique.nom)
        : caisseGenerale(transaction.id_groupe),
      type: "SORTIE",
      source: rubrique ? "RETRAIT_RUBRIQUE" : "RETRAIT_GENERAL",
      montant,
      motif: `${motif} - Mobile Money`,
      adminId: operatorId,
      referenceType: "payment_transactions",
      referenceId: transaction.id_transaction,
      dateMouvement: new Date(),
    });

    return created;
  });

  if (rubrique) {
    const soldeRestant = await getRubriqueSolde(rubrique.id_rubrique);
    await notifyGroupMembersRubriqueRetrait({
      groupId: transaction.id_groupe,
      rubriqueNom: rubrique.nom,
      montant,
      motif,
      soldeRestant,
    });
  }

  return { ok: true as const, resultId: retrait.id_retrait };
}

async function finalizePenaliteRetrait(
  transaction: PaymentTransaction,
  metadata: PaymentMetadata,
  operatorId: string,
) {
  const cycleId = String(metadata.cycleId ?? transaction.context_id);
  const montant = Number(metadata.montant ?? transaction.montant);
  const motif = String(metadata.motif ?? "Retrait pénalités Mobile Money");
  const scope = metadata.scope === "TOUR" ? "TOUR" : "CYCLE";
  const snapshot = await getCycleTurnSnapshot(cycleId);

  const cycle = await prisma.cycleTontine.findFirst({
    where: { id_cycle: cycleId, id_groupe: transaction.id_groupe },
    select: { nom_cycle: true },
  });

  if (!cycle) return { ok: false as const, error: "Cycle introuvable." };

  const retrait = await runExtendedTransaction(async (tx) => {
    const created = await tx.retraitPenalite.create({
      data: {
        id_cycle: cycleId,
        id_admin_valideur: operatorId,
        montant,
        motif: `${motif} - ${transaction.provider_reference}`,
        numero_tour: scope === "TOUR" ? snapshot.activeTour : null,
      },
    });

    await recordMouvementFinancier(tx, {
      groupId: transaction.id_groupe,
      caisse: caissePenalitesCycle(cycleId, cycle.nom_cycle),
      type: "SORTIE",
      source: "RETRAIT_PENALITE_CYCLE",
      montant,
      motif: `${motif} - Mobile Money`,
      adminId: operatorId,
      referenceType: "payment_transactions",
      referenceId: transaction.id_transaction,
      dateMouvement: new Date(),
    });

    return created;
  });

  return { ok: true as const, resultId: retrait.id_retrait_penalite };
}

async function finalizeAmendeRetrait(
  transaction: PaymentTransaction,
  metadata: PaymentMetadata,
  operatorId: string,
) {
  const montant = Number(metadata.montant ?? transaction.montant);
  const motif = String(metadata.motif ?? "Retrait amendes Mobile Money");

  const retrait = await runExtendedTransaction(async (tx) => {
    const created = await tx.retraitAmendeReunion.create({
      data: {
        id_groupe: transaction.id_groupe,
        id_admin_valideur: operatorId,
        montant,
        motif: `${motif} - ${transaction.provider_reference}`,
      },
    });

    await recordMouvementFinancier(tx, {
      groupId: transaction.id_groupe,
      caisse: caisseAmendesReunion(),
      type: "SORTIE",
      source: "RETRAIT_AMENDES_REUNION",
      montant,
      motif: `${motif} - Mobile Money`,
      adminId: operatorId,
      referenceType: "payment_transactions",
      referenceId: transaction.id_transaction,
      dateMouvement: new Date(),
    });

    return created;
  });

  return { ok: true as const, resultId: retrait.id_retrait_amende };
}

async function finalizeEpargneRetrait(
  transaction: PaymentTransaction,
  metadata: PaymentMetadata,
  operatorId: string,
) {
  const accountId = String(metadata.accountId ?? transaction.context_id);
  const montant = Number(metadata.montant ?? transaction.montant);
  const motif = String(metadata.motif ?? "Retrait Mobile Money");

  const result = await recordEpargneOperation({
    groupId: transaction.id_groupe,
    accountId,
    operatorMemberId: operatorId,
    type: "RETRAIT",
    montant,
    motif: `${motif} - ${transaction.provider_reference}`,
  });

  if (!result.ok) return { ok: false as const, error: result.error };
  return { ok: true as const, resultId: result.movement?.id_mouvement };
}
