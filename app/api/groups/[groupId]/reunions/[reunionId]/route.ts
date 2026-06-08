import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createNotification } from "@/lib/notifications";

const updateReunionSchema = z.object({
  titre: z.string().min(2).max(120).optional(),
  description: z.string().max(500).optional().nullable(),
  date_reunion: z.string().datetime().optional(),
  lieu: z.string().max(200).optional().nullable(),
  type_reunion: z.enum(["ORDINAIRE", "EXTRAORDINAIRE", "URGENCE"]).optional(),
  montant_amende: z.number().min(0).optional().nullable(),
  statut: z.enum(["PLANIFIEE", "TERMINEE", "ANNULEE"]).optional(),
  compte_rendu: z.string().optional().nullable(),
});

export async function GET(
  _request: NextRequest,
  ctx: { params: Promise<{ groupId: string; reunionId: string }> },
) {
  const { groupId, reunionId } = await ctx.params;

  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ ok: false, error: "Missing env." }, { status: 500 });

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });

  const membership = await prisma.membreGroupe.findFirst({
    where: { id_user: data.user.id, id_groupe: groupId, statut_adhesion: "ACTIF" },
    select: { id_membre_groupe: true, role: true },
  });
  if (!membership) return NextResponse.json({ ok: false, error: "Forbidden." }, { status: 403 });

  const reunion = await prisma.reunion.findFirst({
    where: { id_reunion: reunionId, id_groupe: groupId },
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
      presences: {
        select: {
          id_presence: true,
          id_membre_groupe: true,
          statut_presence: true,
          amende_payee: true,
          note_absence: true,
          date_enregistrement: true,
          membre_groupe: {
            select: {
              user: { select: { nom: true, prenom: true, email: true } },
            },
          },
        },
      },
    },
  });

  if (!reunion) return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });

  // Membres n'ont accès qu'à leur propre présence
  const reunionData = membership.role === "ADMIN"
    ? reunion
    : {
        ...reunion,
        presences: reunion.presences.filter(
          (p) => p.id_membre_groupe === membership.id_membre_groupe,
        ),
      };

  return NextResponse.json({ ok: true, reunion: reunionData }, { status: 200 });
}

