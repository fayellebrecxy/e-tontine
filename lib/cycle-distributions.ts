import { prisma } from "./prisma";

/**
 * Calcule le pot collecté pour un tour donné d'un cycle.
 * Pot réel = somme des cotisations enregistrées pour ce tour + pénalités associées.
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
    potTotal: potCollecte + totalPenalites,
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
 * Calcule la trésorerie globale d'un cycle :
 * - Total collecté (cotisations + pénalités)
 * - Total distribué (versements)
 * - Solde disponible
 */
export async function getTresorerieCycle(cycleId: string) {
  const [cotisations, versements] = await Promise.all([
    prisma.cotisations.findMany({
      where: { id_cycle: cycleId },
      select: { montant: true, montant_penalite: true },
    }),
    prisma.versement.findMany({
      where: { id_cycle: cycleId },
      select: { montant_verse: true },
    }),
  ]);

  const totalCollecte = cotisations.reduce(
    (acc, c) => acc + Number(c.montant) + (c.montant_penalite ? Number(c.montant_penalite) : 0),
    0,
  );
  const totalDistribue = versements.reduce((acc, v) => acc + Number(v.montant_verse), 0);

  return {
    totalCollecte,
    totalDistribue,
    soldeDisponible: totalCollecte - totalDistribue,
    toursVerses: versements.length,
  };
}
