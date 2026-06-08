import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createCyclePaymentSchema } from "@/lib/validations";
import { createNotification } from "@/lib/notifications";
import { getCycleTurnSnapshot, getMemberRemainingForTurn } from "@/lib/cycle-turns";
import { majStatutMembre } from "@/lib/membre-statut";
import {
  caisseCycle,
  caissePenalitesCycle,
  recordMouvementFinancier,
} from "@/lib/financial-journal";

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
      nom_cycle: true,
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
    const snapshot = await getCycleTurnSnapshot(cycleId);
    if (snapshot.isCompleted || !snapshot.activeTour) {
      return NextResponse.json({ ok: false, error: "Ce cycle est déjà terminé." }, { status: 409 });
    }

    const totalTours = cycle.participants.length;
    const numeroTour =
      numero_tour ??
      computeCurrentTour(cycle.date_debut, cycle.duree_tour_de_gain, datePaiement, totalTours);

    if (numeroTour !== snapshot.activeTour) {
      return NextResponse.json(
        {
          ok: false,
          error: `Les cotisations concernent uniquement le tour actif (${snapshot.activeTour}).`,
        },
        { status: 409 },
      );
    }

    const remaining = await getMemberRemainingForTurn({
      cycleId,
      memberId: id_membre_groupe,
      numeroTour,
    });

    if (!remaining) {
      return NextResponse.json({ ok: false, error: "Cycle not found." }, { status: 404 });
    }

    const previousRealPayments = await prisma.cotisations.findMany({
      where: {
        id_cycle: cycle.id_cycle,
        id_membre_groupe,
        numero_tour,
        montant: { gt: 0 },
      },
      orderBy: { date_de_paiement: "asc" },
      select: { date_de_paiement: true },
    });

    const dateEcheance =
      snapshot.activeTourEnd ?? addDays(cycle.date_debut, cycle.duree_tour_de_gain * numeroTour);
    const dateReferencePenalite =
      remaining.remaining <= 0
        ? (previousRealPayments.find((payment) => payment.date_de_paiement > dateEcheance)
            ?.date_de_paiement ?? datePaiement)
        : datePaiement;
    const joursRetard = Math.max(
      0,
      Math.ceil((dateReferencePenalite.getTime() - dateEcheance.getTime()) / ONE_DAY_MS),
    );
    const valeurPenalite = cycle.valeur_penalite ? Number(cycle.valeur_penalite) : 0;
    const montantCotisation = Number(cycle.montant_cotisation);

    // Chercher un enregistrement de pénalité automatique en attente (montant = 0)
    const autoPenaltyRecord = await prisma.cotisations.findFirst({
      where: {
        id_cycle: cycle.id_cycle,
        id_membre_groupe,
        numero_tour: numeroTour,
        penalite_appliquee: true,
        montant_penalite: { not: null },
        montant: 0, // pénalité automatique non encore collectée
        penalite_collectee: false,
      },
      select: {
        id_cotisation: true,
        montant_penalite: true,
        penalites: { select: { id_penalite: true } },
      },
    });

    // Pénalité déjà enregistrée manuellement sur un vrai paiement ?
    const paidWithPenalty = await prisma.cotisations.findFirst({
      where: {
        id_cycle: cycle.id_cycle,
        id_membre_groupe,
        numero_tour: numeroTour,
        penalite_appliquee: true,
        montant_penalite: { not: null },
        penalite_collectee: true,
      },
      select: { id_cotisation: true },
    });

    // Calculer le montant de pénalité à appliquer sur CE paiement
    let montantPenaliteDue = 0;

    if (!paidWithPenalty && autoPenaltyRecord) {
      // La pénalité auto est en attente → on la collecte maintenant avec ce paiement
      montantPenaliteDue = Number(autoPenaltyRecord.montant_penalite ?? 0);
    } else if (!paidWithPenalty && !autoPenaltyRecord) {
      // Pas de pénalité auto → calculer si le paiement est en retard
      if (
        cycle.penalites_activees &&
        cycle.mode_penalite &&
        valeurPenalite > 0 &&
        joursRetard > 0
      ) {
        if (cycle.mode_penalite === "FIXE") {
          montantPenaliteDue = valeurPenalite;
        } else if (cycle.mode_penalite === "POURCENTAGE") {
          montantPenaliteDue = roundCurrency((montantCotisation * valeurPenalite) / 100);
        } else {
          montantPenaliteDue = roundCurrency(valeurPenalite * joursRetard);
        }
      }
    }

    const remainingCotisation = roundCurrency(remaining.remaining);
    const totalDu = roundCurrency(remainingCotisation + montantPenaliteDue);
    const montantRecu = roundCurrency(montant);

    if (totalDu <= 0) {
      return NextResponse.json(
        { ok: false, error: "Ce membre a déjà soldé sa cotisation et ses pénalités pour ce tour." },
        { status: 409 },
      );
    }

    if (montantRecu > totalDu) {
      return NextResponse.json(
        {
          ok: false,
          error: `Montant trop élevé. Total à payer : ${totalDu.toLocaleString("fr-FR")}.`,
        },
        { status: 400 },
      );
    }

    const montantCotisationPaye = roundCurrency(Math.min(montantRecu, remainingCotisation));
    const montantPenaliteCollecte = roundCurrency(montantRecu - montantCotisationPaye);

    if (
      montantPenaliteCollecte > 0 &&
      montantPenaliteDue > 0 &&
      montantPenaliteCollecte < montantPenaliteDue
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: `La pénalité doit être payée en totalité : ${montantPenaliteDue.toLocaleString("fr-FR")}.`,
        },
        { status: 400 },
      );
    }

    const payment = await prisma.$transaction(async (tx) => {
      // Enregistrer le vrai paiement (cotisation collectée)
      const created = await tx.cotisations.create({
        data: {
          id_cycle: cycle.id_cycle,
          id_membre_groupe,
          date_debut: cycle.date_debut,
          date_de_paiement: datePaiement,
          numero_tour: numeroTour,
          date_echeance: dateEcheance,
          montant: montantCotisationPaye,
          penalite_appliquee: montantPenaliteCollecte > 0,
          montant_penalite: montantPenaliteCollecte > 0 ? montantPenaliteCollecte : null,
          penalite_collectee: montantPenaliteCollecte > 0,
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
          penalite_collectee: true,
        },
      });

      if (montantPenaliteCollecte > 0) {
        if (autoPenaltyRecord) {
          // Supprimer l'enregistrement auto en attente (il est maintenant collecté via ce paiement)
          await tx.penalite.deleteMany({
            where: { id_cotisation: autoPenaltyRecord.id_cotisation },
          });
          await tx.cotisations.delete({
            where: { id_cotisation: autoPenaltyRecord.id_cotisation },
          });
        }
        // Créer la pénalité liée au vrai paiement
        await tx.penalite.create({
          data: {
            id_cotisation: created.id_cotisation,
            id_membre_groupe,
            montant_base: valeurPenalite,
            motif: autoPenaltyRecord
              ? "Pénalité de retard collectée (préalablement enregistrée automatiquement)"
              : "Retard de paiement",
            taux_augmentation_heure: 0,
            seuil_heure_augmentation: 24,
            date_application: datePaiement,
            montant_final: montantPenaliteCollecte,
            mode_penalite: cycle.mode_penalite,
            valeur_configuree: valeurPenalite,
            jours_retard: joursRetard,
            date_echeance: dateEcheance,
          },
        });
      }

      if (montantPenaliteDue > 0 && montantPenaliteCollecte === 0 && !autoPenaltyRecord) {
        const pending = await tx.cotisations.create({
          data: {
            id_cycle: cycle.id_cycle,
            id_membre_groupe,
            date_debut: cycle.date_debut,
            date_de_paiement: datePaiement,
            numero_tour: numeroTour,
            date_echeance: dateEcheance,
            montant: 0,
            penalite_appliquee: true,
            montant_penalite: montantPenaliteDue,
            penalite_collectee: false,
          },
          select: { id_cotisation: true },
        });

        await tx.penalite.create({
          data: {
            id_cotisation: pending.id_cotisation,
            id_membre_groupe,
            montant_base: valeurPenalite,
            motif: "Pénalité de retard en attente de paiement",
            taux_augmentation_heure: 0,
            seuil_heure_augmentation: 24,
            date_application: datePaiement,
            montant_final: montantPenaliteDue,
            mode_penalite: cycle.mode_penalite,
            valeur_configuree: valeurPenalite,
            jours_retard: joursRetard,
            date_echeance: dateEcheance,
          },
        });
      }

      await recordMouvementFinancier(tx, {
        groupId,
        caisse: caisseCycle(cycle.id_cycle, cycle.nom_cycle),
        type: "ENTREE",
        source: "COTISATION_CYCLE",
        montant: montantCotisationPaye,
        motif: `Cotisation du tour ${numeroTour} - ${cycle.nom_cycle}`,
        adminId: membership.id_membre_groupe,
        membreId: id_membre_groupe,
        referenceType: "cotisations",
        referenceId: created.id_cotisation,
        dateMouvement: created.date_de_paiement,
      });

      if (montantPenaliteCollecte > 0) {
        await recordMouvementFinancier(tx, {
          groupId,
          caisse: caissePenalitesCycle(cycle.id_cycle, cycle.nom_cycle),
          type: "ENTREE",
          source: "PENALITE_CYCLE",
          montant: montantPenaliteCollecte,
          motif: `Pénalité du tour ${numeroTour} - ${cycle.nom_cycle}`,
          adminId: membership.id_membre_groupe,
          membreId: id_membre_groupe,
          referenceType: "cotisations",
          referenceId: created.id_cotisation,
          dateMouvement: created.date_de_paiement,
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

      if (montantPenaliteCollecte > 0) {
        await createNotification({
          userId: targetMember.id_user,
          groupId,
          type: "PENALITE_APPLIQUEE",
          message: `Une pénalité de ${montantPenaliteCollecte.toLocaleString("fr-FR")} a été appliquée à votre versement du tour ${numeroTour} pour retard (${joursRetard} jours).`,
        });
      }
    }

    // Recalcul statut visuel du membre (en arrière-plan, non bloquant)
    majStatutMembre(id_membre_groupe).catch(() => null);

    return NextResponse.json({ ok: true, payment }, { status: 201 });
  } catch {
    return NextResponse.json({ ok: false, error: "Internal server error." }, { status: 500 });
  }
}
