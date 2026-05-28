import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createCycleSchema } from "@/lib/validations";

import { createNotification } from "@/lib/notifications";

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export async function POST(request: NextRequest, ctx: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await ctx.params;

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

  const parsedBody = createCycleSchema.safeParse(await request.json().catch(() => null));
  if (!parsedBody.success) {
    return NextResponse.json({ ok: false, error: "Invalid input." }, { status: 400 });
  }

  const {
    nom_cycle,
    duree_tour_de_gain,
    montant_cotisation,
    participants,
    penalty_active,
    penalty_type,
    penalty_value,
  } = parsedBody.data;

  const uniqueParticipants = Array.from(new Set(participants));
  if (uniqueParticipants.length !== participants.length) {
    return NextResponse.json(
      { ok: false, error: "Duplicate participants are not allowed." },
      { status: 400 },
    );
  }

  const members = await prisma.membreGroupe.findMany({
    where: {
      id_groupe: groupId,
      id_membre_groupe: { in: uniqueParticipants },
      statut_adhesion: "ACTIF",
    },
    select: { id_membre_groupe: true },
  });

  if (members.length !== uniqueParticipants.length) {
    return NextResponse.json(
      { ok: false, error: "Some participants are invalid or inactive." },
      { status: 409 },
    );
  }

  const dateDebut = new Date();
  const dateFin = addDays(dateDebut, duree_tour_de_gain * uniqueParticipants.length);

  try {
    const result = await prisma.$transaction(async (tx) => {
      const cycle = await tx.cycleTontine.create({
        data: {
          id_groupe: groupId,
          nom_cycle: nom_cycle.trim(),
          date_debut: dateDebut,
          date_fin: dateFin,
          duree_tour_de_gain,
          montant_cotisation,
          ordre_beneficiaire: JSON.stringify(uniqueParticipants),
          penalites_activees: penalty_active,
          mode_penalite: penalty_active ? penalty_type : null,
          valeur_penalite: penalty_active ? penalty_value : null,
        },
        select: {
          id_cycle: true,
          nom_cycle: true,
          date_debut: true,
          date_fin: true,
          duree_tour_de_gain: true,
          montant_cotisation: true,
          penalites_activees: true,
          mode_penalite: true,
          valeur_penalite: true,
        },
      });

      await tx.cycleParticipant.createMany({
        data: uniqueParticipants.map((memberId, index) => ({
          id_cycle: cycle.id_cycle,
          id_membre_groupe: memberId,
          ordre: index + 1,
        })),
      });

      return cycle;
    });

    // Envoyer des notifications aux participants
    const participantsData = await prisma.membreGroupe.findMany({
      where: { id_membre_groupe: { in: uniqueParticipants } },
      select: { id_user: true },
    });

    const notifications = participantsData.map((p) =>
      createNotification({
        userId: p.id_user,
        groupId,
        type: "NOUVEAU_CYCLE",
        message: `Un nouveau cycle "${nom_cycle}" a été créé dans votre groupe.`,
      })
    );

    await Promise.all(notifications);

    return NextResponse.json(
      { ok: true, cycle: result, participants: members.length },
      { status: 201 },
    );
  } catch (err) {
    return NextResponse.json({ ok: false, error: "Internal server error." }, { status: 500 });
  }
}

export async function GET(_request: NextRequest, ctx: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await ctx.params;

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

  const cycles =
    membership.role === "ADMIN"
      ? await prisma.cycleTontine.findMany({
          where: { id_groupe: groupId },
          orderBy: { date_debut: "desc" },
          select: {
            id_cycle: true,
            nom_cycle: true,
            date_debut: true,
            date_fin: true,
            duree_tour_de_gain: true,
            montant_cotisation: true,
            penalites_activees: true,
            mode_penalite: true,
            valeur_penalite: true,
            _count: { select: { participants: true } },
          },
        })
      : await prisma.cycleParticipant.findMany({
          where: { id_membre_groupe: membership.id_membre_groupe },
          orderBy: { cycle: { date_debut: "desc" } },
          select: {
            cycle: {
              select: {
                id_cycle: true,
                nom_cycle: true,
                date_debut: true,
                date_fin: true,
                duree_tour_de_gain: true,
                montant_cotisation: true,
                penalites_activees: true,
                mode_penalite: true,
                valeur_penalite: true,
                _count: { select: { participants: true } },
              },
            },
          },
        });

  const normalized = Array.isArray(cycles)
    ? cycles.map((item) => ("cycle" in item ? item.cycle : item))
    : [];

  return NextResponse.json(
    { ok: true, cycles: normalized },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
