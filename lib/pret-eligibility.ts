import { prisma } from "@/lib/prisma";
import { calculerStatutMembre } from "@/lib/membre-statut";
import { getMemberDebtSummary } from "@/lib/cycle-member-debts";
import { ACTIVE_LOAN_STATUSES, formatPretMontant } from "@/lib/pret-utils";
import { getBanqueSummary } from "@/lib/pret-banque";

export type PretEligibilityResult = {
  eligible: boolean;
  reasons: string[];
  soldeEpargne: number;
  banqueTotale: number;
  banqueDisponible: number;
  ancienneteJours: number;
  ancienneteMinJours: number;
};

export async function ensureParametresPret(groupId: string) {
  return prisma.parametresPretGroupe.upsert({
    where: { id_groupe: groupId },
    create: { id_groupe: groupId },
    update: {},
  });
}

export async function checkPretEligibility(
  groupId: string,
  memberId: string,
  montantDemande?: number,
  excludePretId?: string,
): Promise<PretEligibilityResult> {
  const reasons: string[] = [];

  const [member, parametres, compte, activeLoan, bank] = await Promise.all([
    prisma.membreGroupe.findFirst({
      where: { id_membre_groupe: memberId, id_groupe: groupId, statut_adhesion: "ACTIF" },
      select: { id_membre_groupe: true, date_adhesion: true },
    }),
    ensureParametresPret(groupId),
    prisma.compteEpargne.findUnique({
      where: { id_membre_groupe: memberId },
      select: { solde_actuel: true, statut: true },
    }),
    prisma.pret.findFirst({
      where: {
        id_emprunteur: memberId,
        id_groupe: groupId,
        statut: { in: [...ACTIVE_LOAN_STATUSES] },
        ...(excludePretId ? { id_pret: { not: excludePretId } } : {}),
      },
      select: { id_pret: true },
    }),
    getBanqueSummary(groupId),
  ]);

  if (!member) {
    return {
      eligible: false,
      reasons: ["Membre introuvable ou inactif."],
      soldeEpargne: 0,
      banqueTotale: bank.total,
      banqueDisponible: bank.disponible,
      ancienneteJours: 0,
      ancienneteMinJours: parametres.anciennete_min_jours,
    };
  }

  const ancienneteJours = Math.floor(
    (Date.now() - member.date_adhesion.getTime()) / (24 * 60 * 60 * 1000),
  );

  if (!compte) {
    reasons.push("Aucun compte épargne ouvert.");
  } else if (compte.statut !== "ACTIF") {
    reasons.push("Votre compte épargne n'est pas actif.");
  }

  const soldeEpargne = compte ? Number(compte.solde_actuel) : 0;

  if (activeLoan) {
    reasons.push("Vous avez déjà une demande ou un prêt en cours.");
  }

  if (parametres.anciennete_min_jours > 0 && ancienneteJours < parametres.anciennete_min_jours) {
    reasons.push(
      `Ancienneté insuffisante (${ancienneteJours} j / ${parametres.anciennete_min_jours} j requis).`,
    );
  }

  const statut = await calculerStatutMembre(memberId);
  if (statut.statut !== "VERT") {
    reasons.push(...statut.raisons.filter((r) => !r.includes("à jour")));
  }

  const participations = await prisma.cycleParticipant.findMany({
    where: { id_membre_groupe: memberId, cycle: { id_groupe: groupId } },
    select: { id_cycle: true },
  });

  for (const participation of participations) {
    const debt = await getMemberDebtSummary(participation.id_cycle, memberId);
    if (debt && debt.totalDue > 0) {
      reasons.push(
        `Arriérés ou pénalités impayés sur un cycle (${debt.totalDue.toLocaleString("fr-FR")} FCFA).`,
      );
      break;
    }
  }

  if (montantDemande !== undefined) {
    if (montantDemande <= soldeEpargne) {
      reasons.push(
        `Le montant demandé doit être supérieur à votre épargne (${formatPretMontant(soldeEpargne)}). Faites plutôt une demande de retrait.`,
      );
    }

    const plafond = Math.floor(bank.disponible * (Number(parametres.plafond_pct_banque) / 100));
    if (montantDemande > plafond) {
      reasons.push(
        `Montant supérieur au plafond prêtautable (${formatPretMontant(plafond)}).`,
      );
    }

    if (montantDemande > bank.disponible) {
      reasons.push(
        `Montant supérieur à la banque disponible (${formatPretMontant(bank.disponible)}).`,
      );
    }
  }

  return {
    eligible: reasons.length === 0,
    reasons,
    soldeEpargne,
    banqueTotale: bank.total,
    banqueDisponible: bank.disponible,
    ancienneteJours,
    ancienneteMinJours: parametres.anciennete_min_jours,
  };
}
