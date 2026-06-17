import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getBanqueSummary } from "@/lib/pret-banque";
import { checkPretEligibility, ensureParametresPret } from "@/lib/pret-eligibility";
import { submitPretDemande } from "@/lib/pret";
import { getGroupMembership } from "@/lib/pret-auth";
import { parseUniteDureePret } from "@/lib/pret-utils";

export async function GET(
  _request: Request,
  ctx: { params: Promise<{ groupId: string }> },
) {
  const { groupId } = await ctx.params;
  const auth = await getGroupMembership(groupId);
  if ("error" in auth && auth.error) return auth.error;

  const [prets, bank, parametres] = await Promise.all([
    prisma.pret.findMany({
      where: { id_groupe: groupId },
      orderBy: { date_demande: "desc" },
      include: {
        emprunteur: { include: { user: { select: { nom: true, prenom: true } } } },
        avalistes: {
          include: { membre: { include: { user: { select: { nom: true, prenom: true } } } } },
        },
      },
    }),
    getBanqueSummary(groupId),
    ensureParametresPret(groupId),
  ]);

  const mesGaranties = await prisma.avalistePret.findMany({
    where: {
      id_membre_groupe: auth.membership!.id_membre_groupe,
      pret: { id_groupe: groupId },
    },
    include: {
      pret: {
        include: { emprunteur: { include: { user: { select: { nom: true, prenom: true } } } } },
      },
    },
    orderBy: { date_proposition: "desc" },
  });

  const eligibility = await checkPretEligibility(groupId, auth.membership!.id_membre_groupe);

  return NextResponse.json({
    ok: true,
    prets,
    bank,
    parametres,
    mesGaranties,
    eligibility,
    isAdmin: auth.membership!.role === "ADMIN",
  });
}

export async function POST(
  request: Request,
  ctx: { params: Promise<{ groupId: string }> },
) {
  const { groupId } = await ctx.params;
  const auth = await getGroupMembership(groupId);
  if ("error" in auth && auth.error) return auth.error;

  const body = (await request.json().catch(() => null)) as {
    montantDemande?: number;
    dureeValeurDemandee?: number;
    dureeUniteDemandee?: string;
    motif?: string;
    avalisteIds?: string[];
  } | null;

  const dureeUniteDemandee = parseUniteDureePret(body?.dureeUniteDemandee) ?? "MOIS";

  if (!body?.montantDemande || !body.dureeValeurDemandee) {
    return NextResponse.json({ ok: false, error: "Données invalides." }, { status: 400 });
  }

  const result = await submitPretDemande({
    groupId,
    memberId: auth.membership!.id_membre_groupe,
    montantDemande: body.montantDemande,
    dureeValeurDemandee: body.dureeValeurDemandee,
    dureeUniteDemandee,
    motif: body.motif,
    avalisteIds: body.avalisteIds ?? [],
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
  }

  return NextResponse.json({ ok: true, pret: result.pret }, { status: 201 });
}
