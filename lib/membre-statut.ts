/**
 * Calcul automatique du statut visuel d'un membre (VERT / ORANGE / ROUGE).
 *
 * Critères :
 * ROUGE  → 3+ pénalités de cycle OU 3+ amendes réunion non payées
 * ORANGE → 1-2 pénalités de cycle OU 1-2 amendes réunion non payées
 *           OU cotisation en retard (deadline dépassée sans paiement complet)
 * VERT   → Tout est à jour
 */

import { prisma } from "@/lib/prisma";

export type StatutVisuel = "VERT" | "ORANGE" | "ROUGE";

export interface StatutDetail {
  statut: StatutVisuel;
  raisons: string[];
}

export async function calculerStatutMembre(
  membreId: string,
): Promise<StatutDetail> {
  const raisons: string[] = [];
  let score = 0; // 0=vert, 1-2=orange, 3+=rouge

  // ─── 1. Pénalités de cycle non réglées ───
  // Une pénalité "active" = cotisation avec penalite_appliquee=true et montant=0
  // (auto-appliquée mais pas encore payée)
  const penalitesEnAttente = await prisma.cotisations.count({
    where: {
      id_membre_groupe: membreId,
      penalite_appliquee: true,
      montant: 0,
    },
  });

  if (penalitesEnAttente > 0) {
    score += penalitesEnAttente;
    raisons.push(
      `${penalitesEnAttente} pénalité${penalitesEnAttente > 1 ? "s" : ""} de cycle en attente de paiement`,
    );
  }

  // ─── 2. Amendes de réunion non payées ───
  const amendesNonPayees = await prisma.presenceReunion.count({
    where: {
      id_membre_groupe: membreId,
      statut_presence: { in: ["ABSENT", "EN_RETARD"] },
      amende_payee: false,
      reunion: {
        statut: "TERMINEE",
        montant_amende: { gt: 0 },
      },
    },
  });

  if (amendesNonPayees > 0) {
    score += amendesNonPayees;
    raisons.push(
      `${amendesNonPayees} amende${amendesNonPayees > 1 ? "s" : ""} de réunion non payée${amendesNonPayees > 1 ? "s" : ""}`,
    );
  }

  // ─── 3. Rubriques en retard (date_fin dépassée, solde > 0) ───
  // Vérifier si le membre appartient à des rubriques dont la deadline est dépassée
  // et n'a pas payé la totalité du montant fixe
  const now = new Date();
  const rubriquesEnRetard = await prisma.membreRubrique.findMany({
    where: {
      id_membre_groupe: membreId,
      rubrique: {
        date_fin: { lt: now },
      },
    },
    select: {
      rubrique: {
        select: {
          montant_fixe: true,
        },
      },
      id_membre_groupe: true,
      id_rubrique: true,
    },
  });

  for (const mr of rubriquesEnRetard) {
    const totalPaye = await prisma.paiementRubrique.aggregate({
      where: {
        id_rubrique: mr.id_rubrique,
        id_membre_groupe: membreId,
      },
      _sum: { montant_paye: true },
    });
    const paye = Number(totalPaye._sum.montant_paye ?? 0);
    const du = Number(mr.rubrique.montant_fixe);
    if (paye < du) {
      score += 1;
      raisons.push(`Retard de paiement sur une rubrique`);
      break; // On ne compte qu'une fois pour les rubriques
    }
  }

  // ─── Détermination du statut ───
  let statut: StatutVisuel;
  if (score >= 3) {
    statut = "ROUGE";
  } else if (score >= 1) {
    statut = "ORANGE";
  } else {
    statut = "VERT";
    raisons.push("Tous vos paiements sont à jour.");
  }

  return { statut, raisons };
}

/**
 * Recalcule et persiste le statut visuel d'un membre en base.
 */
export async function majStatutMembre(membreId: string): Promise<StatutVisuel> {
  const { statut } = await calculerStatutMembre(membreId);

  await prisma.membreGroupe.update({
    where: { id_membre_groupe: membreId },
    data: { statut_visuel: statut },
  });

  return statut;
}

/**
 * Recalcule le statut de tous les membres actifs d'un groupe.
 */
export async function majStatutsTousLesMembres(groupeId: string): Promise<void> {
  const membres = await prisma.membreGroupe.findMany({
    where: { id_groupe: groupeId, statut_adhesion: "ACTIF" },
    select: { id_membre_groupe: true },
  });

  await Promise.all(membres.map((m) => majStatutMembre(m.id_membre_groupe)));
}
