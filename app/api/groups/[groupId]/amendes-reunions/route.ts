import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * GET /api/groups/[groupId]/amendes-reunions
 * Retourne le solde de la caisse amendes réunions + historique (admin uniquement).
 */
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
    where: { id_user: data.user.id, id_groupe: groupId, role: "ADMIN", statut_adhesion: "ACTIF" },
    select: { id_membre_groupe: true },
  });
  if (!membership) return NextResponse.json({ ok: false, error: "Admin only." }, { status: 403 });

  // ─── Amendes collectées ───
  // Récupérer toutes les présences payées + montant_amende de la réunion
  const presencesPaieees = await prisma.presenceReunion.findMany({
    where: {
      amende_payee: true,
      reunion: { id_groupe: groupId },
    },
    select: {
      id_presence: true,
      id_membre_groupe: true,
      statut_presence: true,
      date_enregistrement: true,
      reunion: {
        select: {
          id_reunion: true,
          titre: true,
          date_reunion: true,
          montant_amende: true,
        },
      },
      membre_groupe: {
        select: {
          user: { select: { nom: true, prenom: true } },
        },
      },
    },
    orderBy: { date_enregistrement: "desc" },
  });

  // ─── Retraits effectués ───
  const retraits = await prisma.retraitAmendeReunion.findMany({
    where: { id_groupe: groupId },
    select: {
      id_retrait_amende: true,
      montant: true,
      motif: true,
      date_retrait: true,
      valideur: {
        select: {
          user: { select: { nom: true, prenom: true } },
        },
      },
    },
    orderBy: { date_retrait: "desc" },
  });

  // ─── Calcul du solde ───
  const totalCollecte = presencesPaieees.reduce(
    (acc, p) => acc + Number(p.reunion.montant_amende ?? 0),
    0,
  );
  const totalRetire = retraits.reduce((acc, r) => acc + Number(r.montant), 0);
  const solde = totalCollecte - totalRetire;

  return NextResponse.json(
    {
      ok: true,
      solde,
      totalCollecte,
      totalRetire,
      presencesPaieees,
      retraits,
    },
    { status: 200 },
  );
}
