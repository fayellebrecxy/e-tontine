import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { notifyMembre } from "@/lib/notifications";

// body : { action: "monter"|"descendre"|"tirage"|"manuel", membreId?: string, nouvelOrdre?: string[] }
const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("monter"), membreId: z.string().uuid() }),
  z.object({ action: z.literal("descendre"), membreId: z.string().uuid() }),
  z.object({ action: z.literal("tirage") }),
  z.object({ action: z.literal("manuel"), nouvelOrdre: z.array(z.string().uuid()).min(1) }),
]);

export async function PATCH(
  request: NextRequest,
  ctx: { params: Promise<{ groupId: string; cycleId: string }> },
) {
  const { groupId, cycleId } = await ctx.params;

  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Missing env." }, { status: 500 });

  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  // Admin seulement
  const admin = await prisma.membreGroupe.findFirst({
    where: { id_user: authData.user.id, id_groupe: groupId, statut_adhesion: "ACTIF", role: "ADMIN" },
    select: { id_membre_groupe: true },
  });
  if (!admin) return NextResponse.json({ error: "Admin requis." }, { status: 403 });

  const body = schema.safeParse(await request.json());
  if (!body.success) return NextResponse.json({ error: "Données invalides." }, { status: 400 });

  // Récupérer les participants triés par ordre actuel
  const participants = await prisma.cycleParticipant.findMany({
    where: { id_cycle: cycleId },
    orderBy: { ordre: "asc" },
    select: { id_cycle_participant: true, id_membre_groupe: true, ordre: true },
  });

  if (participants.length === 0) {
    return NextResponse.json({ error: "Aucun participant dans ce cycle." }, { status: 400 });
  }

  // Tours déjà distribués → verrouillés
  const versements = await prisma.versement.findMany({
    where: { id_cycle: cycleId },
    select: { id_beneficiaire: true, numero_tour: true },
  });
  const toursDistribues = new Set(versements.map((v) => v.numero_tour));
  const membresVerrouilles = new Set(versements.map((v) => v.id_beneficiaire));

  // Fonction utilitaire : appliquer un nouvel ordre (tableau de membreId dans l'ordre souhaité)
  const appliquerOrdre = async (ordreIds: string[]) => {
    // Vérifier que les membres verrouillés restent à leur position
    for (const [i, membreId] of ordreIds.entries()) {
      const tourSouhaite = i + 1;
      if (membresVerrouilles.has(membreId)) {
        const tourActuel = participants.find((p) => p.id_membre_groupe === membreId)?.ordre;
        if (tourActuel !== tourSouhaite) {
          return { error: `Le tour ${tourActuel} est verrouillé (pot déjà distribué).` };
        }
      }
    }
    // Mettre à jour en transaction
    await prisma.$transaction(
      ordreIds.map((membreId, i) => {
        const participant = participants.find((p) => p.id_membre_groupe === membreId);
        if (!participant) throw new Error(`Participant ${membreId} introuvable.`);
        return prisma.cycleParticipant.update({
          where: { id_cycle_participant: participant.id_cycle_participant },
          data: { ordre: i + 1 },
        });
      }),
    );
    return { ok: true };
  };

  const { data: action } = body;

  if (action.action === "monter" || action.action === "descendre") {
    const idx = participants.findIndex((p) => p.id_membre_groupe === action.membreId);
    if (idx === -1) return NextResponse.json({ error: "Membre introuvable." }, { status: 404 });

    const swapIdx = action.action === "monter" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= participants.length) {
      return NextResponse.json({ error: "Déjà en position limite." }, { status: 400 });
    }

    // Vérifier qu'aucun des deux tours n'est verrouillé
    const tourA = participants[idx].ordre;
    const tourB = participants[swapIdx].ordre;
    if (toursDistribues.has(tourA) || toursDistribues.has(tourB)) {
      return NextResponse.json({ error: "Ce tour est verrouillé (pot déjà distribué)." }, { status: 400 });
    }

    const newOrdre = participants.map((p) => p.id_membre_groupe);
    // Swap
    [newOrdre[idx], newOrdre[swapIdx]] = [newOrdre[swapIdx], newOrdre[idx]];

    const result = await appliquerOrdre(newOrdre);
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });
  }

  else if (action.action === "tirage") {
    // Séparer membres verrouillés et non-verrouillés
    const verrous = participants.filter((p) => membresVerrouilles.has(p.id_membre_groupe));
    const libres = participants.filter((p) => !membresVerrouilles.has(p.id_membre_groupe));

    // Mélange Fisher-Yates des membres libres
    for (let i = libres.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [libres[i], libres[j]] = [libres[j], libres[i]];
    }

    // Reconstruire l'ordre : les verrouillés restent à leur position, les libres remplissent les gaps
    const newOrdre: string[] = new Array(participants.length).fill("");
    for (const p of verrous) {
      newOrdre[p.ordre - 1] = p.id_membre_groupe;
    }
    let libreIdx = 0;
    for (let i = 0; i < newOrdre.length; i++) {
      if (!newOrdre[i]) {
        newOrdre[i] = libres[libreIdx].id_membre_groupe;
        libreIdx++;
      }
    }

    const result = await appliquerOrdre(newOrdre);
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });
  }

  else if (action.action === "manuel") {
    if (action.nouvelOrdre.length !== participants.length) {
      return NextResponse.json({ error: "Nombre de participants incorrect." }, { status: 400 });
    }
    const result = await appliquerOrdre(action.nouvelOrdre);
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });
  }

  // Notifier tous les membres de la mise à jour de l'ordre
  const tousLesMembres = participants.map((p) => p.id_membre_groupe);
  await Promise.allSettled(
    tousLesMembres.map((membreId) =>
      notifyMembre({
        id_membre_groupe: membreId,
        message: "L'ordre de passage du cycle a été modifié par l'admin. Consultez le cycle pour voir votre nouveau tour.",
        type: "NOUVEAU_CYCLE",
      }),
    ),
  );

  return NextResponse.json({ ok: true });
}
