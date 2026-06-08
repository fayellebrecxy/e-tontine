import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { signalerMouvementEpargne } from "@/lib/epargne";

const signalementSchema = z.object({
  motif: z.string(),
});

export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ groupId: string; movementId: string }> },
) {
  const { groupId, movementId } = await ctx.params;

  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ ok: false, error: "Missing env." }, { status: 500 });

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });

  const membership = await prisma.membreGroupe.findFirst({
    where: { id_user: data.user.id, id_groupe: groupId, statut_adhesion: "ACTIF" },
    select: { id_membre_groupe: true },
  });
  if (!membership) return NextResponse.json({ ok: false, error: "Accès refusé" }, { status: 403 });

  const body = signalementSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) {
    return NextResponse.json({ ok: false, error: "Données invalides." }, { status: 400 });
  }

  const result = await signalerMouvementEpargne({
    groupId,
    movementId,
    memberId: membership.id_membre_groupe,
    motif: body.data.motif,
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
