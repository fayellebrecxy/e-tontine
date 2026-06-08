import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { caisseAmendesReunion, recordMouvementFinancier } from "@/lib/financial-journal";

const retraitSchema = z.object({
  montant: z.number().positive("Le montant doit être positif."),
  motif: z.string().min(3, "Le motif est requis.").max(300),
});

/**
 * POST /api/groups/[groupId]/amendes-reunions/retraits
 * Admin effectue un retrait depuis la caisse amendes réunions.
 * Le montant ne peut pas dépasser le solde disponible.
 */
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

  const body = retraitSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) {
    return NextResponse.json(
      { ok: false, error: body.error.errors[0]?.message ?? "Données invalides." },
      { status: 400 },
    );
  }

  const { montant, motif } = body.data;

  // ─── Calculer le solde actuel ───
  const presencesPaieees = await prisma.presenceReunion.findMany({
    where: { amende_payee: true, reunion: { id_groupe: groupId } },
    select: { reunion: { select: { montant_amende: true } } },
  });
  const totalCollecte = presencesPaieees.reduce(
    (acc, p) => acc + Number(p.reunion.montant_amende ?? 0),
    0,
  );

  const totalRetire = await prisma.retraitAmendeReunion.aggregate({
    where: { id_groupe: groupId },
    _sum: { montant: true },
  });
  const totalRetireVal = Number(totalRetire._sum.montant ?? 0);
  const solde = totalCollecte - totalRetireVal;

  // ─── Vérifier que le montant ne dépasse pas le solde ───
  if (montant > solde) {
    return NextResponse.json(
      {
        ok: false,
        error: `Montant insuffisant en caisse. Solde disponible : ${solde.toLocaleString("fr-FR")}`,
      },
      { status: 409 },
    );
  }

  // ─── Créer le retrait ───
  const retrait = await prisma.$transaction(async (tx) => {
    const created = await tx.retraitAmendeReunion.create({
      data: {
        id_groupe: groupId,
        id_admin_valideur: membership.id_membre_groupe,
        montant,
        motif,
      },
      select: {
        id_retrait_amende: true,
        montant: true,
        motif: true,
        date_retrait: true,
      },
    });

    await recordMouvementFinancier(tx, {
      groupId,
      caisse: caisseAmendesReunion(),
      type: "SORTIE",
      source: "RETRAIT_AMENDES_REUNION",
      montant,
      motif,
      adminId: membership.id_membre_groupe,
      referenceType: "retraits_amendes_reunions",
      referenceId: created.id_retrait_amende,
      dateMouvement: created.date_retrait,
    });

    return created;
  });

  return NextResponse.json({ ok: true, retrait, nouveauSolde: solde - montant }, { status: 201 });
}
