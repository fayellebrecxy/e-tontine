import { prisma } from "@/lib/prisma";
import type { ModePenalite } from "@/lib/generated/prisma/client";
import { computePenaltyAmount } from "@/lib/cycle-penalties";
import { getCycleTurnSnapshot, getTourWindow } from "@/lib/cycle-turns";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export type DebtSliceType = "COTISATION" | "PENALITE";

export type MemberDebtSlice = {
  type: DebtSliceType;
  numeroTour: number;
  remaining: number;
  /** Enregistrement pénalité auto en attente (montant = 0) */
  pendingPenaltyCotisationId?: string;
  pendingPenaltyId?: string;
};

export type MemberDebtSummary = {
  slices: MemberDebtSlice[];
  totalDue: number;
  cotisationDue: number;
  penaltyDue: number;
};

export type PaymentAllocation = {
  type: DebtSliceType;
  numeroTour: number;
  amount: number;
  pendingPenaltyCotisationId?: string;
};

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

function daysAfterDue(reference: Date, dueDate: Date) {
  return Math.max(0, Math.ceil((reference.getTime() - dueDate.getTime()) / ONE_DAY_MS));
}

function isPastDueDay(reference: Date, dueDate: Date) {
  return daysAfterDue(reference, dueDate) >= 1;
}

type CycleDebtContext = {
  id_cycle: string;
  date_debut: Date;
  duree_tour_de_gain: number;
  montant_cotisation: number;
  penalites_activees: boolean;
  mode_penalite: ModePenalite | null;
  valeur_penalite: number | null;
  versements: { numero_tour: number; date_versement: Date }[];
  totalTours: number;
};

async function loadCycleDebtContext(cycleId: string): Promise<CycleDebtContext | null> {
  const cycle = await prisma.cycleTontine.findUnique({
    where: { id_cycle: cycleId },
    select: {
      id_cycle: true,
      date_debut: true,
      duree_tour_de_gain: true,
      montant_cotisation: true,
      penalites_activees: true,
      mode_penalite: true,
      valeur_penalite: true,
      versements: {
        select: { numero_tour: true, date_versement: true },
        orderBy: { numero_tour: "asc" },
      },
      participants: { select: { id_membre_groupe: true } },
    },
  });

  if (!cycle) return null;

  return {
    id_cycle: cycle.id_cycle,
    date_debut: cycle.date_debut,
    duree_tour_de_gain: cycle.duree_tour_de_gain,
    montant_cotisation: Number(cycle.montant_cotisation),
    penalites_activees: cycle.penalites_activees,
    mode_penalite: cycle.mode_penalite,
    valeur_penalite: cycle.valeur_penalite ? Number(cycle.valeur_penalite) : null,
    versements: cycle.versements,
    totalTours: cycle.participants.length,
  };
}

function getPenaltyRemainingForTour(
  cotisations: {
    montant: unknown;
    montant_penalite: unknown;
    penalite_appliquee: boolean;
    penalite_collectee: boolean;
    id_cotisation: string;
    penalites: { id_penalite: string }[];
  }[],
  ctx: CycleDebtContext,
  tourNum: number,
  tourEnd: Date,
  referenceDate: Date,
  cotisationRemaining: number,
): Omit<MemberDebtSlice, "type" | "numeroTour"> | null {
  if (!ctx.penalites_activees || !ctx.mode_penalite || !ctx.valeur_penalite) return null;

  const penaltyCollected = cotisations
    .filter((c) => c.penalite_collectee && c.montant_penalite)
    .reduce((acc, c) => acc + Number(c.montant_penalite), 0);

  if (penaltyCollected > 0) return null;

  const tourDistributed = ctx.versements.some((v) => v.numero_tour === tourNum);
  const overdue = tourDistributed || isPastDueDay(referenceDate, tourEnd);

  const pendingRecord = cotisations.find(
    (c) =>
      Number(c.montant) === 0 &&
      c.penalite_appliquee &&
      !c.penalite_collectee &&
      c.montant_penalite !== null,
  );

  if (pendingRecord) {
    const remaining = roundCurrency(Number(pendingRecord.montant_penalite ?? 0));
    if (remaining <= 0) return null;
    return {
      remaining,
      pendingPenaltyCotisationId: pendingRecord.id_cotisation,
      pendingPenaltyId: pendingRecord.penalites[0]?.id_penalite,
    };
  }

  // Pénalité uniquement si échéance dépassée et cotisation non soldée à l'échéance
  if (!overdue || cotisationRemaining <= 0) return null;

  const joursRetard = Math.max(1, daysAfterDue(referenceDate, tourEnd));

  const remaining = computePenaltyAmount(
    ctx.mode_penalite,
    ctx.valeur_penalite,
    ctx.montant_cotisation,
    joursRetard,
  );

  if (remaining <= 0) return null;

  return { remaining };
}

