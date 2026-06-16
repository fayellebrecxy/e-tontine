import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createCyclePaymentSchema } from "@/lib/validations";
import { createNotification } from "@/lib/notifications";
import { getCycleTurnSnapshot } from "@/lib/cycle-turns";
import { majStatutMembre } from "@/lib/membre-statut";
import {
  allocateMemberPayment,
  getMemberDebtSummary,
} from "@/lib/cycle-member-debts";
import { applyPaymentAllocations } from "@/lib/cycle-payment-processor";
import { applyAutomaticOverduePenalties } from "@/lib/cycle-penalties";

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ groupId: string; cycleId: string }> },
) {
  const { groupId, cycleId } = await ctx.params;

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: "Missing Supabase environment variables." },
      { status: 500 },
    );
  }

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  const membership = await prisma.membreGroupe.findFirst({
    where: { id_user: data.user.id, id_groupe: groupId, role: "ADMIN", statut_adhesion: "ACTIF" },
    select: { id_membre_groupe: true },
  });

  if (!membership) {
    return NextResponse.json({ ok: false, error: "Admin only." }, { status: 403 });
  }

  const parsedBody = createCyclePaymentSchema.safeParse(await request.json().catch(() => null));
  if (!parsedBody.success) {
    return NextResponse.json({ ok: false, error: "Invalid input." }, { status: 400 });
  }

  const { id_membre_groupe, montant, date_paiement } = parsedBody.data;
  const datePaiement = date_paiement ? new Date(date_paiement) : new Date();

  if (Number.isNaN(datePaiement.getTime())) {
    return NextResponse.json({ ok: false, error: "Invalid payment date." }, { status: 400 });
  }

  const cycle = await prisma.cycleTontine.findFirst({
    where: { id_cycle: cycleId, id_groupe: groupId },
    select: {
      id_cycle: true,
      nom_cycle: true,
      date_debut: true,
      duree_tour_de_gain: true,
      montant_cotisation: true,
      penalites_activees: true,
      mode_penalite: true,
      valeur_penalite: true,
      versements: { select: { numero_tour: true, date_versement: true } },
    },
  });

  if (!cycle) {
    return NextResponse.json({ ok: false, error: "Cycle not found." }, { status: 404 });
  }

  const participant = await prisma.cycleParticipant.findUnique({
    where: { id_cycle_id_membre_groupe: { id_cycle: cycleId, id_membre_groupe } },
    select: {
      membre_groupe: { select: { statut_adhesion: true } },
    },
  });

  if (!participant || participant.membre_groupe.statut_adhesion !== "ACTIF") {
    return NextResponse.json(
      { ok: false, error: "Member is not active in this cycle." },
      { status: 409 },
    );
  }

  try {
    await applyAutomaticOverduePenalties(cycleId);

    const snapshot = await getCycleTurnSnapshot(cycleId);
    const debt = await getMemberDebtSummary(cycleId, id_membre_groupe, datePaiement);

    if (!debt || debt.totalDue <= 0) {
      return NextResponse.json(
        { ok: false, error: "Ce membre n'a aucune cotisation ou pénalité en attente." },
        { status: 409 },
      );
    }

    const montantRecu = roundCurrency(montant);
    if (montantRecu > debt.totalDue) {
      return NextResponse.json(
        {
          ok: false,
          error: `Montant trop élevé. Total dû : ${debt.totalDue.toLocaleString("fr-FR")}.`,
        },
        { status: 400 },
      );
    }

    const { allocations, error: allocationError } = allocateMemberPayment(
      montantRecu,
      debt.slices,
    );

    if (allocationError) {
      return NextResponse.json({ ok: false, error: allocationError }, { status: 400 });
    }

    const createdIds = await prisma.$transaction((tx) =>
      applyPaymentAllocations(tx, {
        groupId,
        cycle: {
          id_cycle: cycle.id_cycle,
          nom_cycle: cycle.nom_cycle,
          date_debut: cycle.date_debut,
          duree_tour_de_gain: cycle.duree_tour_de_gain,
          mode_penalite: cycle.mode_penalite,
          valeur_penalite: cycle.valeur_penalite ? Number(cycle.valeur_penalite) : null,
        },
        versements: cycle.versements,
        memberId: id_membre_groupe,
        adminId: membership.id_membre_groupe,
        datePaiement,
        allocations,
      }),
    );

    const penaltyCollected = allocations
      .filter((item) => item.type === "PENALITE")
      .reduce((acc, item) => acc + item.amount, 0);

    const targetMember = await prisma.membreGroupe.findUnique({
      where: { id_membre_groupe },
      select: { id_user: true, groupe: { select: { nom: true } } },
    });

    if (targetMember) {
      const tourLabel = snapshot.activeTour
        ? `tour actif ${snapshot.activeTour}`
        : "règlement des arriérés";

      await createNotification({
        userId: targetMember.id_user,
        groupId,
        type: "PAIEMENT_RECU",
        message: `Votre versement de ${montant.toLocaleString("fr-FR")} (${tourLabel}) du cycle "${cycle.nom_cycle}" (Groupe : ${targetMember.groupe.nom}) a été enregistré.`,
      });

      if (penaltyCollected > 0) {
        await createNotification({
          userId: targetMember.id_user,
          groupId,
          type: "PENALITE_APPLIQUEE",
          message: `Une pénalité de ${penaltyCollected.toLocaleString("fr-FR")} a été collectée sur votre versement.`,
        });
      }
    }

    majStatutMembre(id_membre_groupe).catch(() => null);

    return NextResponse.json(
      { ok: true, payment: { allocations, createdIds } },
      { status: 201 },
    );
  } catch {
    return NextResponse.json({ ok: false, error: "Internal server error." }, { status: 500 });
  }
}
