import type { PaymentContextType, PaymentDirection } from "@/lib/generated/prisma";
import { prisma } from "@/lib/prisma";
import { getMemberDebtSummary } from "@/lib/cycle-member-debts";
import { getCycleTurnSnapshot } from "@/lib/cycle-turns";
import { getPretWithRelations } from "@/lib/pret";
import { applyAutomaticOverduePenalties } from "@/lib/cycle-penalties";

export type PaymentMetadata = Record<string, unknown>;

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

function readMontant(metadata: PaymentMetadata | null | undefined) {
  const value = metadata?.montant;
  return typeof value === "number" && Number.isFinite(value) ? roundCurrency(value) : null;
}

export async function resolvePaymentAmount(input: {
  groupId: string;
  contextType: PaymentContextType;
  contextId: string;
  memberId: string;
  direction: PaymentDirection;
  metadata?: PaymentMetadata | null;
}): Promise<
  | { ok: true; montant: number; devise: string; metadata: PaymentMetadata }
  | { ok: false; error: string }
> {
  const metadata: PaymentMetadata = { ...(input.metadata ?? {}) };
  const requestedMontant = readMontant(metadata);

  const group = await prisma.groupes.findUnique({
    where: { id_groupe: input.groupId },
    select: { devise: true },
  });

  if (!group) {
    return { ok: false, error: "Groupe introuvable." };
  }

  const devise = group.devise;

  switch (input.contextType) {
    case "CYCLE_COTISATION": {
      const cycleId = input.contextId;
      const targetMemberId =
        (typeof metadata.targetMemberId === "string" && metadata.targetMemberId) || input.memberId;

      await applyAutomaticOverduePenalties(cycleId);
      const debt = await getMemberDebtSummary(cycleId, targetMemberId, new Date());

      if (!debt || debt.totalDue <= 0) {
        return { ok: false, error: "Aucune cotisation ou pénalité en attente." };
      }

      const montant = requestedMontant ?? debt.totalDue;
      if (montant <= 0 || montant > debt.totalDue) {
        return {
          ok: false,
          error: `Montant invalide. Total dû : ${debt.totalDue.toLocaleString("fr-FR")} ${devise}.`,
        };
      }

      metadata.targetMemberId = targetMemberId;
      metadata.montant = montant;
      metadata.cycleId = cycleId;
      return { ok: true, montant, devise, metadata };
    }

    case "RUBRIQUE": {
      const rubrique = await prisma.rubriqueCotisation.findFirst({
        where: { id_rubrique: input.contextId, id_groupe: input.groupId },
        select: {
          montant_fixe: true,
          membres_concernes: {
            where: { id_membre_groupe: input.memberId },
            select: { id_membre_rubrique: true },
          },
          paiements: {
            where: { id_membre_groupe: input.memberId },
            select: { montant_paye: true },
          },
        },
      });

      if (!rubrique) return { ok: false, error: "Rubrique introuvable." };
      if (rubrique.membres_concernes.length === 0) {
        return { ok: false, error: "Vous n'êtes pas concerné par cette rubrique." };
      }

      const due = Number(rubrique.montant_fixe);
      const paid = rubrique.paiements.reduce((acc, p) => acc + Number(p.montant_paye), 0);
      const remaining = roundCurrency(due - paid);

      if (remaining <= 0) {
        return { ok: false, error: "Cette rubrique est déjà soldée." };
      }

      const montant = requestedMontant ?? remaining;
      if (montant <= 0 || montant > remaining) {
        return {
          ok: false,
          error: `Montant invalide. Reste à payer : ${remaining.toLocaleString("fr-FR")} ${devise}.`,
        };
      }

      metadata.montant = montant;
      metadata.rubriqueId = input.contextId;
      return { ok: true, montant, devise, metadata };
    }

    case "AMENDE_REUNION": {
      const presenceId = input.contextId;
      const reunionId =
        typeof metadata.reunionId === "string" ? metadata.reunionId : undefined;

      const presence = await prisma.presenceReunion.findFirst({
        where: {
          id_presence: presenceId,
          id_membre_groupe: input.memberId,
          ...(reunionId ? { id_reunion: reunionId } : {}),
          reunion: { id_groupe: input.groupId },
        },
        select: {
          amende_payee: true,
          statut_presence: true,
          reunion: {
            select: {
              id_reunion: true,
              statut: true,
              date_reunion: true,
              montant_amende: true,
            },
          },
        },
      });

      if (!presence) return { ok: false, error: "Présence introuvable." };
      if (presence.amende_payee) return { ok: false, error: "Amende déjà payée." };
      if (presence.reunion.statut !== "TERMINEE" || presence.reunion.date_reunion.getTime() > Date.now()) {
        return { ok: false, error: "Cette amende n'est pas encore payable." };
      }
      if (presence.statut_presence !== "ABSENT" && presence.statut_presence !== "EN_RETARD") {
        return { ok: false, error: "Aucune amende applicable." };
      }

      const montant = Number(presence.reunion.montant_amende ?? 0);
      if (montant <= 0) return { ok: false, error: "Aucune amende définie." };

      metadata.reunionId = presence.reunion.id_reunion;
      metadata.presenceId = presenceId;
      metadata.montant = montant;
      return { ok: true, montant, devise, metadata };
    }

    case "EPARGNE_DEPOT": {
      if (!requestedMontant || requestedMontant <= 0) {
        return { ok: false, error: "Indiquez un montant de dépôt valide." };
      }

      const account = await prisma.compteEpargne.findFirst({
        where: {
          id_compte: input.contextId,
          id_groupe: input.groupId,
          statut: "ACTIF",
        },
        select: { id_compte: true, id_membre_groupe: true },
      });

      if (!account) return { ok: false, error: "Compte épargne introuvable." };

      metadata.accountId = input.contextId;
      metadata.accountMemberId = account.id_membre_groupe;
      metadata.montant = requestedMontant;
      return { ok: true, montant: requestedMontant, devise, metadata };
    }

    case "PRET_REMBOURSEMENT": {
      if (!requestedMontant || requestedMontant <= 0) {
        return { ok: false, error: "Indiquez un montant de remboursement valide." };
      }

      const pret = await getPretWithRelations(input.contextId, input.groupId);
      if (!pret || !["EN_COURS", "EN_RETARD"].includes(pret.statut)) {
        return { ok: false, error: "Prêt non remboursable." };
      }
      if (pret.emprunteur.id_membre_groupe !== input.memberId) {
        return { ok: false, error: "Seul l'emprunteur peut rembourser ce prêt." };
      }

      metadata.pretId = input.contextId;
      metadata.montant = requestedMontant;
      return { ok: true, montant: requestedMontant, devise, metadata };
    }

    case "CYCLE_DISTRIBUTION": {
      const cycleId = input.contextId;
      const numeroTour = metadata.numero_tour;
      const montantVerse = readMontant(metadata);

      if (typeof numeroTour !== "number" || !montantVerse || montantVerse <= 0) {
        return { ok: false, error: "Données de distribution invalides." };
      }

      const snapshot = await getCycleTurnSnapshot(cycleId);
      if (snapshot.isCompleted || !snapshot.activeTour) {
        return { ok: false, error: "Ce cycle est déjà terminé." };
      }
      if (numeroTour !== snapshot.activeTour) {
        return { ok: false, error: "Seul le tour actif peut être distribué." };
      }
      if (!snapshot.isPastDue) {
        return { ok: false, error: "Le pot ne peut être versé qu'après l'échéance." };
      }
      if (montantVerse > roundCurrency(snapshot.availableCurrentTurn)) {
        return { ok: false, error: "Montant supérieur à la caisse disponible." };
      }

      metadata.cycleId = cycleId;
      metadata.numero_tour = numeroTour;
      metadata.montant = montantVerse;
      return { ok: true, montant: montantVerse, devise, metadata };
    }

    case "PRET_DECAISSEMENT": {
      const pret = await getPretWithRelations(input.contextId, input.groupId);
      if (!pret || pret.statut !== "APPROUVE") {
        return { ok: false, error: "Prêt non approuvé ou déjà décaissé." };
      }

      const montant = Number(pret.montant_approuve ?? 0);
      if (montant <= 0) return { ok: false, error: "Montant approuvé invalide." };

      metadata.pretId = input.contextId;
      metadata.montant = montant;
      return { ok: true, montant, devise, metadata };
    }

    case "RUBRIQUE_RETRAIT": {
      if (!requestedMontant || requestedMontant <= 0) {
        return { ok: false, error: "Montant de retrait invalide." };
      }
      const motif = typeof metadata.motif === "string" ? metadata.motif.trim() : "";
      if (motif.length < 3) return { ok: false, error: "Le motif est requis." };

      metadata.montant = requestedMontant;
      return { ok: true, montant: requestedMontant, devise, metadata };
    }

    case "PENALITE_RETRAIT": {
      if (!requestedMontant || requestedMontant <= 0) {
        return { ok: false, error: "Montant de retrait invalide." };
      }
      const motif = typeof metadata.motif === "string" ? metadata.motif.trim() : "";
      if (motif.length < 3) return { ok: false, error: "Le motif est requis." };

      metadata.montant = requestedMontant;
      metadata.cycleId = input.contextId;
      return { ok: true, montant: requestedMontant, devise, metadata };
    }

    case "AMENDE_RETRAIT": {
      if (!requestedMontant || requestedMontant <= 0) {
        return { ok: false, error: "Montant de retrait invalide." };
      }
      const motif = typeof metadata.motif === "string" ? metadata.motif.trim() : "";
      if (motif.length < 3) return { ok: false, error: "Le motif est requis." };

      metadata.montant = requestedMontant;
      return { ok: true, montant: requestedMontant, devise, metadata };
    }

    case "EPARGNE_RETRAIT": {
      if (!requestedMontant || requestedMontant <= 0) {
        return { ok: false, error: "Montant de retrait invalide." };
      }
      const motif = typeof metadata.motif === "string" ? metadata.motif.trim() : "";
      if (motif.length < 3) return { ok: false, error: "Le motif est requis." };

      const account = await prisma.compteEpargne.findFirst({
        where: {
          id_compte: input.contextId,
          id_groupe: input.groupId,
          statut: "ACTIF",
        },
        select: { id_compte: true, solde_actuel: true },
      });

      if (!account) return { ok: false, error: "Compte épargne introuvable." };
      if (requestedMontant > Number(account.solde_actuel)) {
        return { ok: false, error: "Solde insuffisant sur le compte." };
      }

      metadata.accountId = input.contextId;
      metadata.montant = requestedMontant;
      return { ok: true, montant: requestedMontant, devise, metadata };
    }

    default:
      return { ok: false, error: "Contexte de paiement inconnu." };
  }
}

export function isOutboundContext(contextType: PaymentContextType): boolean {
  return [
    "CYCLE_DISTRIBUTION",
    "PRET_DECAISSEMENT",
    "RUBRIQUE_RETRAIT",
    "PENALITE_RETRAIT",
    "AMENDE_RETRAIT",
    "EPARGNE_RETRAIT",
  ].includes(contextType);
}
