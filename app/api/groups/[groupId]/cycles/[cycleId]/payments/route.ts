import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createCyclePaymentSchema } from "@/lib/validations";
import { createNotification } from "@/lib/notifications";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

function computeCurrentTour(
  dateDebut: Date,
  dureeTour: number,
  paymentDate: Date,
  totalTours: number,
) {
  const diffMs = paymentDate.getTime() - dateDebut.getTime();
  if (diffMs < 0) return 1;

  const days = Math.floor(diffMs / ONE_DAY_MS);
  return Math.min(Math.floor(days / dureeTour) + 1, totalTours);
}

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

  const membership = await prisma.membreGroupe.findFirst({
    where: { id_user: authUser.id, id_groupe: groupId, role: "ADMIN", statut_adhesion: "ACTIF" },
    select: { id_membre_groupe: true },
  });

  if (!membership) {
    return NextResponse.json({ ok: false, error: "Admin only." }, { status: 403 });
  }

  const parsedBody = createCyclePaymentSchema.safeParse(await request.json().catch(() => null));
  if (!parsedBody.success) {
    return NextResponse.json({ ok: false, error: "Invalid input." }, { status: 400 });
  }

  const { id_membre_groupe, montant, date_paiement, numero_tour } = parsedBody.data;
  const datePaiement = date_paiement ? new Date(date_paiement) : new Date();

  if (Number.isNaN(datePaiement.getTime())) {
    return NextResponse.json({ ok: false, error: "Invalid payment date." }, { status: 400 });
  }

  const cycle = await prisma.cycleTontine.findFirst({
    where: { id_cycle: cycleId, id_groupe: groupId },
    select: {
      id_cycle: true,
      date_debut: true,
      duree_tour_de_gain: true,
      montant_cotisation: true,
      penalites_activees: true,
      mode_penalite: true,
      valeur_penalite: true,
      participants: { select: { id_membre_groupe: true } },
    },
  });

  if (!cycle) {
    return NextResponse.json({ ok: false, error: "Cycle not found." }, { status: 404 });
  }

  const participant = await prisma.cycleParticipant.findUnique({
    where: { id_cycle_id_membre_groupe: { id_cycle: cycleId, id_membre_groupe } },
    select: {
      id_cycle: true,
      membre_groupe: { select: { statut_adhesion: true } },
    },
  });

  if (!participant || participant.membre_groupe.statut_adhesion !== "ACTIF") {
    return NextResponse.json(
      { ok: false, error: "Member is not active in this cycle." },
      { status: 409 },
    );
  }

  try {
    const totalTours = cycle.participants.length;
    const numeroTour =
      numero_tour ??
      computeCurrentTour(cycle.date_debut, cycle.duree_tour_de_gain, datePaiement, totalTours);

    if (numeroTour > totalTours) {
      return NextResponse.json({ ok: false, error: "Invalid cycle round." }, { status: 400 });
    }

    const dateEcheance = addDays(cycle.date_debut, cycle.duree_tour_de_gain * numeroTour);
    const joursRetard = Math.max(
      0,
      Math.ceil((datePaiement.getTime() - dateEcheance.getTime()) / ONE_DAY_MS),
    );
    const valeurPenalite = cycle.valeur_penalite ? Number(cycle.valeur_penalite) : 0;
    const montantCotisation = Number(cycle.montant_cotisation);

    let montantPenalite = 0;
    if (cycle.penalites_activees && cycle.mode_penalite && valeurPenalite > 0 && joursRetard > 0) {
      if (cycle.mode_penalite === "FIXE") {
        montantPenalite = valeurPenalite;
      } else if (cycle.mode_penalite === "POURCENTAGE") {
        montantPenalite = roundCurrency((montantCotisation * valeurPenalite) / 100);
      } else {
        montantPenalite = roundCurrency(valeurPenalite * joursRetard);
      }
    }

    const payment = await prisma.$transaction(async (tx) => {
      const created = await tx.cotisations.create({
        data: {
          id_cycle: cycle.id_cycle,
          id_membre_groupe,
          date_debut: cycle.date_debut,
          date_de_paiement: datePaiement,
          numero_tour: numeroTour,
          date_echeance: dateEcheance,
          montant,
          penalite_appliquee: montantPenalite > 0,
          montant_penalite: montantPenalite > 0 ? montantPenalite : null,
        },
        select: {
          id_cotisation: true,
          id_membre_groupe: true,
          montant: true,
          date_de_paiement: true,
          numero_tour: true,
          date_echeance: true,
          penalite_appliquee: true,
          montant_penalite: true,
        },
      });

      if (montantPenalite > 0) {
        await tx.penalite.create({
          data: {
            id_cotisation: created.id_cotisation,
            id_membre_groupe,
            montant_base: valeurPenalite,
            motif: "Retard de paiement",
            taux_augmentation_heure: 0,
            seuil_heure_augmentation: 24,
            date_application: datePaiement,
            montant_final: montantPenalite,
            mode_penalite: cycle.mode_penalite,
            valeur_configuree: valeurPenalite,
            jours_retard: joursRetard,
            date_echeance: dateEcheance,
          },
        });
      }

      return created;
    });

    // Envoyer une notification au membre
    const targetMember = await prisma.membreGroupe.findUnique({
      where: { id_membre_groupe },
      select: { id_user: true, groupe: { select: { nom: true } } },
    });

    if (targetMember) {
      await createNotification({
        userId: targetMember.id_user,
        groupId,
        type: "PAIEMENT_RECU",
        message: `Votre versement de ${montant.toLocaleString("fr-FR")} pour le tour ${numeroTour} du cycle "${cycle.id_cycle}" (Groupe: ${targetMember.groupe.nom}) a été enregistré.`,
      });
      
      if (montantPenalite > 0) {
        await createNotification({
          userId: targetMember.id_user,
          groupId,
          type: "PENALITE_APPLIQUEE",
          message: `Une pénalité de ${montantPenalite.toLocaleString("fr-FR")} a été appliquée à votre versement du tour ${numeroTour} pour retard (${joursRetard} jours).`,
        });
      }
    }

    return NextResponse.json({ ok: true, payment }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ ok: false, error: "Internal server error." }, { status: 500 });
  }
}
