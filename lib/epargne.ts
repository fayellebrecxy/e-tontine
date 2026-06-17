import { Prisma } from "@/lib/generated/prisma";

import { prisma } from "@/lib/prisma";
import { createNotification, notifyGroupAdmins } from "@/lib/notifications";

const MONEY_FORMATTER = new Intl.NumberFormat("fr-FR", {
  maximumFractionDigits: 0,
});

export function formatMontant(montant: number | Prisma.Decimal, devise = "FCFA") {
  const value = typeof montant === "number" ? montant : Number(montant);
  return `${MONEY_FORMATTER.format(value)} ${devise}`;
}

function buildAccountNumber(groupId: string, rank: number) {
  return `EP-${groupId.slice(0, 4).toUpperCase()}-${String(rank).padStart(4, "0")}`;
}

async function createAccountWithAvailableNumber(memberId: string, groupId: string) {
  const count = await prisma.compteEpargne.count({
    where: { id_groupe: groupId },
  });

  for (let offset = 1; offset <= 100; offset += 1) {
    const numeroCompte = buildAccountNumber(groupId, count + offset);
    const existingNumber = await prisma.compteEpargne.findUnique({
      where: { numero_compte: numeroCompte },
      select: { id_compte: true },
    });

    if (!existingNumber) {
      return prisma.compteEpargne.create({
        data: {
          id_groupe: groupId,
          id_membre_groupe: memberId,
          numero_compte: numeroCompte,
        },
        select: {
          id_compte: true,
          numero_compte: true,
          membre: {
            select: {
              id_user: true,
              user: { select: { nom: true, prenom: true } },
            },
          },
        },
      });
    }
  }

  throw new Error("Impossible de générer un numéro de compte épargne.");
}

export async function ensureEpargneAccountForMember(memberId: string) {
  const existing = await prisma.compteEpargne.findUnique({
    where: { id_membre_groupe: memberId },
    select: { id_compte: true },
  });
  if (existing) return existing;

  const member = await prisma.membreGroupe.findUnique({
    where: { id_membre_groupe: memberId },
    select: { id_membre_groupe: true, id_groupe: true },
  });
  if (!member) return null;

  return createAccountWithAvailableNumber(member.id_membre_groupe, member.id_groupe);
}

export async function ensureEpargneAccountsForGroup(groupId: string) {
  const members = await prisma.membreGroupe.findMany({
    where: { id_groupe: groupId, statut_adhesion: "ACTIF" },
    select: { id_membre_groupe: true },
    orderBy: { date_adhesion: "asc" },
  });

  const created = [];
  for (const member of members) {
    const account = await ensureEpargneAccountForMember(member.id_membre_groupe);
    if (account) created.push(account);
  }

  return created;
}

export async function openEpargneAccountForMember({
  groupId,
  memberId,
}: {
  groupId: string;
  memberId: string;
}) {
  const member = await prisma.membreGroupe.findFirst({
    where: { id_membre_groupe: memberId, id_groupe: groupId, statut_adhesion: "ACTIF" },
    select: {
      id_membre_groupe: true,
      id_groupe: true,
      id_user: true,
      user: { select: { nom: true, prenom: true } },
      compte_epargne: { select: { id_compte: true, numero_compte: true } },
    },
  });

  if (!member) {
    return { ok: false as const, status: 404, error: "Membre introuvable" };
  }

  if (member.compte_epargne) {
    return {
      ok: true as const,
      created: false,
      account: member.compte_epargne,
      member,
    };
  }

  const account = await createAccountWithAvailableNumber(member.id_membre_groupe, member.id_groupe);

  await createNotification({
    userId: member.id_user,
    groupId,
    type: "EPARGNE_COMPTE_OUVERT",
    message: `Votre compte épargne ${account.numero_compte} a été ouvert. Il est maintenant visible dans Ma banque.`,
  });

  return { ok: true as const, created: true, account, member };
}

export async function openEpargneAccountsForGroup(groupId: string) {
  const members = await prisma.membreGroupe.findMany({
    where: {
      id_groupe: groupId,
      statut_adhesion: "ACTIF",
      compte_epargne: null,
    },
    select: { id_membre_groupe: true },
    orderBy: { date_adhesion: "asc" },
  });

  const created = [];
  for (const member of members) {
    const result = await openEpargneAccountForMember({
      groupId,
      memberId: member.id_membre_groupe,
    });
    if (result.ok && result.created) created.push(result.account);
  }

  return created;
}

export type EpargneOperationInput = {
  groupId: string;
  accountId: string;
  operatorMemberId: string;
  type: "DEPOT" | "RETRAIT";
  montant: number;
  motif: string;
};

