import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { updateCycleSchema } from "@/lib/validations";
import { applyAutomaticOverduePenalties } from "@/lib/cycle-penalties";

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
      penalites_activees: true,
      mode_penalite: true,
      valeur_penalite: true,
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

  await applyAutomaticOverduePenalties(cycleId);

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
      numero_tour: true,
      date_echeance: true,
      penalite_appliquee: true,
      montant_penalite: true,
      penalite_collectee: true,
      penalites: {
        select: {
          id_penalite: true,
          motif: true,
          mode_penalite: true,
          valeur_configuree: true,
          jours_retard: true,
          date_echeance: true,
          date_application: true,
          montant_final: true,
        },
      },
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

  const cycle = await prisma.cycleTontine.findFirst({
    where: { id_cycle: cycleId, id_groupe: groupId },
    select: { id_cycle: true, date_fin: true },
  });

  if (!cycle) {
    return NextResponse.json({ ok: false, error: "Cycle not found." }, { status: 404 });
  }

  const rawBody = await request.json().catch(() => null);

  if (!rawBody || Object.keys(rawBody).length === 0) {
    if (cycle.date_fin <= new Date()) {
      return NextResponse.json(
        { ok: true, cycle: { id_cycle: cycleId, closed: true } },
        { status: 200 },
      );
    }

    const updated = await prisma.cycleTontine.update({
      where: { id_cycle: cycleId },
      data: { date_fin: new Date() },
      select: { id_cycle: true, date_fin: true },
    });

    return NextResponse.json({ ok: true, cycle: updated }, { status: 200 });
  }

  const parsedBody = updateCycleSchema.safeParse(rawBody);
  if (!parsedBody.success) {
    return NextResponse.json({ ok: false, error: "Invalid input." }, { status: 400 });
  }

  const {
    nom_cycle,
    date_debut,
    date_fin,
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

  const updated = await prisma.$transaction(async (tx) => {
    await tx.cycleParticipant.deleteMany({ where: { id_cycle: cycleId } });

    await tx.cycleParticipant.createMany({
      data: uniqueParticipants.map((memberId, index) => ({
        id_cycle: cycleId,
        id_membre_groupe: memberId,
        ordre: index + 1,
      })),
    });

    return tx.cycleTontine.update({
      where: { id_cycle: cycleId },
      data: {
        nom_cycle: nom_cycle.trim(),
        date_debut: new Date(date_debut),
        date_fin: new Date(date_fin),
        duree_tour_de_gain,
        montant_cotisation,
        ordre_beneficiaire: JSON.stringify(uniqueParticipants),
        penalites_activees: penalty_active,
        mode_penalite: penalty_active ? penalty_type ?? null : null,
        valeur_penalite: penalty_active ? (penalty_value ?? null) : null,
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
  });

  return NextResponse.json({ ok: true, cycle: updated }, { status: 200 });
}

export async function DELETE(
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
    select: { id_cycle: true },
  });

  if (!cycle) {
    return NextResponse.json({ ok: false, error: "Cycle not found." }, { status: 404 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.penalite.deleteMany({
      where: {
        cotisations: {
          id_cycle: cycleId,
        },
      },
    });
    await tx.cotisations.deleteMany({ where: { id_cycle: cycleId } });
    await tx.cycleParticipant.deleteMany({ where: { id_cycle: cycleId } });
    await tx.cycleTontine.delete({ where: { id_cycle: cycleId } });
  });

  return NextResponse.json({ ok: true }, { status: 200 });
}