export async function PATCH(
  request: NextRequest,
  ctx: { params: Promise<{ groupId: string; reunionId: string }> },
) {
  const { groupId, reunionId } = await ctx.params;

  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ ok: false, error: "Missing env." }, { status: 500 });

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });

  const membership = await prisma.membreGroupe.findFirst({
    where: { id_user: data.user.id, id_groupe: groupId, role: "ADMIN", statut_adhesion: "ACTIF" },
    select: { id_membre_groupe: true },
  });
  if (!membership) return NextResponse.json({ ok: false, error: "Admin only." }, { status: 403 });

  const reunion = await prisma.reunion.findFirst({
    where: { id_reunion: reunionId, id_groupe: groupId },
    select: {
      id_reunion: true,
      titre: true,
      statut: true,
      date_reunion: true,
      compte_rendu: true,
      presences: {
        select: {
          id_presence: true,
          amende_payee: true,
          statut_presence: true,
        },
      },
    },
  });
  if (!reunion) return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });

  const body = updateReunionSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ ok: false, error: "Invalid input." }, { status: 400 });

  const now = new Date();
  const isCompteRenduUpdate = body.data.compte_rendu !== undefined;
  const isPlanningUpdate = body.data.titre !== undefined
    || body.data.description !== undefined
    || body.data.date_reunion !== undefined
    || body.data.lieu !== undefined
    || body.data.type_reunion !== undefined
    || body.data.montant_amende !== undefined;

  if (body.data.date_reunion !== undefined && new Date(body.data.date_reunion).getTime() <= now.getTime()) {
    return NextResponse.json(
      { ok: false, error: "La date de la réunion doit être dans le futur." },
      { status: 409 },
    );
  }

  if (isPlanningUpdate && reunion.statut !== "PLANIFIEE") {
    return NextResponse.json(
      { ok: false, error: "Une réunion terminée ou annulée ne peut plus être modifiée." },
      { status: 409 },
    );
  }

  if (body.data.statut === "TERMINEE") {
    return NextResponse.json(
      { ok: false, error: "Une réunion doit être terminée en enregistrant les présences." },
      { status: 409 },
    );
  }
  if (body.data.statut === "ANNULEE" && reunion.statut !== "PLANIFIEE") {
    return NextResponse.json(
      { ok: false, error: "Seule une réunion planifiée peut être annulée." },
      { status: 409 },
    );
  }
  if (body.data.statut === "ANNULEE" && reunion.presences.some((presence) => presence.amende_payee)) {
    return NextResponse.json(
      { ok: false, error: "Une réunion avec une amende déjà payée ne peut pas être annulée." },
      { status: 409 },
    );
  }

  if (isCompteRenduUpdate) {
    if (reunion.statut !== "TERMINEE" || reunion.date_reunion.getTime() > now.getTime()) {
      return NextResponse.json(
        { ok: false, error: "Le compte-rendu ne peut être publié qu'après une réunion tenue." },
        { status: 409 },
      );
    }
    if (!body.data.compte_rendu?.trim()) {
      return NextResponse.json(
        { ok: false, error: "Le compte-rendu ne peut pas être vide." },
        { status: 400 },
      );
    }
  }

  const wasAnnulee = body.data.statut === "ANNULEE" && reunion.statut !== "ANNULEE";
  const compteRenduPublie = isCompteRenduUpdate
    && !!body.data.compte_rendu?.trim()
    && !reunion.compte_rendu;

  const updated = await prisma.reunion.update({
    where: { id_reunion: reunionId },
    data: {
      ...(body.data.titre !== undefined && { titre: body.data.titre }),
      ...(body.data.description !== undefined && { description: body.data.description }),
      ...(body.data.date_reunion !== undefined && { date_reunion: new Date(body.data.date_reunion) }),
      ...(body.data.lieu !== undefined && { lieu: body.data.lieu }),
      ...(body.data.type_reunion !== undefined && { type_reunion: body.data.type_reunion }),
      ...(body.data.montant_amende !== undefined && { montant_amende: body.data.montant_amende }),
      ...(body.data.statut !== undefined && { statut: body.data.statut }),
      ...(typeof body.data.compte_rendu === "string" && { compte_rendu: body.data.compte_rendu.trim() }),
    },
    select: { id_reunion: true, titre: true, statut: true, date_reunion: true, compte_rendu: true },
  });

  // Notifier si annulation
  if (wasAnnulee) {
    const membres = await prisma.membreGroupe.findMany({
      where: { id_groupe: groupId, statut_adhesion: "ACTIF" },
      select: { id_user: true },
    });
    const dateStr = reunion.date_reunion.toLocaleDateString("fr-FR", {
      day: "2-digit", month: "long", year: "numeric",
    });
    await Promise.all(
      membres.map((m) =>
        createNotification({
          userId: m.id_user,
          groupId,
          type: "REUNION_ANNULEE",
          message: `❌ La réunion "${reunion.titre}" du ${dateStr} a été annulée.`,
        }),
      ),
    );
  }

  // Notifier si compte-rendu publié
  if (compteRenduPublie && body.data.compte_rendu) {
    const membres = await prisma.membreGroupe.findMany({
      where: { id_groupe: groupId, statut_adhesion: "ACTIF" },
      select: { id_user: true },
    });
    await Promise.all(
      membres.map((m) =>
        createNotification({
          userId: m.id_user,
          groupId,
          type: "REUNION_COMPTE_RENDU",
          message: `📝 Le compte-rendu de la réunion "${updated.titre}" est disponible.`,
        }),
      ),
    );
  }

  return NextResponse.json({ ok: true, reunion: updated }, { status: 200 });
}

export async function DELETE(
  _request: NextRequest,
  ctx: { params: Promise<{ groupId: string; reunionId: string }> },
) {
  const { groupId, reunionId } = await ctx.params;

  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ ok: false, error: "Missing env." }, { status: 500 });

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });

  const membership = await prisma.membreGroupe.findFirst({
    where: { id_user: data.user.id, id_groupe: groupId, role: "ADMIN", statut_adhesion: "ACTIF" },
    select: { id_membre_groupe: true },
  });
  if (!membership) return NextResponse.json({ ok: false, error: "Admin only." }, { status: 403 });

  const reunion = await prisma.reunion.findFirst({
    where: { id_reunion: reunionId, id_groupe: groupId },
    select: {
      id_reunion: true,
      statut: true,
      compte_rendu: true,
      presences: {
        select: {
          id_presence: true,
          amende_payee: true,
        },
      },
    },
  });
  if (!reunion) return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });

  const hasTraces = reunion.presences.length > 0 || !!reunion.compte_rendu;
  const hasPaidFine = reunion.presences.some((presence) => presence.amende_payee);
  if (reunion.statut !== "PLANIFIEE" || hasTraces || hasPaidFine) {
    return NextResponse.json(
      {
        ok: false,
        error: "Cette réunion contient déjà un historique. Annule-la plutôt que de la supprimer.",
      },
      { status: 409 },
    );
  }

  await prisma.reunion.delete({ where: { id_reunion: reunionId } });

  return NextResponse.json({ ok: true }, { status: 200 });
}
