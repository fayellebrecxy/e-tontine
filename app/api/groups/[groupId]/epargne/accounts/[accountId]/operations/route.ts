import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { recordEpargneOperation } from "@/lib/epargne";

const operationSchema = z.object({
  type: z.enum(["DEPOT", "RETRAIT"]),
  montant: z.number(),
  motif: z.string(),
});

export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ groupId: string; accountId: string }> },
) {
  const { groupId, accountId } = await ctx.params;

  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ ok: false, error: "Missing env." }, { status: 500 });

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });

  const membership = await prisma.membreGroupe.findFirst({
    where: { id_user: data.user.id, id_groupe: groupId, statut_adhesion: "ACTIF" },
    select: { id_membre_groupe: true, role: true },
  });

  if (!membership) return NextResponse.json({ ok: false, error: "Accès refusé" }, { status: 403 });
  if (membership.role !== "ADMIN") {
    return NextResponse.json(
      { ok: false, error: "Action non autorisée pour ce rôle" },
      { status: 403 },
    );
  }

  const body = operationSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) {
    return NextResponse.json({ ok: false, error: "Données invalides." }, { status: 400 });
  }

  const result = await recordEpargneOperation({
    groupId,
    accountId,
    operatorMemberId: membership.id_membre_groupe,
    type: body.data.type,
    montant: body.data.montant,
    motif: body.data.motif,
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
  }

  return NextResponse.json({ ok: true, movement: result.movement }, { status: 201 });
}