export async function recordEpargneOperation(input: EpargneOperationInput) {
  if (!Number.isFinite(input.montant) || input.montant <= 0) {
    return { ok: false as const, status: 400, error: "Le montant doit être un nombre positif" };
  }

  const motif = input.motif.trim();
  if (motif.length < 5) {
    return { ok: false as const, status: 400, error: "Le motif est obligatoire (minimum 5 caractères)" };
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const account = await tx.compteEpargne.findFirst({
        where: { id_compte: input.accountId, id_groupe: input.groupId },
        select: {
          id_compte: true,
          numero_compte: true,
          id_groupe: true,
          id_membre_groupe: true,
          solde_actuel: true,
          statut: true,
          membre: {
            select: {
              id_user: true,
              user: { select: { nom: true, prenom: true } },
              groupe: { select: { devise: true } },
            },
          },
        },
      });

      if (!account) {
        return { ok: false as const, status: 404, error: "Compte épargne introuvable" };
      }

      if (account.statut !== "ACTIF") {
        return { ok: false as const, status: 400, error: "Ce compte épargne n'est pas actif" };
      }

      const operator = await tx.membreGroupe.findFirst({
        where: {
          id_membre_groupe: input.operatorMemberId,
          id_groupe: input.groupId,
          role: "ADMIN",
          statut_adhesion: "ACTIF",
        },
        select: {
          id_membre_groupe: true,
          role: true,
          user: { select: { nom: true, prenom: true } },
        },
      });

      if (!operator) {
        return { ok: false as const, status: 403, error: "Action non autorisée pour ce rôle" };
      }

      const soldeAvant = Number(account.solde_actuel);
      if (input.type === "RETRAIT") {
        const { getEpargneDisponible } = await import("@/lib/pret-banque");
        const disponible = await getEpargneDisponible(account.id_compte, tx);
        if (input.montant > disponible) {
          const engage = soldeAvant - disponible;
          return {
            ok: false as const,
            status: 400,
            error: `Solde disponible insuffisant (${formatMontant(disponible, account.membre.groupe.devise)}${engage > 0 ? ` — ${formatMontant(engage, account.membre.groupe.devise)} engagés en garantie prêt` : ""}).`,
          };
        }
      }

      const soldeApres = input.type === "DEPOT"
        ? soldeAvant + input.montant
        : soldeAvant - input.montant;

      const updatedAccount = await tx.compteEpargne.update({
        where: { id_compte: account.id_compte },
        data: { solde_actuel: new Prisma.Decimal(soldeApres) },
        select: { solde_actuel: true },
      });

      const movement = await tx.mouvementEpargne.create({
        data: {
          id_compte: account.id_compte,
          id_groupe: account.id_groupe,
          id_membre_groupe: account.id_membre_groupe,
          id_operateur: operator.id_membre_groupe,
          role_acteur: "ADMIN",
          type_operation: input.type,
          montant: new Prisma.Decimal(input.montant),
          motif,
          solde_avant: new Prisma.Decimal(soldeAvant),
          solde_apres: new Prisma.Decimal(soldeApres),
        },
        select: {
          id_mouvement: true,
          date_operation: true,
          type_operation: true,
          montant: true,
          solde_apres: true,
        },
      });

      return {
        ok: true as const,
        account,
        operator,
        movement,
        soldeActuel: updatedAccount.solde_actuel,
      };
    });

    if (!result.ok) return result;

    const devise = result.account.membre.groupe.devise;
    const operatorName = `${result.operator.user.prenom} ${result.operator.user.nom}`;
    const operationLabel = result.movement.type_operation === "DEPOT" ? "Dépôt" : "Retrait";
    const time = result.movement.date_operation.toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    await createNotification({
      userId: result.account.membre.id_user,
      groupId: input.groupId,
      type: "EPARGNE_OPERATION",
      message: `${operationLabel} épargne enregistré : ${formatMontant(result.movement.montant, devise)}. Nouveau solde : ${formatMontant(result.movement.solde_apres, devise)}. Effectué par ${operatorName} le ${time}.`,
    });

    return result;
  } catch {
    return { ok: false as const, status: 500, error: "Échec de transaction. Aucune donnée n'a été enregistrée." };
  }
}

export async function signalerMouvementEpargne({
  groupId,
  movementId,
  memberId,
  motif,
}: {
  groupId: string;
  movementId: string;
  memberId: string;
  motif: string;
}) {
  const cleanMotif = motif.trim();
  if (cleanMotif.length < 5) {
    return { ok: false as const, status: 400, error: "Le motif est obligatoire (minimum 5 caractères)" };
  }

  const movement = await prisma.mouvementEpargne.findFirst({
    where: {
      id_mouvement: movementId,
      id_groupe: groupId,
      id_membre_groupe: memberId,
    },
    select: {
      id_mouvement: true,
      id_compte: true,
      id_membre_groupe: true,
      type_operation: true,
      montant: true,
      compte: { select: { numero_compte: true } },
      membre: { select: { user: { select: { nom: true, prenom: true } } } },
    },
  });

  if (!movement) {
    return { ok: false as const, status: 403, error: "Accès refusé" };
  }

  await prisma.signalementEpargne.create({
    data: {
      id_compte: movement.id_compte,
      id_mouvement: movement.id_mouvement,
      id_membre_groupe: movement.id_membre_groupe,
      motif: cleanMotif,
    },
  });

  await notifyGroupAdmins({
    groupId,
    type: "EPARGNE_SIGNALEMENT",
    message: `${movement.membre.user.prenom} ${movement.membre.user.nom} a signalé une anomalie sur le compte ${movement.compte.numero_compte} : ${cleanMotif}`,
  });

  return { ok: true as const };
}
