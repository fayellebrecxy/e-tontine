import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createCyclePaymentSchema } from "@/lib/validations";

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

  const authUser = data.user;

  const membership = await prisma.membreGroupe.findFirst({
    where: { id_user: authUser.id, id_groupe: groupId, role: "ADMIN", statut_adhesion: "ACTIF" },
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
    select: { id_cycle: true, date_debut: true },
  });

  if (!cycle) {
    return NextResponse.json({ ok: false, error: "Cycle not found." }, { status: 404 });
  }

  const participant = await prisma.cycleParticipant.findUnique({
    where: { id_cycle_id_membre_groupe: { id_cycle: cycleId, id_membre_groupe } },
    select: {
      id_cycle: true,
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
    const payment = await prisma.cotisations.create({
      data: {
        id_cycle: cycle.id_cycle,
        id_membre_groupe,
        date_debut: cycle.date_debut,
        date_de_paiement: datePaiement,
        montant,
      },
      select: {
        id_cotisation: true,
        id_membre_groupe: true,
        montant: true,
        date_de_paiement: true,
      },
    });

    return NextResponse.json({ ok: true, payment }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ ok: false, error: "Internal server error." }, { status: 500 });
  }
}
