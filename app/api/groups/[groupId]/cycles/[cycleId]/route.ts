import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
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
    where: { id_user: authUser.id, id_groupe: groupId, statut_adhesion: "ACTIF" },
    select: { id_membre_groupe: true, role: true },
  });

  if (!membership) {
    return NextResponse.json({ ok: false, error: "Forbidden." }, { status: 403 });
  }

  const cycle = await prisma.cycleTontine.findFirst({
    where: { id_cycle: cycleId, id_groupe: groupId },
    select: {
      id_cycle: true,
      nom_cycle: true,
      date_debut: true,
      date_fin: true,
      duree_tour_de_gain: true,
      montant_cotisation: true,
      participants: {
        orderBy: { ordre: "asc" },
        select: {
          ordre: true,
          id_membre_groupe: true,
          membre_groupe: {
            select: {
              id_membre_groupe: true,
              role: true,
              statut_adhesion: true,
              user: {
                select: {
                  id_user: true,
                  nom: true,
                  prenom: true,
                  email: true,
                  telephone: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!cycle) {
    return NextResponse.json({ ok: false, error: "Cycle not found." }, { status: 404 });
  }

  if (membership.role !== "ADMIN") {
    const isParticipant = cycle.participants.some(
      (participant) => participant.id_membre_groupe === membership.id_membre_groupe,
    );

    if (!isParticipant) {
      return NextResponse.json({ ok: false, error: "Forbidden." }, { status: 403 });
    }
  }

  const payments = await prisma.cotisations.findMany({
    where:
      membership.role === "ADMIN"
        ? { id_cycle: cycleId }
        : { id_cycle: cycleId, id_membre_groupe: membership.id_membre_groupe },
    orderBy: { date_de_paiement: "desc" },
    select: {
      id_cotisation: true,
      id_membre_groupe: true,
      montant: true,
      date_de_paiement: true,
    },
  });

  return NextResponse.json(
    { ok: true, cycle, payments },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}

export async function PATCH(
  _request: NextRequest,
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

  const cycle = await prisma.cycleTontine.findFirst({
    where: { id_cycle: cycleId, id_groupe: groupId },
    select: { id_cycle: true, date_fin: true },
  });

  if (!cycle) {
    return NextResponse.json({ ok: false, error: "Cycle not found." }, { status: 404 });
  }

  if (cycle.date_fin <= new Date()) {
    return NextResponse.json({ ok: true, cycle: { id_cycle: cycleId, closed: true } }, { status: 200 });
  }

  const updated = await prisma.cycleTontine.update({
    where: { id_cycle: cycleId },
    data: { date_fin: new Date() },
    select: { id_cycle: true, date_fin: true },
  });

  return NextResponse.json({ ok: true, cycle: updated }, { status: 200 });
}
