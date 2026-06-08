import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createNotification } from "@/lib/notifications";

const createReunionSchema = z.object({
  titre: z.string().min(2).max(120),
  description: z.string().max(500).optional(),
  date_reunion: z.string().datetime(),
  lieu: z.string().max(200).optional(),
  type_reunion: z.enum(["ORDINAIRE", "EXTRAORDINAIRE", "URGENCE"]).default("ORDINAIRE"),
  montant_amende: z.number().min(0).optional(),
});

export async function GET(
  _request: NextRequest,
  ctx: { params: Promise<{ groupId: string }> },
) {
  const { groupId } = await ctx.params;

  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ ok: false, error: "Missing env." }, { status: 500 });

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });

  const membership = await prisma.membreGroupe.findFirst({
    where: { id_user: data.user.id, id_groupe: groupId, statut_adhesion: "ACTIF" },
    select: { id_membre_groupe: true, role: true },
  });
  if (!membership) return NextResponse.json({ ok: false, error: "Forbidden." }, { status: 403 });

  const reunions = await prisma.reunion.findMany({
    where: { id_groupe: groupId },
    orderBy: { date_reunion: "desc" },
    select: {
      id_reunion: true,
      titre: true,
      description: true,
      date_reunion: true,
      lieu: true,
      type_reunion: true,
      statut: true,
      montant_amende: true,
      compte_rendu: true,
      date_creation: true,
      presences: membership.role === "ADMIN"
        ? {
            select: {
              id_presence: true,
              id_membre_groupe: true,
              statut_presence: true,
              amende_payee: true,
              note_absence: true,
              membre_groupe: {
                select: {
                  user: { select: { nom: true, prenom: true } },
                },
              },
            },
          }
        : {
            where: { id_membre_groupe: membership.id_membre_groupe },
            select: {
              id_presence: true,
              statut_presence: true,
              amende_payee: true,
              note_absence: true,
            },
          },
    },
  });

  return NextResponse.json({ ok: true, reunions }, { status: 200 });
}

export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ groupId: string }> },
) {
  const { groupId } = await ctx.params;

  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ ok: false, error: "Missing env." }, { status: 500 });

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });

  const membership = await prisma.membreGroupe.findFirst({
    where: { id_user: data.user.id, id_groupe: groupId, role: "ADMIN", statut_adhesion: "ACTIF" },
    select: { id_membre_groupe: true },
  });
  if (!membership) return NextResponse.json({ ok: false, error: "Admin only." }, { status: 403 });

  const body = createReunionSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ ok: false, error: "Invalid input." }, { status: 400 });

  const { titre, description, date_reunion, lieu, type_reunion, montant_amende } = body.data;
  const dateReunion = new Date(date_reunion);
  if (dateReunion.getTime() <= Date.now()) {
    return NextResponse.json(
      { ok: false, error: "La date de la réunion doit être dans le futur." },
      { status: 409 },
    );
  }

  const reunion = await prisma.reunion.create({
    data: {
      id_groupe: groupId,
      titre,
      description,
      date_reunion: dateReunion,
      lieu,
      type_reunion,
      montant_amende: montant_amende ?? null,
    },
    select: { id_reunion: true, titre: true, date_reunion: true, lieu: true },
  });

  // Notifier tous les membres actifs
  const membres = await prisma.membreGroupe.findMany({
    where: { id_groupe: groupId, statut_adhesion: "ACTIF" },
    select: { id_user: true },
  });

  const dateStr = new Date(date_reunion).toLocaleDateString("fr-FR", {
    weekday: "long", day: "2-digit", month: "long", year: "numeric",
  });
  const heureStr = new Date(date_reunion).toLocaleTimeString("fr-FR", {
    hour: "2-digit", minute: "2-digit",
  });

  await Promise.all(
    membres.map((m) =>
      createNotification({
        userId: m.id_user,
        groupId,
        type: "REUNION_PLANIFIEE",
        message: `📅 Réunion planifiée : "${titre}" — ${dateStr} à ${heureStr}${lieu ? ` (${lieu})` : ""}.`,
      }),
    ),
  );

  return NextResponse.json({ ok: true, reunion }, { status: 201 });
}