export async function getMemberDebtSummary(
  cycleId: string,
  memberId: string,
  referenceDate: Date = new Date(),
): Promise<MemberDebtSummary | null> {
  const ctx = await loadCycleDebtContext(cycleId);
  if (!ctx) return null;

  const snapshot = await getCycleTurnSnapshot(cycleId);
  const maxTour = snapshot.activeTour ?? ctx.totalTours;

  const cotisations = await prisma.cotisations.findMany({
    where: { id_cycle: cycleId, id_membre_groupe: memberId, numero_tour: { lte: maxTour } },
    select: {
      id_cotisation: true,
      numero_tour: true,
      montant: true,
      montant_penalite: true,
      penalite_appliquee: true,
      penalite_collectee: true,
      penalites: { select: { id_penalite: true } },
    },
  });

  const byTour = new Map<number, typeof cotisations>();
  for (const item of cotisations) {
    if (!item.numero_tour) continue;
    const list = byTour.get(item.numero_tour) ?? [];
    list.push(item);
    byTour.set(item.numero_tour, list);
  }

  const slices: MemberDebtSlice[] = [];

  for (let tourNum = 1; tourNum <= maxTour; tourNum += 1) {
    const tourRecords = byTour.get(tourNum) ?? [];
    const { tourEnd } = getTourWindow(ctx, tourNum);

    const cotisationPaid = tourRecords
      .filter((c) => Number(c.montant) > 0)
      .reduce((acc, c) => acc + Number(c.montant), 0);
    const cotisationRemaining = roundCurrency(
      Math.max(0, ctx.montant_cotisation - cotisationPaid),
    );

    if (cotisationRemaining > 0) {
      slices.push({
        type: "COTISATION",
        numeroTour: tourNum,
        remaining: cotisationRemaining,
      });
    }

    const penalty = getPenaltyRemainingForTour(
      tourRecords,
      ctx,
      tourNum,
      tourEnd,
      referenceDate,
      cotisationRemaining,
    );

    if (penalty) {
      slices.push({
        type: "PENALITE",
        numeroTour: tourNum,
        remaining: penalty.remaining,
        pendingPenaltyCotisationId: penalty.pendingPenaltyCotisationId,
        pendingPenaltyId: penalty.pendingPenaltyId,
      });
    }
  }

  const cotisationDue = roundCurrency(
    slices.filter((s) => s.type === "COTISATION").reduce((acc, s) => acc + s.remaining, 0),
  );
  const penaltyDue = roundCurrency(
    slices.filter((s) => s.type === "PENALITE").reduce((acc, s) => acc + s.remaining, 0),
  );

  return {
    slices,
    totalDue: roundCurrency(cotisationDue + penaltyDue),
    cotisationDue,
    penaltyDue,
  };
}

/**
 * Répartit un montant reçu : arriéré tour N → pénalité tour N → … → cotisation tour actif.
 * La pénalité d'un tour doit être payée en totalité si l'arriéré de ce tour est soldé dans le même versement.
 */
export function allocateMemberPayment(
  amount: number,
  slices: MemberDebtSlice[],
): { allocations: PaymentAllocation[]; error?: string } {
  let remaining = roundCurrency(amount);
  const allocations: PaymentAllocation[] = [];

  for (let index = 0; index < slices.length; index += 1) {
    const slice = slices[index];
    if (remaining <= 0) break;

    if (slice.type === "COTISATION") {
      const paid = roundCurrency(Math.min(remaining, slice.remaining));
      if (paid > 0) {
        allocations.push({ type: "COTISATION", numeroTour: slice.numeroTour, amount: paid });
        remaining = roundCurrency(remaining - paid);
      }

      const nextSlice = slices[index + 1];
      const cotisationFullyPaid = paid >= slice.remaining - 0.001;
      if (
        cotisationFullyPaid &&
        nextSlice?.type === "PENALITE" &&
        nextSlice.numeroTour === slice.numeroTour
      ) {
        if (remaining < nextSlice.remaining) {
          return {
            allocations: [],
            error: `La pénalité du tour ${slice.numeroTour} (${nextSlice.remaining.toLocaleString("fr-FR")}) doit être payée en totalité avec l'arriéré de ce tour.`,
          };
        }
        allocations.push({
          type: "PENALITE",
          numeroTour: nextSlice.numeroTour,
          amount: nextSlice.remaining,
          pendingPenaltyCotisationId: nextSlice.pendingPenaltyCotisationId,
        });
        remaining = roundCurrency(remaining - nextSlice.remaining);
        index += 1;
      }
      continue;
    }

    if (slice.type === "PENALITE") {
      if (remaining < slice.remaining) {
        return {
          allocations: [],
          error: `La pénalité du tour ${slice.numeroTour} doit être payée en totalité (${slice.remaining.toLocaleString("fr-FR")}).`,
        };
      }
      allocations.push({
        type: "PENALITE",
        numeroTour: slice.numeroTour,
        amount: slice.remaining,
        pendingPenaltyCotisationId: slice.pendingPenaltyCotisationId,
      });
      remaining = roundCurrency(remaining - slice.remaining);
    }
  }

  if (remaining > 0.001) {
    return {
      allocations: [],
      error: "Montant trop élevé par rapport aux dettes restantes du membre.",
    };
  }

  return { allocations };
}

export async function getCycleOutstandingDebtTotal(cycleId: string): Promise<number> {
  const ctx = await loadCycleDebtContext(cycleId);
  if (!ctx) return 0;

  const members = await prisma.cycleParticipant.findMany({
    where: { id_cycle: cycleId },
    select: { id_membre_groupe: true },
  });

  let total = 0;
  for (const member of members) {
    const summary = await getMemberDebtSummary(cycleId, member.id_membre_groupe);
    if (summary) total += summary.totalDue;
  }

  return roundCurrency(total);
}
