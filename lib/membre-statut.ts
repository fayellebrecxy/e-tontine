/**
 * Calcul automatique du statut visuel d'un membre (VERT / ORANGE / ROUGE).
 *
 * Critères :
 * ROUGE  → 3+ points (pénalités cycle + amendes réunion + retards cycle)
 * ORANGE → 1-2 points
 * VERT   → Tout est à jour
 *
 * Points :
 * +1 par pénalité de cycle en attente (montant=0, penalite_appliquee=true)
 * +1 par cotisation de cycle en retard (deadline dépassée, pas encore payée, pas de pénalité auto)
 * +1 par amende de réunion non payée
 * +1 si rubrique dont la date_fin est dépassée et solde > 0
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
  let score = 0;
  const now = new Date();

  // ─── 1. Pénalités de cycle déjà auto-appliquées non payées ───
  // cotisation avec penalite_appliquee=true ET montant=0 (créée par le cron, pas encore payée)
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

  // ─── 2. Cotisations de cycle en retard (deadline dépassée, non payées) ───
  // Récupérer les participations actives (cycles en cours)
  const participations = await prisma.cycleParticipant.findMany({
    where: { id_membre_groupe: membreId },
    select: {
      ordre: true,
      id_cycle: true,
      cycle: {
        select: {
          date_debut: true,
          date_fin: true,
          duree_tour_de_gain: true,
          montant_cotisation: true,
        },
      },
    },
  });

  let toursEnRetard = 0;
  for (const p of participations) {
    const { cycle } = p;
    if (now < cycle.date_debut || now > cycle.date_fin) continue; // cycle pas actif

    // Tour actuel du cycle = ceil((now - date_debut) / duree_tour_de_gain)
    const joursEcoules = Math.floor(
      (now.getTime() - cycle.date_debut.getTime()) / (1000 * 60 * 60 * 24),
    );
    const tourActuel = Math.min(
      Math.floor(joursEcoules / cycle.duree_tour_de_gain) + 1,
      participations.filter((pp) => pp.id_cycle === p.id_cycle).length,
    );

    // Vérifier chaque tour passé (de 1 à tourActuel)
    for (let tour = 1; tour <= tourActuel; tour++) {
      const echeance = new Date(cycle.date_debut);
      echeance.setDate(echeance.getDate() + cycle.duree_tour_de_gain * tour);

      if (now <= echeance) continue; // pas encore échu

      // Vérifier si le membre a payé ce tour
      const cotisation = await prisma.cotisations.findFirst({
        where: {
          id_membre_groupe: membreId,
          id_cycle: p.id_cycle,
          numero_tour: tour,
          montant: { gt: 0 },
        },
      });

      if (!cotisation) {
        // Vérifier s'il y a déjà une pénalité auto (pour ne pas compter en double avec critère 1)
        const penaliteAuto = await prisma.cotisations.findFirst({
          where: {
            id_membre_groupe: membreId,
            id_cycle: p.id_cycle,
            numero_tour: tour,
            penalite_appliquee: true,
            montant: 0,
          },
        });
        if (!penaliteAuto) {
          toursEnRetard++;
        }
      }
    }
  }

  if (toursEnRetard > 0) {
    score += toursEnRetard;
    raisons.push(
      `${toursEnRetard} cotisation${toursEnRetard > 1 ? "s" : ""} de cycle en retard`,
    );
  }

  // ─── 3. Amendes de réunion non payées ───
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

  // ─── 4. Rubriques en retard (date_fin dépassée, solde > 0) ───
  const rubriquesEnRetard = await prisma.membreRubrique.findMany({
    where: {
      id_membre_groupe: membreId,
      rubrique: { date_fin: { lt: now } },
    },
    select: {
      id_rubrique: true,
      rubrique: { select: { montant_fixe: true, nom: true } },
    },
  });

  let nbRubriquesRetard = 0;
  for (const mr of rubriquesEnRetard) {
    const totalPaye = await prisma.paiementRubrique.aggregate({
      where: { id_rubrique: mr.id_rubrique, id_membre_groupe: membreId },
      _sum: { montant_paye: true },
    });
    const paye = Number(totalPaye._sum.montant_paye ?? 0);
    const du = Number(mr.rubrique.montant_fixe);
    if (paye < du) {
      nbRubriquesRetard++;
    }
  }
  if (nbRubriquesRetard > 0) {
    score += 1;
    raisons.push(
      `${nbRubriquesRetard} rubrique${nbRubriquesRetard > 1 ? "s" : ""} avec paiement en retard`,
    );
  }

  // ─── Détermination du statut ───
  // VERT = tout à jour, ROUGE = au moins 1 problème (peu importe le nombre)
  let statut: StatutVisuel;
  if (score >= 1) {
    statut = "ROUGE";
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
