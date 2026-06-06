import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { notifyMembre } from "@/lib/notifications";

// action: "accepter_cible" | "refuser_cible" | "valider_admin" | "refuser_admin" | "annuler"
const schema = z.object({
  action: z.enum(["accepter_cible", "refuser_cible", "valider_admin", "refuser_admin", "annuler"]),
});

export async function PATCH(
  request: NextRequest,
  ctx: { params: Promise<{ groupId: string; cycleId: string; echangeId: string }> },
) {
  const { groupId, cycleId, echangeId } = await ctx.params;

  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Missing env." }, { status: 500 });
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });

  const caller = await prisma.membreGroupe.findFirst({
    where: { id_user: authData.user.id, id_groupe: groupId, statut_adhesion: "ACTIF" },
    select: { id_membre_groupe: true, role: true, user: { select: { nom: true, prenom: true } } },
  });
  if (!caller) return NextResponse.json({ error: "Accès refusé." }, { status: 403 });

  const body = schema.safeParse(await request.json());
  if (!body.success) return NextResponse.json({ error: "Action invalide." }, { status: 400 });
  const { action } = body.data;

  const demande = await prisma.demandeEchange.findFirst({
    where: { id_demande: echangeId, id_cycle: cycleId },
    select: {
      id_demande: true,
      id_cycle: true,
      id_demandeur: true,
      id_cible: true,
      tour_demandeur: true,
      tour_cible: true,
      statut: true,
      demandeur: { select: { user: { select: { nom: true, prenom: true } } } },
      cible: { select: { user: { select: { nom: true, prenom: true } } } },
    },
  });
  if (!demande) return NextResponse.json({ error: "Demande introuvable." }, { status: 404 });

  // ─── Réponse de la cible ───
  if (action === "accepter_cible" || action === "refuser_cible") {
    if (caller.id_membre_groupe !== demande.id_cible) {
      return NextResponse.json({ error: "Seule la cible peut répondre." }, { status: 403 });
    }
    if (demande.statut !== "EN_ATTENTE") {
      return NextResponse.json({ error: "Cette demande n'est plus en attente." }, { status: 400 });
    }

    if (action === "refuser_cible") {
      await prisma.demandeEchange.update({
        where: { id_demande: echangeId },
        data: { statut: "REFUSEE_CIBLE", date_reponse: new Date() },
      });
      await notifyMembre({
        id_membre_groupe: demande.id_demandeur,
        message: `${demande.cible.user.prenom} ${demande.cible.user.nom} a refusé votre demande d'échange de place.`,
        type: "PENALITE_APPLIQUEE",
      });
      return NextResponse.json({ ok: true, statut: "REFUSEE_CIBLE" });
    }

    // Accepté par la cible → notifier les admins
    await prisma.demandeEchange.update({
      where: { id_demande: echangeId },
      data: { statut: "ACCEPTEE_MEMBRES", date_reponse: new Date() },
    });

    const admins = await prisma.membreGroupe.findMany({
      where: { id_groupe: groupId, statut_adhesion: "ACTIF", role: "ADMIN" },
      select: { id_membre_groupe: true },
    });
    await Promise.allSettled(
      admins.map((a) =>
        notifyMembre({
          id_membre_groupe: a.id_membre_groupe,
          message: `${demande.demandeur.user.prenom} ${demande.demandeur.user.nom} et ${demande.cible.user.prenom} ${demande.cible.user.nom} ont accepté d'échanger leurs places (tours ${demande.tour_demandeur} ↔ ${demande.tour_cible}). Validez ou refusez dans le cycle.`,
          type: "PAIEMENT_RECU",
        }),
      ),
    );
    return NextResponse.json({ ok: true, statut: "ACCEPTEE_MEMBRES" });
  }

  // ─── Validation / refus admin ───
  if (action === "valider_admin" || action === "refuser_admin" || action === "annuler") {
    if (caller.role !== "ADMIN") {
      return NextResponse.json({ error: "Admin requis." }, { status: 403 });
    }

    if (action === "refuser_admin" || action === "annuler") {
      const statut = action === "refuser_admin" ? "REFUSEE_ADMIN" : "ANNULEE";
      await prisma.demandeEchange.update({
        where: { id_demande: echangeId },
        data: { statut, date_reponse: new Date() },
      });
      // Notifier les deux membres
      await Promise.allSettled([
        notifyMembre({
          id_membre_groupe: demande.id_demandeur,
          message: `Votre demande d'échange de place (tour ${demande.tour_demandeur} ↔ ${demande.tour_cible}) a été ${action === "refuser_admin" ? "refusée" : "annulée"} par l'administrateur.`,
          type: "PENALITE_APPLIQUEE",
        }),
        notifyMembre({
          id_membre_groupe: demande.id_cible,
          message: `La demande d'échange de place (tour ${demande.tour_demandeur} ↔ ${demande.tour_cible}) a été ${action === "refuser_admin" ? "refusée" : "annulée"} par l'administrateur.`,
          type: "PENALITE_APPLIQUEE",
        }),
      ]);
      return NextResponse.json({ ok: true, statut });
    }

    // Valider → effectuer le swap des ordres
    if (demande.statut !== "ACCEPTEE_MEMBRES") {
      return NextResponse.json({ error: "Les deux membres doivent d'abord accepter." }, { status: 400 });
    }

    // Vérifier une dernière fois que les tours ne sont pas distribués
    const versements = await prisma.versement.findMany({
      where: { id_cycle: cycleId },
      select: { numero_tour: true },
    });
    const toursDistribues = new Set(versements.map((v) => v.numero_tour));
    if (toursDistribues.has(demande.tour_demandeur) || toursDistribues.has(demande.tour_cible)) {
      return NextResponse.json({ error: "Un des tours a été distribué entre-temps. Échange impossible." }, { status: 400 });
    }

    // Récupérer les participants
    const [partDemandeur, partCible] = await Promise.all([
      prisma.cycleParticipant.findUnique({
        where: { id_cycle_id_membre_groupe: { id_cycle: cycleId, id_membre_groupe: demande.id_demandeur } },
        select: { id_cycle_participant: true },
      }),
      prisma.cycleParticipant.findUnique({
        where: { id_cycle_id_membre_groupe: { id_cycle: cycleId, id_membre_groupe: demande.id_cible } },
        select: { id_cycle_participant: true },
      }),
    ]);
    if (!partDemandeur || !partCible) {
      return NextResponse.json({ error: "Participants introuvables." }, { status: 400 });
    }

    // Swap atomique
    await prisma.$transaction([
      prisma.cycleParticipant.update({
        where: { id_cycle_participant: partDemandeur.id_cycle_participant },
        data: { ordre: demande.tour_cible },
      }),
      prisma.cycleParticipant.update({
        where: { id_cycle_participant: partCible.id_cycle_participant },
        data: { ordre: demande.tour_demandeur },
      }),
      prisma.demandeEchange.update({
        where: { id_demande: echangeId },
        data: { statut: "VALIDEE_ADMIN", date_reponse: new Date() },
      }),
    ]);

    // Notifier les deux membres
    await Promise.allSettled([
      notifyMembre({
        id_membre_groupe: demande.id_demandeur,
        message: `Échange de place validé ✓ : Vous passerez maintenant au tour ${demande.tour_cible}.`,
        type: "PAIEMENT_RECU",
      }),
      notifyMembre({
        id_membre_groupe: demande.id_cible,
        message: `Échange de place validé ✓ : Vous passerez maintenant au tour ${demande.tour_demandeur}.`,
        type: "PAIEMENT_RECU",
      }),
    ]);

    return NextResponse.json({ ok: true, statut: "VALIDEE_ADMIN" });
  }

  return NextResponse.json({ error: "Action non reconnue." }, { status: 400 });
}
