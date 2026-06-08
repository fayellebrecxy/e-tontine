import { prisma } from "@/lib/prisma";

export type CycleTurnSnapshot = {
  totalTours: number;
  activeTour: number | null;
  activeTourStart: Date | null;
  activeTourEnd: Date | null;
  completedTours: number;
  isCompleted: boolean;
  expectedCurrentTurn: number;
  collectedCurrentTurn: number;
  remainingCurrentTurn: number;
  distributedCurrentTurn: number;
  availableCurrentTurn: number;
  /** Pénalités effectivement collectées (argent reçu, montant_cotisation > 0) */
  penaltiesCurrentTurn: number;
  /** Pénalités automatiques en attente de paiement (enregistrées mais pas encore collectées) */
  pendingPenaltiesCurrentTurn: number;
  penaltyWithdrawalsCurrentTurn: number;
  penaltyCashCurrentTurn: number;
  /** Pénalités effectivement collectées sur tout le cycle */
  penaltiesCycle: number;
  pendingPenaltiesCycle: number;
  penaltyWithdrawalsCycle: number;
  penaltyCashCycle: number;
  allCurrentTurnMembersPaid: boolean;
  paidMembersCurrentTurn: number;
};

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export async function getCycleTurnSnapshot(cycleId: string): Promise<CycleTurnSnapshot> {
  const cycle = await prisma.cycleTontine.findUnique({
    where: { id_cycle: cycleId },
    select: {
      montant_cotisation: true,
      date_debut: true,
      duree_tour_de_gain: true,
      participants: {
        orderBy: { ordre: "asc" },
        select: { ordre: true, id_membre_groupe: true },
      },
      cotisations: {
        select: {
          id_membre_groupe: true,
          numero_tour: true,
          montant: true,
          montant_penalite: true,
          penalite_collectee: true,
        },
      },
      versements: {
        select: { numero_tour: true, montant_verse: true, date_versement: true },
      },
      retraits_penalites: {
        select: { numero_tour: true, montant: true },
      },
    },
  });

  if (!cycle) {
    return {
      totalTours: 0,
      activeTour: null,
      activeTourStart: null,
      activeTourEnd: null,
      completedTours: 0,
      isCompleted: true,
      expectedCurrentTurn: 0,
      collectedCurrentTurn: 0,
      remainingCurrentTurn: 0,
      distributedCurrentTurn: 0,
      availableCurrentTurn: 0,
      penaltiesCurrentTurn: 0,
      pendingPenaltiesCurrentTurn: 0,
      penaltyWithdrawalsCurrentTurn: 0,
      penaltyCashCurrentTurn: 0,
      penaltiesCycle: 0,
      pendingPenaltiesCycle: 0,
      penaltyWithdrawalsCycle: 0,
      penaltyCashCycle: 0,
      allCurrentTurnMembersPaid: false,
      paidMembersCurrentTurn: 0,
    };
  }

  const totalTours = cycle.participants.length;
  const versementsParTour = new Map(cycle.versements.map((v) => [v.numero_tour, Number(v.montant_verse)]));
  const completedTours = cycle.participants.filter((p) => versementsParTour.has(p.ordre)).length;
  const activeTour = cycle.participants.find((p) => !versementsParTour.has(p.ordre))?.ordre ?? null;
  const isCompleted = activeTour === null;
  const montantCotisation = Number(cycle.montant_cotisation);
  const previousVersement = activeTour
    ? cycle.versements.find((versement) => versement.numero_tour === activeTour - 1)
    : null;
  const activeTourStart = activeTour
    ? previousVersement?.date_versement ?? cycle.date_debut
    : null;
  const activeTourEnd = activeTourStart
    ? addDays(activeTourStart, cycle.duree_tour_de_gain)
    : null;
  const expectedCurrentTurn = activeTour ? totalTours * montantCotisation : 0;

  const currentCotisations = activeTour
    ? cycle.cotisations.filter((c) => c.numero_tour === activeTour)
    : [];

  // Exclure les enregistrements de pénalité automatique (montant = 0)
  // qui représentent des pénalités appliquées sans paiement réel
  const realCotisations = currentCotisations.filter((c) => Number(c.montant) > 0);

  const collectedCurrentTurn = roundCurrency(
    realCotisations.reduce((acc, c) => acc + Number(c.montant), 0),
  );
  const distributedCurrentTurn = activeTour ? versementsParTour.get(activeTour) ?? 0 : 0;
  const remainingCurrentTurn = roundCurrency(Math.max(0, expectedCurrentTurn - collectedCurrentTurn));
  const availableCurrentTurn = roundCurrency(collectedCurrentTurn - distributedCurrentTurn);

  const paidMembersCurrentTurn = activeTour
    ? cycle.participants.filter((participant) => {
        // Exclure les enregistrements de pénalité automatique (montant = 0)
        const paid = currentCotisations
          .filter(
            (c) => c.id_membre_groupe === participant.id_membre_groupe && Number(c.montant) > 0,
          )
          .reduce((acc, c) => acc + Number(c.montant), 0);
        return paid >= montantCotisation;
      }).length
    : totalTours;

  // Pénalités effectivement collectées, même si elles ont été payées séparément.
  const penaltiesCurrentTurn = roundCurrency(
    currentCotisations
      .filter((c) => c.penalite_collectee)
      .reduce((acc, c) => acc + Number(c.montant_penalite ?? 0), 0),
  );
  // Pénalités en attente = enregistrées automatiquement avant paiement.
  const pendingPenaltiesCurrentTurn = roundCurrency(
    currentCotisations
      .filter((c) => !c.penalite_collectee && c.montant_penalite !== null)
      .reduce((acc, c) => acc + Number(c.montant_penalite ?? 0), 0),
  );
  const penaltyWithdrawalsCurrentTurn = roundCurrency(
    activeTour
      ? cycle.retraits_penalites
          .filter((r) => r.numero_tour === activeTour)
          .reduce((acc, r) => acc + Number(r.montant), 0)
      : 0,
  );
  const penaltiesCycle = roundCurrency(
    cycle.cotisations
      .filter((c) => c.penalite_collectee)
      .reduce((acc, c) => acc + Number(c.montant_penalite ?? 0), 0),
  );
  const pendingPenaltiesCycle = roundCurrency(
    cycle.cotisations
      .filter((c) => !c.penalite_collectee && c.montant_penalite !== null)
      .reduce((acc, c) => acc + Number(c.montant_penalite ?? 0), 0),
  );
  const penaltyWithdrawalsCycle = roundCurrency(
    cycle.retraits_penalites.reduce((acc, r) => acc + Number(r.montant), 0),
  );

  return {
    totalTours,
    activeTour,
    activeTourStart,
    activeTourEnd,
    completedTours,
    isCompleted,
    expectedCurrentTurn,
    collectedCurrentTurn,
    remainingCurrentTurn,
    distributedCurrentTurn,
    availableCurrentTurn,
    penaltiesCurrentTurn,
    pendingPenaltiesCurrentTurn,
    penaltyWithdrawalsCurrentTurn,
    penaltyCashCurrentTurn: roundCurrency(penaltiesCurrentTurn - penaltyWithdrawalsCurrentTurn),
    penaltiesCycle,
    pendingPenaltiesCycle,
    penaltyWithdrawalsCycle,
    penaltyCashCycle: roundCurrency(penaltiesCycle - penaltyWithdrawalsCycle),
    allCurrentTurnMembersPaid: activeTour ? paidMembersCurrentTurn === totalTours : false,
    paidMembersCurrentTurn,
  };
}

export async function getMemberRemainingForTurn({
  cycleId,
  memberId,
  numeroTour,
}: {
  cycleId: string;
  memberId: string;
  numeroTour: number;
}) {
  const cycle = await prisma.cycleTontine.findUnique({
    where: { id_cycle: cycleId },
    select: {
      montant_cotisation: true,
      cotisations: {
        where: { id_membre_groupe: memberId, numero_tour: numeroTour },
        select: { montant: true },
      },
    },
  });

  if (!cycle) return null;

  const due = Number(cycle.montant_cotisation);
  // Exclure les enregistrements de pénalité automatique (montant = 0)
  const paid = cycle.cotisations
    .filter((c) => Number(c.montant) > 0)
    .reduce((acc, c) => acc + Number(c.montant), 0);

  return {
    due,
    paid: roundCurrency(paid),
    remaining: roundCurrency(Math.max(0, due - paid)),
  };
}
