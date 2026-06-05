import { prisma } from "./prisma";
import { getCycleTurnSnapshot } from "@/lib/cycle-turns";

/**
 * Calcule le pot collecté pour un tour donné d'un cycle.
 * Pot réel = somme des cotisations enregistrées pour ce tour.
 * Les pénalités sont suivies dans une caisse séparée.
 */
export async function calculerPotTour(cycleId: string, numeroTour: number) {
  const cotisations = await prisma.cotisations.findMany({
    where: { id_cycle: cycleId, numero_tour: numeroTour },
    select: { montant: true, montant_penalite: true },
  });

  const potCollecte = cotisations.reduce((acc, c) => acc + Number(c.montant), 0);
  const totalPenalites = cotisations.reduce(
    (acc, c) => acc + (c.montant_penalite ? Number(c.montant_penalite) : 0),
    0,
  );

  return {
    potCollecte,
    totalPenalites,
    potTotal: potCollecte,
    nombreCotisations: cotisations.length,
  };
}

/**
 * Récupère le bénéficiaire d'un tour donné dans un cycle.
 * L'ordre des participants détermine qui reçoit le pot à chaque tour.
 */
export async function getBeneficiaireTour(cycleId: string, numeroTour: number) {
  const participant = await prisma.cycleParticipant.findFirst({
    where: { id_cycle: cycleId, ordre: numeroTour },
    select: {
      id_membre_groupe: true,
      ordre: true,
      membre_groupe: {
        select: {
          id_membre_groupe: true,
          id_user: true,
          user: { select: { nom: true, prenom: true, email: true } },
        },
      },
    },
  });

  return participant ?? null;
}

/**
 * Vérifie si un versement a déjà été enregistré pour un tour donné.
 */
export async function versementExistePourTour(cycleId: string, numeroTour: number) {
  const existing = await prisma.versement.findFirst({
    where: { id_cycle: cycleId, numero_tour: numeroTour },
    select: { id_versement: true },
  });
  return existing !== null;
}

/**
 * Récupère l'historique complet des versements d'un cycle avec les détails.
 */
export async function getVersementsCycle(cycleId: string) {
  return prisma.versement.findMany({
    where: { id_cycle: cycleId },
    orderBy: { numero_tour: "asc" },
    select: {
      id_versement: true,
      numero_tour: true,
      montant_verse: true,
      date_versement: true,
      mode_versement: true,
      reference_externe: true,
      beneficiaire: {
        select: {
          id_membre_groupe: true,
          user: { select: { nom: true, prenom: true } },
        },
      },
      valideur: {
        select: {
          user: { select: { nom: true, prenom: true } },
        },
      },
    },
  });
}

/**
 * Calcule la trésorerie du tour actif.
 * La caisse de pénalités reste séparée du pot à verser au bénéficiaire.
 */
export async function getTresorerieCycle(cycleId: string) {
  const snapshot = await getCycleTurnSnapshot(cycleId);

  return {
    totalAttendu: snapshot.expectedCurrentTurn,
    totalCollecte: snapshot.collectedCurrentTurn,
    totalDistribue: snapshot.distributedCurrentTurn,
    soldeDisponible: snapshot.availableCurrentTurn,
    resteACollecter: snapshot.remainingCurrentTurn,
    toursVerses: snapshot.completedTours,
    tourActif: snapshot.activeTour,
    debutTourActif: snapshot.activeTourStart,
    finTourActif: snapshot.activeTourEnd,
    cycleTermine: snapshot.isCompleted,
    penalitesTour: snapshot.penaltiesCurrentTurn,
    caissePenalitesTour: snapshot.penaltyCashCurrentTurn,
    penalitesCycle: snapshot.penaltiesCycle,
    caissePenalitesCycle: snapshot.penaltyCashCycle,
  };
}
