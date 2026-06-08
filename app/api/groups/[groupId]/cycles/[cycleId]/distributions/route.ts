import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createVersementSchema } from "@/lib/validations";
import { createNotification } from "@/lib/notifications";
import {
  getBeneficiaireTour,
  versementExistePourTour,
  calculerPotTour,
  getVersementsCycle,
} from "@/lib/cycle-distributions";
import { getCycleTurnSnapshot } from "@/lib/cycle-turns";
import { caisseCycle, recordMouvementFinancier } from "@/lib/financial-journal";

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

// POST /api/groups/:groupId/cycles/:cycleId/distributions
// Enregistre un versement au bénéficiaire d'un tour (admin uniquement)
export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ groupId: string; cycleId: string }> },
) {
  const { groupId, cycleId } = await ctx.params;

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: "Missing Supabase environment variables." },
      { status: 500 },
    );
  }

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  const authUser = data.user;

  // Vérifier que l'utilisateur est admin du groupe
  const adminMembership = await prisma.membreGroupe.findFirst({
    where: { id_user: authUser.id, id_groupe: groupId, role: "ADMIN", statut_adhesion: "ACTIF" },
    select: { id_membre_groupe: true },
  });

  if (!adminMembership) {
    return NextResponse.json({ ok: false, error: "Admin only." }, { status: 403 });
  }

  // Valider le body
  const parsedBody = createVersementSchema.safeParse(await request.json().catch(() => null));
  if (!parsedBody.success) {
    return NextResponse.json({ ok: false, error: "Invalid input." }, { status: 400 });
  }

  const { numero_tour, montant_verse, mode_versement, reference_externe, date_versement } =
    parsedBody.data;

  const dateVersement = date_versement ? new Date(date_versement) : new Date();
  if (Number.isNaN(dateVersement.getTime())) {
    return NextResponse.json({ ok: false, error: "Invalid distribution date." }, { status: 400 });
  }

  // Vérifier que le cycle appartient au groupe
  const cycle = await prisma.cycleTontine.findFirst({
    where: { id_cycle: cycleId, id_groupe: groupId },
    select: {
      id_cycle: true,
      nom_cycle: true,
      montant_cotisation: true,
      participants: { select: { id_membre_groupe: true } },
      groupe: { select: { nom: true, devise: true } },
    },
  });

  if (!cycle) {
    return NextResponse.json({ ok: false, error: "Cycle not found." }, { status: 404 });
  }

  const totalTours = cycle.participants.length;
  if (numero_tour < 1 || numero_tour > totalTours) {
    return NextResponse.json(
      { ok: false, error: `Le numéro de tour doit être entre 1 et ${totalTours}.` },
      { status: 400 },
    );
  }

  const snapshot = await getCycleTurnSnapshot(cycleId);
  if (snapshot.isCompleted || !snapshot.activeTour) {
    return NextResponse.json({ ok: false, error: "Ce cycle est déjà terminé." }, { status: 409 });
  }

  if (numero_tour !== snapshot.activeTour) {
    return NextResponse.json(
      {
        ok: false,
        error: `Le versement du pot concerne uniquement le tour actif (${snapshot.activeTour}).`,
      },
      { status: 409 },
    );
  }

  if (!snapshot.allCurrentTurnMembersPaid || snapshot.remainingCurrentTurn > 0) {
    return NextResponse.json(
      {
        ok: false,
        error: "Impossible de solder ce tour : tous les membres doivent d'abord payer leur cotisation complète.",
      },
      { status: 409 },
    );
  }

  if (roundCurrency(montant_verse) !== roundCurrency(snapshot.expectedCurrentTurn)) {
    return NextResponse.json(
      {
        ok: false,
        error: `Le montant à verser doit être exactement ${snapshot.expectedCurrentTurn.toLocaleString("fr-FR")} ${cycle.groupe.devise}.`,
      },
      { status: 400 },
    );
  }

  if (roundCurrency(montant_verse) > roundCurrency(snapshot.availableCurrentTurn)) {
    return NextResponse.json(
      { ok: false, error: "Le montant ne peut pas dépasser la caisse disponible du tour." },
      { status: 400 },
    );
  }

  // Vérifier qu'un versement n'existe pas déjà pour ce tour
  const dejaVerse = await versementExistePourTour(cycleId, numero_tour);
  if (dejaVerse) {
    return NextResponse.json(
      { ok: false, error: `Un versement a déjà été enregistré pour le tour ${numero_tour}.` },
      { status: 409 },
    );
  }

  // Récupérer le bénéficiaire du tour
  const beneficiaireParticipant = await getBeneficiaireTour(cycleId, numero_tour);
  if (!beneficiaireParticipant) {
    return NextResponse.json(
      { ok: false, error: `Aucun bénéficiaire trouvé pour le tour ${numero_tour}.` },
      { status: 404 },
    );
  }

  const idBeneficiaire = beneficiaireParticipant.id_membre_groupe;

  try {
    const versement = await prisma.$transaction(async (tx) => {
      const created = await tx.versement.create({
        data: {
          id_cycle: cycleId,
          id_beneficiaire: idBeneficiaire,
          numero_tour,
          montant_verse,
          date_versement: dateVersement,
          mode_versement: mode_versement ?? null,
          reference_externe: reference_externe ?? null,
          id_admin_valideur: adminMembership.id_membre_groupe,
        },
        select: {
          id_versement: true,
          numero_tour: true,
          montant_verse: true,
          date_versement: true,
          mode_versement: true,
          reference_externe: true,
          beneficiaire: {
            select: { user: { select: { nom: true, prenom: true } } },
          },
        },
      });

      await recordMouvementFinancier(tx, {
        groupId,
        caisse: caisseCycle(cycleId, cycle.nom_cycle),
        type: "SORTIE",
        source: "VERSEMENT_BENEFICIAIRE",
        montant: montant_verse,
        motif: `Versement au bénéficiaire du tour ${numero_tour} - ${cycle.nom_cycle}`,
        adminId: adminMembership.id_membre_groupe,
        membreId: idBeneficiaire,
        referenceType: "versements",
        referenceId: created.id_versement,
        dateMouvement: created.date_versement,
      });

      return created;
    });

    // Calculer le pot du tour pour l'inclure dans la notification
    const pot = await calculerPotTour(cycleId, numero_tour);
    const nomBeneficiaire = `${beneficiaireParticipant.membre_groupe.user.prenom} ${beneficiaireParticipant.membre_groupe.user.nom}`;
    const devise = cycle.groupe.devise;

    // Notifier le bénéficiaire
    await createNotification({
      userId: beneficiaireParticipant.membre_groupe.id_user,
      groupId,
      type: "PAIEMENT_RECU",
      message: `🎉 Félicitations ${nomBeneficiaire} ! Vous avez reçu votre pot de ${montant_verse.toLocaleString("fr-FR")} ${devise} pour le tour ${numero_tour} du cycle "${cycle.nom_cycle}" (Groupe : ${cycle.groupe.nom}).`,
    });

    // Notifier tous les membres du groupe
    const tousLesMembres = await prisma.membreGroupe.findMany({
      where: {
        id_groupe: groupId,
        statut_adhesion: "ACTIF",
        id_membre_groupe: { not: idBeneficiaire },
      },
      select: { id_user: true },
    });

    await Promise.all(
      tousLesMembres.map((m) =>
        createNotification({
          userId: m.id_user,
          groupId,
          type: "PAIEMENT_RECU",
          message: `✅ Le tour ${numero_tour} du cycle "${cycle.nom_cycle}" a été soldé. ${nomBeneficiaire} a reçu son pot de ${montant_verse.toLocaleString("fr-FR")} ${devise}.`,
        }),
      ),
    );

    return NextResponse.json(
      {
        ok: true,
        versement,
        pot_tour: pot,
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json({ ok: false, error: "Internal server error." }, { status: 500 });
  }
}

// GET /api/groups/:groupId/cycles/:cycleId/distributions
// Récupère l'historique des versements d'un cycle
export async function GET(
  _request: NextRequest,
  ctx: { params: Promise<{ groupId: string; cycleId: string }> },
) {
  const { groupId, cycleId } = await ctx.params;

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: "Missing Supabase environment variables." },
      { status: 500 },
    );
  }

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  // Vérifier que l'utilisateur est membre actif du groupe
  const membership = await prisma.membreGroupe.findFirst({
    where: { id_user: data.user.id, id_groupe: groupId, statut_adhesion: "ACTIF" },
    select: { id_membre_groupe: true },
  });

  if (!membership) {
    return NextResponse.json({ ok: false, error: "Forbidden." }, { status: 403 });
  }

  // Vérifier que le cycle appartient au groupe
  const cycle = await prisma.cycleTontine.findFirst({
    where: { id_cycle: cycleId, id_groupe: groupId },
    select: { id_cycle: true },
  });

  if (!cycle) {
    return NextResponse.json({ ok: false, error: "Cycle not found." }, { status: 404 });
  }

  const versements = await getVersementsCycle(cycleId);

  return NextResponse.json({ ok: true, versements });
}
