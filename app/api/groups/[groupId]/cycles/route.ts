import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createCycleSchema } from "@/lib/validations";

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ groupId: string }> },
) {
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

  const { nom_cycle, duree_tour_de_gain, montant_cotisation, participants } = parsedBody.data;

  const members = await prisma.membreGroupe.findMany({
    where: {
      id_groupe: groupId,
      id_membre_groupe: { in: participants },
      statut_adhesion: "ACTIF",
    },
    select: { id_membre_groupe: true },
  });

  if (members.length !== participants.length) {
    return NextResponse.json(
      { ok: false, error: "Some participants are invalid or inactive." },
      { status: 409 },
    );
  }

  const dateDebut = new Date();
  const dateFin = addDays(dateDebut, duree_tour_de_gain * participants.length);

  try {
    const result = await prisma.$transaction(async (tx) => {
      const cycle = await tx.cycleTontine.create({
        data: {
          id_groupe: groupId,
          nom_cycle: nom_cycle.trim(),
          date_debut: dateDebut,
          date_fin: dateFin,
          duree_tour_de_gain,
        },
        select: {
          id_cycle: true,
          nom_cycle: true,
          date_debut: true,
          date_fin: true,
          duree_tour_de_gain: true,
        },
      });

      await tx.cotisations.createMany({
        data: members.map((member) => ({
          id_membre_groupe: member.id_membre_groupe,
          id_cycle: cycle.id_cycle,
          date_debut: dateDebut,
          date_de_paiement: dateDebut,
          montant: montant_cotisation,
        })),
      });

      return cycle;
    });

    return NextResponse.json(
      { ok: true, cycle: result, participants: members.length },
      { status: 201 },
    );
  } catch (err) {
    return NextResponse.json({ ok: false, error: "Internal server error." }, { status: 500 });
  }
}
