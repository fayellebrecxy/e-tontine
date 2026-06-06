import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { notifyMembre } from "@/lib/notifications";

export async function GET(
  _request: NextRequest,
  ctx: { params: Promise<{ groupId: string; cycleId: string }> },
) {
  const { groupId, cycleId } = await ctx.params;

  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Missing env." }, { status: 500 });
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const caller = await prisma.membreGroupe.findFirst({
    where: { id_user: authData.user.id, id_groupe: groupId, statut_adhesion: "ACTIF" },
    select: { id_membre_groupe: true, role: true },
  });
  if (!caller) return NextResponse.json({ error: "Accès refusé." }, { status: 403 });

  const where =
    caller.role === "ADMIN"
      ? { id_cycle: cycleId }
      : {
          id_cycle: cycleId,
          OR: [
            { id_demandeur: caller.id_membre_groupe },
            { id_cible: caller.id_membre_groupe },
          ],
        };

  const echanges = await prisma.demandeEchange.findMany({
    where,
    orderBy: { date_demande: "desc" },
    select: {
      id_demande: true,
      tour_demandeur: true,
      tour_cible: true,
      statut: true,
      note: true,
      date_demande: true,
      date_reponse: true,
      demandeur: { select: { id_membre_groupe: true, user: { select: { nom: true, prenom: true } } } },
      cible: { select: { id_membre_groupe: true, user: { select: { nom: true, prenom: true } } } },
    },
  });

  return NextResponse.json({ ok: true, echanges });
}

const createSchema = z.object({
  id_cible: z.string().uuid(),
  note: z.string().max(300).optional(),
});

export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ groupId: string; cycleId: string }> },
) {
  const { groupId, cycleId } = await ctx.params;

  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Missing env." }, { status: 500 });
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const caller = await prisma.membreGroupe.findFirst({
    where: { id_user: authData.user.id, id_groupe: groupId, statut_adhesion: "ACTIF" },
    select: { id_membre_groupe: true, user: { select: { nom: true, prenom: true } } },
  });
  if (!caller) return NextResponse.json({ error: "Accès refusé." }, { status: 403 });

  const body = createSchema.safeParse(await request.json());
  if (!body.success) return NextResponse.json({ error: "Données invalides." }, { status: 400 });

  const { id_cible, note } = body.data;

  if (id_cible === caller.id_membre_groupe) {
    return NextResponse.json({ error: "Vous ne pouvez pas échanger avec vous-même." }, { status: 400 });
  }

  // Récupérer les tours des deux membres
  const [partDemandeur, partCible] = await Promise.all([
    prisma.cycleParticipant.findUnique({
      where: { id_cycle_id_membre_groupe: { id_cycle: cycleId, id_membre_groupe: caller.id_membre_groupe } },
      select: { ordre: true },
    }),
    prisma.cycleParticipant.findUnique({
      where: { id_cycle_id_membre_groupe: { id_cycle: cycleId, id_membre_groupe: id_cible } },
      select: { ordre: true },
    }),
  ]);

  if (!partDemandeur) return NextResponse.json({ error: "Vous n'êtes pas dans ce cycle." }, { status: 400 });
  if (!partCible) return NextResponse.json({ error: "Le membre cible n'est pas dans ce cycle." }, { status: 400 });

  // Vérifier que les deux tours sont dans le futur (non distribués)
  const versements = await prisma.versement.findMany({
    where: { id_cycle: cycleId },
    select: { numero_tour: true },
  });
  const toursDistribues = new Set(versements.map((v) => v.numero_tour));

  if (toursDistribues.has(partDemandeur.ordre)) {
    return NextResponse.json({ error: "Votre tour a déjà été distribué. Échange impossible." }, { status: 400 });
  }
  if (toursDistribues.has(partCible.ordre)) {
    return NextResponse.json({ error: "Le tour de la cible a déjà été distribué. Échange impossible." }, { status: 400 });
  }

  // Vérifier qu'il n'y a pas déjà une demande en cours
  const demandeExistante = await prisma.demandeEchange.findFirst({
    where: {
      id_cycle: cycleId,
      statut: { in: ["EN_ATTENTE", "ACCEPTEE_MEMBRES"] },
      OR: [
        { id_demandeur: caller.id_membre_groupe },
        { id_cible: caller.id_membre_groupe },
      ],
    },
  });
  if (demandeExistante) {
    return NextResponse.json({ error: "Vous avez déjà une demande d'échange en cours." }, { status: 400 });
  }

  const demande = await prisma.demandeEchange.create({
    data: {
      id_cycle: cycleId,
      id_demandeur: caller.id_membre_groupe,
      id_cible,
      tour_demandeur: partDemandeur.ordre,
      tour_cible: partCible.ordre,
      note: note ?? null,
    },
  });

  // Notifier la cible
  const nomDemandeur = `${caller.user.prenom} ${caller.user.nom}`;
  await notifyMembre({
    id_membre_groupe: id_cible,
    message: `${nomDemandeur} vous propose d'échanger vos places (tour ${partDemandeur.ordre} ↔ tour ${partCible.ordre}). Acceptez ou refusez dans le cycle.`,
    type: "PAIEMENT_RECU",
  });

  return NextResponse.json({ ok: true, demande });
}
