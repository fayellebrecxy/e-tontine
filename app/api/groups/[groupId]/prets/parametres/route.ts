import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { ensureParametresPret } from "@/lib/pret-eligibility";
import { requireAdmin } from "@/lib/pret-auth";

const schema = z.object({
  anciennete_min_jours: z.number().int().min(0).optional(),
  plafond_pct_banque: z.number().min(1).max(100).optional(),
  modele_contrat_avaliste: z.string().min(20).optional(),
  refus_sans_epargne: z.boolean().optional(),
});

export async function GET(
  _request: Request,
  ctx: { params: Promise<{ groupId: string }> },
) {
  const { groupId } = await ctx.params;
  const auth = await requireAdmin(groupId);
  if ("error" in auth && auth.error) return auth.error;

  const parametres = await ensureParametresPret(groupId);
  return NextResponse.json({ ok: true, parametres });
}

export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ groupId: string }> },
) {
  const { groupId } = await ctx.params;
  const auth = await requireAdmin(groupId);
  if ("error" in auth && auth.error) return auth.error;

  const body = schema.safeParse(await request.json().catch(() => null));
  if (!body.success) {
    return NextResponse.json({ ok: false, error: "Données invalides." }, { status: 400 });
  }

  const parametres = await ensureParametresPret(groupId);
  const updated = await prisma.parametresPretGroupe.update({
    where: { id_parametres: parametres.id_parametres },
    data: body.data,
  });

  return NextResponse.json({ ok: true, parametres: updated });
}
