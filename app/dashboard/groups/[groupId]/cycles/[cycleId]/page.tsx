import Link from "next/link";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { applyAutomaticOverduePenalties } from "@/lib/cycle-penalties";
import { getMemberDebtSummary, getCycleOutstandingDebtTotal } from "@/lib/cycle-member-debts";
import { Button } from "@/components/ui/button";
import { CyclePaymentForm } from "@/components/groups/cycle-payment-form";
import { CycleMemberPaymentPanel } from "@/components/groups/cycle-member-payment-panel";
import { CloseCycleButton } from "@/components/groups/close-cycle-button";
import { EditCycleForm } from "@/components/groups/edit-cycle-form";
import { DistributionForm } from "@/components/groups/distribution-form";
import { DistributionHistory } from "@/components/groups/distribution-history";
import { CycleDetailActions } from "@/components/groups/cycle-detail-actions";
import { CycleParticipantsTable } from "@/components/groups/cycle-participants-table";
import { CyclePaymentsHistory } from "@/components/groups/cycle-payments-history";
import { DeleteCycleButton } from "@/components/groups/delete-cycle-button";
import { PenaltyWithdrawalForm } from "@/components/groups/penalty-withdrawal-form";
import { RelancerCycleSheet } from "@/components/groups/relancer-cycle-sheet";
import { calculerPotTour, getVersementsCycle, getTresorerieCycle } from "@/lib/cycle-distributions";
import { OrdrePassage } from "@/components/groups/ordre-passage";
import type { ParticipantOrdre } from "@/components/groups/ordre-passage";
import { AdminOrdreEditor } from "@/components/groups/admin-ordre-editor";
import type { ParticipantEditable } from "@/components/groups/admin-ordre-editor";
import { EchangesAdmin } from "@/components/groups/echanges-admin";
import type { EchangeAdmin } from "@/components/groups/echanges-admin";

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

type PaymentItem = {
  id_cotisation: string;
  id_membre_groupe: string;
  montant: number;
  date_de_paiement: Date;
  numero_tour: number | null;
  date_echeance: Date | null;
  penalite_appliquee: boolean;
  montant_penalite: number | null;
  penalite_collectee: boolean;
};

export const dynamic = "force-dynamic";

export default async function GroupCycleDetailPage({
  params,
}: {
  params: Promise<{ groupId: string; cycleId: string }>;
}) {
  const { groupId, cycleId } = await params;

  const supabase = await createSupabaseServerClient();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;

  if (!user) {
    redirect(
      `/auth/login?next=${encodeURIComponent(`/dashboard/groups/${groupId}/cycles/${cycleId}`)}`,
    );
  }

  const membership = await prisma.membreGroupe.findFirst({
    where: { id_user: user.id, id_groupe: groupId, statut_adhesion: "ACTIF" },
    select: { id_membre_groupe: true, role: true, groupe: { select: { devise: true } }, user: { select: { telephone: true } } },
  });

  if (!membership) {
    redirect("/dashboard");
  }

  const devise = membership.groupe.devise;

  const cycle = await prisma.cycleTontine.findFirst({
    where: { id_cycle: cycleId, id_groupe: groupId },
    select: {
      id_cycle: true,
      nom_cycle: true,
      date_debut: true,
      date_fin: true,
      duree_tour_de_gain: true,
      montant_cotisation: true,
      penalites_activees: true,
      mode_penalite: true,
      valeur_penalite: true,
      participants: {
        orderBy: { ordre: "asc" },
        select: {
          ordre: true,
          id_membre_groupe: true,
          membre_groupe: {
            select: {
              id_membre_groupe: true,
              statut_adhesion: true,
              user: {
                select: {
                  id_user: true,
                  nom: true,
                  prenom: true,
                  email: true,
                  telephone: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!cycle) {
    redirect(`/dashboard/groups/${groupId}/cycles`);
  }

  if (membership.role !== "ADMIN") {
    const isParticipant = cycle.participants.some(
      (participant) => participant.id_membre_groupe === membership.id_membre_groupe,
    );

    if (!isParticipant) {
      redirect(`/dashboard/groups/${groupId}/cycles`);
    }
  }

  await applyAutomaticOverduePenalties(cycleId);

  const payments = await prisma.cotisations.findMany({
    where:
      membership.role === "ADMIN"
        ? { id_cycle: cycleId }
        : { id_cycle: cycleId, id_membre_groupe: membership.id_membre_groupe },
    orderBy: { date_de_paiement: "desc" },
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

  const paymentsByMember = new Map<string, PaymentItem[]>();
  payments.forEach((payment) => {
    const entry = paymentsByMember.get(payment.id_membre_groupe) ?? [];
    entry.push({
      id_cotisation: payment.id_cotisation,
      id_membre_groupe: payment.id_membre_groupe,
      montant: Number(payment.montant),
      date_de_paiement: payment.date_de_paiement,
      numero_tour: payment.numero_tour,
      date_echeance: payment.date_echeance,
      penalite_appliquee: payment.penalite_appliquee,
      montant_penalite: payment.montant_penalite ? Number(payment.montant_penalite) : null,
      penalite_collectee: payment.penalite_collectee,
    });
    paymentsByMember.set(payment.id_membre_groupe, entry);
  });

  const [versementsCycle, tresorerie] =
    membership.role === "ADMIN"
      ? await Promise.all([getVersementsCycle(cycleId), getTresorerieCycle(cycleId)])
      : [[], await getTresorerieCycle(cycleId)];

  const montantFixe = Number(cycle.montant_cotisation);
  const now = new Date();
  const totalTours = cycle.participants.length;
  const activeTour = tresorerie.tourActif ?? null;
  const currentIndex = activeTour ? activeTour - 1 : totalTours;
  const cycleTermine = tresorerie.cycleTermine;
  const currentParticipant = activeTour
    ? (cycle.participants.find((participant) => participant.ordre === activeTour) ?? null)
    : null;
  const currentName = currentParticipant
    ? `${currentParticipant.membre_groupe.user.prenom} ${currentParticipant.membre_groupe.user.nom}`
    : "Cycle terminé";
  const tourEnd = tresorerie.finTourActif ?? cycle.date_fin;

  const defaultTour = activeTour ?? totalTours;

  const memberDebtSummaries =
    membership.role === "ADMIN"
      ? await Promise.all(
          cycle.participants.map(async (participant) => ({
            id_membre_groupe: participant.id_membre_groupe,
            summary: await getMemberDebtSummary(cycleId, participant.id_membre_groupe, now),
          })),
        )
      : [];

  const outstandingDebtTotal =
    membership.role === "ADMIN" ? await getCycleOutstandingDebtTotal(cycleId) : 0;

  const myDebtSummary = await getMemberDebtSummary(
    cycleId,
    membership.id_membre_groupe,
    now,
  );

  const participantsForForm = cycle.participants.map((participant) => {
    const debt = memberDebtSummaries.find(
      (item) => item.id_membre_groupe === participant.id_membre_groupe,
    )?.summary;

    return {
      id_membre_groupe: participant.id_membre_groupe,
      nom: participant.membre_groupe.user.nom,
      prenom: participant.membre_groupe.user.prenom,
      totalDue: debt?.totalDue ?? 0,
      cotisationDue: debt?.cotisationDue ?? 0,
      penaltyDue: debt?.penaltyDue ?? 0,
      debtSlices: (debt?.slices ?? []).map((slice) => ({
        type: slice.type,
        numeroTour: slice.numeroTour,
        remaining: slice.remaining,
      })),
    };
  });

  const toursForForm = activeTour
    ? [
        {
          numero: activeTour,
          beneficiaire: currentName,
          dateEcheance: tourEnd.toLocaleDateString("fr-FR"),
        },
      ]
    : [];
  const participantsStats = cycle.participants.map((participant) => {
    const member = participant.membre_groupe;
    const paymentsList = paymentsByMember.get(member.id_membre_groupe) ?? [];

    // Calcul par tour pour une précision maximale
    const tourDetails = Array.from({ length: totalTours }, (_, i) => {
      const tourNum = i + 1;
      const dueDate =
        tourNum === activeTour && tresorerie.finTourActif
          ? tresorerie.finTourActif
          : addDays(cycle.date_debut, cycle.duree_tour_de_gain * tourNum);
      const tourPayments = paymentsList.filter((p) => p.numero_tour === tourNum);
      const paidAmount = tourPayments.reduce((acc, p) => acc + p.montant, 0);
      const penaltiesAmount = tourPayments.reduce((acc, p) => acc + (p.montant_penalite || 0), 0);

      const isOverdue = tourNum === activeTour && now > dueDate && paidAmount < montantFixe;
      const daysLate = isOverdue
        ? Math.ceil((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      return {
        tourNum,
        dueDate,
        paidAmount,
        penaltiesAmount,
        isOverdue,
        daysLate,
        isComplete: paidAmount >= montantFixe,
      };
    });

    const totalPaid = tourDetails.reduce((acc, t) => acc + t.paidAmount, 0);
    const totalPenalties = tourDetails.reduce((acc, t) => acc + t.penaltiesAmount, 0);
    const totalDaysLate = tourDetails.reduce((acc, t) => acc + t.daysLate, 0);
    const hasActivePenalty = tourDetails.some((t) => t.penaltiesAmount > 0);
    const isLate = tourDetails.some((t) => t.isOverdue);
    const isIncomplete = tourDetails.some((t) => t.tourNum <= currentIndex + 1 && !t.isComplete);

    return {
      participant,
      totalPaid,
      totalPenalties,
      totalDaysLate,
      hasActivePenalty,
      isLate,
      isIncomplete,
      tourDetails,
    };
  });

  // Calculer le pot collecté par tour pour le formulaire de distribution
  const potsParTour =
    membership.role === "ADMIN"
      ? await Promise.all(
          cycle.participants.map((p) =>
            calculerPotTour(cycleId, p.ordre).then((pot) => ({ numero: p.ordre, pot })),
          ),
        )
      : [];

  const versementsParTour = new Map(versementsCycle.map((v) => [v.numero_tour, v]));

  const toursForDistribution = cycle.participants
    .filter((participant) => participant.ordre === activeTour)
    .map((participant) => {
      const potInfo = potsParTour.find((p) => p.numero === participant.ordre);
      return {
        numero: participant.ordre,
        beneficiaire: `${participant.membre_groupe.user.prenom} ${participant.membre_groupe.user.nom}`,
        idBeneficiaire: participant.id_membre_groupe,
        potCollecte: potInfo?.pot.potTotal ?? 0,
        potAttendu: tresorerie.totalAttendu,
        soldeDisponible: tresorerie.soldeDisponible,
        dejaVerse: versementsParTour.has(participant.ordre),
        canDistribute: tresorerie.canDistribute && !versementsParTour.has(participant.ordre),
        isPastDue: tresorerie.isPastDue,
        dateEcheance: tourEnd.toLocaleDateString("fr-FR"),
      };
    });

  const toursForHistory = cycle.participants.map((participant) => {
    const potInfo = potsParTour.find((p) => p.numero === participant.ordre);
    return {
      numero: participant.ordre,
      beneficiaire: `${participant.membre_groupe.user.prenom} ${participant.membre_groupe.user.nom}`,
      potCollecte: potInfo?.pot.potTotal ?? 0,
    };
  });

  // ─── Ordre de passage ───
  const membresAvecVersement = new Set(versementsCycle.map((v) => v.beneficiaire.id_membre_groupe));

  const participantsOrdre: ParticipantOrdre[] = cycle.participants
    .sort((a, b) => a.ordre - b.ordre)
    .map((p) => ({
      id_membre_groupe: p.id_membre_groupe,
      ordre: p.ordre,
      nom: `${p.membre_groupe.user.prenom} ${p.membre_groupe.user.nom}`,
      potRecu: membresAvecVersement.has(p.id_membre_groupe),
      estMoi: p.id_membre_groupe === membership.id_membre_groupe,
    }));

  const participantsEditables: ParticipantEditable[] = cycle.participants
    .sort((a, b) => a.ordre - b.ordre)
    .map((p) => ({
      id_membre_groupe: p.id_membre_groupe,
      ordre: p.ordre,
      nom: `${p.membre_groupe.user.prenom} ${p.membre_groupe.user.nom}`,
      verrouille: membresAvecVersement.has(p.id_membre_groupe),
    }));

  // ─── Échanges (admin) ───
  const echangesDB =
    membership.role === "ADMIN"
      ? await prisma.demandeEchange.findMany({
          where: { id_cycle: cycleId },
          orderBy: { date_demande: "desc" },
          select: {
            id_demande: true,
            statut: true,
            tour_demandeur: true,
            tour_cible: true,
            note: true,
            date_demande: true,
            demandeur: {
              select: { id_membre_groupe: true, user: { select: { nom: true, prenom: true } } },
            },
            cible: {
              select: { id_membre_groupe: true, user: { select: { nom: true, prenom: true } } },
            },
          },
        })
      : [];

  const echangesAdmin: EchangeAdmin[] = echangesDB.map((e) => ({
    ...e,
    date_demande: e.date_demande.toISOString(),
  }));

  const globalStats = {
    totalPenalties: participantsStats.reduce((acc, p) => acc + p.totalPenalties, 0),
    totalLateMembers: participantsStats.filter((p) => p.isLate).length,
    totalDaysLate: participantsStats.reduce((acc, p) => acc + p.totalDaysLate, 0),
    totalExpected: montantFixe * totalTours * totalTours, // Simplification: chaque membre paie à chaque tour
    totalCollected: participantsStats.reduce((acc, p) => acc + p.totalPaid, 0),
  };

  const participantsForTable = participantsStats
    .filter(({ participant }) => {
      if (membership.role === "ADMIN") return true;
      return participant.membre_groupe.id_membre_groupe === membership.id_membre_groupe;
    })
    .map(
      ({
        participant,
        totalPaid,
        totalPenalties,
        totalDaysLate,
        hasActivePenalty,
        isLate,
        isIncomplete,
        tourDetails,
      }) => {
        const member = participant.membre_groupe;

        return {
          id: member.id_membre_groupe,
          name: `${member.user.prenom} ${member.user.nom}`,
          email: member.user.email,
          totalPaid,
          totalPenalties,
          totalDaysLate,
          hasActivePenalty,
          isLate,
          isIncomplete,
          montantInitial: montantFixe * totalTours,
          tourDetails: tourDetails.map((tour) => ({
            ...tour,
            dueDate: tour.dueDate.toISOString(),
          })),
        };
      },
    );

  const overviewContent = (
    <div className="space-y-4">
      {membership.role === "ADMIN" ? (
        <>
          {!cycleTermine && tresorerie.canDistribute ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
              <p className="text-sm font-semibold">⏰ Échéance du tour {activeTour} dépassée</p>
              <p className="mt-1 text-xs">
                C&apos;est le moment de verser le pot à {currentName}. Montant disponible en caisse
                :{" "}
                <strong>
                  {tresorerie.soldeDisponible.toLocaleString("fr-FR")} {membership.groupe.devise}
                </strong>
                {tresorerie.resteACollecter > 0 ? (
                  <>
                    {" "}
                    (pot incomplet : {tresorerie.resteACollecter.toLocaleString("fr-FR")}{" "}
                    {membership.groupe.devise} de cotisations manquantes — les retardataires
                    régleront leurs arriérés au prochain tour).
                  </>
                ) : null}
              </p>
            </div>
          ) : null}

          {cycleTermine && outstandingDebtTotal > 0 ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-900">
              <p className="text-sm font-semibold">Dettes en cours</p>
              <p className="mt-1 text-xs">
                Tous les pots ont été versés, mais des arriérés et pénalités restent à collecter (
                {outstandingDebtTotal.toLocaleString("fr-FR")} {membership.groupe.devise}). Le cycle
                reste ouvert pour le règlement.
              </p>
            </div>
          ) : null}

          {cycleTermine && outstandingDebtTotal <= 0 ? (
            <div className="rounded-xl border border-brand-200 bg-brand-50 p-4 text-brand-900">
              <p className="text-sm font-semibold">🎉 Cycle terminé avec succès</p>
              <p className="mt-1 text-xs">
                Tous les tours ont été soldés et les pots distribués. Vous pouvez relancer un
                nouveau cycle dès maintenant ou à tout moment depuis la liste des cycles.
              </p>
              <RelancerCycleSheet groupId={groupId} />
            </div>
          ) : null}

          {!cycleTermine && tresorerie.resteACollecter === 0 && tresorerie.totalCollecte > 0 && !tresorerie.isPastDue ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
              <p className="text-sm font-semibold">Tour {activeTour} — cotisations complètes</p>
              <p className="mt-1 text-xs">
                Tous les membres ont cotisé. Le pot pourra être versé à {currentName} après
                l&apos;échéance du {tourEnd.toLocaleDateString("fr-FR")}.
              </p>
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950">
              <p className="text-xs font-medium uppercase text-gray-500">Total attendu du tour</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">
                {tresorerie.totalAttendu.toLocaleString("fr-FR")} {membership.groupe.devise}
              </p>
              <p className="text-xs text-gray-400">
                {totalTours} membres x {montantFixe.toLocaleString("fr-FR")}
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950">
              <p className="text-xs font-medium uppercase text-gray-500">Collecté du tour</p>
              <p className="mt-1 text-2xl font-bold text-emerald-600">
                {tresorerie.totalCollecte.toLocaleString("fr-FR")} {membership.groupe.devise}
              </p>
              <p className="text-xs text-gray-400">Cotisations reçues uniquement</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950">
              <p className="text-xs font-medium uppercase text-gray-500">Reste à collecter</p>
              <p className="mt-1 text-2xl font-bold text-amber-600">
                {tresorerie.resteACollecter.toLocaleString("fr-FR")} {membership.groupe.devise}
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950">
              <p className="text-xs font-medium uppercase text-gray-500">Distribué du tour</p>
              <p className="mt-1 text-2xl font-bold text-brand-600">
                {tresorerie.totalDistribue.toLocaleString("fr-FR")} {membership.groupe.devise}
              </p>
              <p className="text-xs text-gray-400">Pot versé au bénéficiaire</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950">
              <p className="text-xs font-medium uppercase text-gray-500">Solde du tour</p>
              <p
                className={`mt-1 text-2xl font-bold ${
                  tresorerie.soldeDisponible >= 0 ? "text-emerald-600" : "text-rose-600"
                }`}
              >
                {tresorerie.soldeDisponible.toLocaleString("fr-FR")} {membership.groupe.devise}
              </p>
              <p className="text-xs text-gray-400">Après versement du pot, attendu à 0</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950">
              <p className="text-xs font-medium uppercase text-gray-500">Membres en retard</p>
              <p className="mt-1 text-2xl font-bold text-rose-600">
                {globalStats.totalLateMembers}
              </p>
              <p className="text-xs text-gray-400">{globalStats.totalDaysLate} jours cumulés</p>
            </div>
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <p className="text-xs font-medium uppercase text-amber-700">
                Caisse pénalités (tour)
              </p>
              <p className="mt-1 text-2xl font-bold text-amber-700">
                {tresorerie.caissePenalitesTour.toLocaleString("fr-FR")} {membership.groupe.devise}
              </p>
              {tresorerie.penalitesEnAttenteTour > 0 ? (
                <p className="text-xs text-rose-600">
                  + {tresorerie.penalitesEnAttenteTour.toLocaleString("fr-FR")} en attente
                </p>
              ) : (
                <p className="text-xs text-amber-700/70">Argent effectivement collecté</p>
              )}
            </div>
            <div className="rounded-lg border border-amber-200 bg-white p-4">
              <p className="text-xs font-medium uppercase text-amber-700">
                Caisse pénalités (cycle)
              </p>
              <p className="mt-1 text-2xl font-bold text-amber-700">
                {tresorerie.caissePenalitesCycle.toLocaleString("fr-FR")} {membership.groupe.devise}
              </p>
              {tresorerie.penalitesEnAttenteCycle > 0 ? (
                <p className="text-xs text-rose-600">
                  + {tresorerie.penalitesEnAttenteCycle.toLocaleString("fr-FR")} en attente de
                  collecte
                </p>
              ) : (
                <p className="text-xs text-amber-700/70">Disponible après retraits</p>
              )}
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950">
              <p className="text-xs font-medium uppercase text-gray-500">Progression</p>
              <p className="mt-1 text-2xl font-bold text-brand-600">
                {Math.round((tresorerie.toursVerses / Math.max(totalTours, 1)) * 100)}%
              </p>
              <p className="text-xs text-gray-400">
                {tresorerie.toursVerses} / {totalTours} tours soldés
              </p>
            </div>
          </div>

          {/* Le formulaire de retrait est désormais dans l'onglet "Caisse pénalités" */}
        </>
      ) : (
        <div className="space-y-4">
          {(myDebtSummary?.totalDue ?? 0) > 0 ? (
            <CycleMemberPaymentPanel
              groupId={groupId}
              cycleId={cycleId}
              totalDue={myDebtSummary?.totalDue ?? 0}
              cotisationDue={myDebtSummary?.cotisationDue ?? 0}
              penaltyDue={myDebtSummary?.penaltyDue ?? 0}
              devise={devise}
              defaultTelephone={membership.user.telephone}
            />
          ) : (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-sm font-semibold text-emerald-800">✅ Vous êtes à jour</p>
              <p className="mt-1 text-xs text-emerald-700">
                Aucune cotisation ni pénalité en attente pour ce cycle.
              </p>
            </div>
          )}
        </div>
      )}

      <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase text-gray-500">Tour actuel</p>
            <p className="text-lg font-semibold text-brand-600">{currentName}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {cycleTermine
                ? outstandingDebtTotal > 0
                  ? "Tous les pots ont été versés. Des arriérés restent à régler."
                  : "Tous les tours sont terminés et les dettes sont soldées."
                : `C'est au tour de ${currentName} de recevoir le pot collecté.`}
            </p>
          </div>
          {!cycleTermine ? (
            <div className="text-right">
              <p className="text-xs text-gray-500">Échéance</p>
              <p className="text-sm font-bold text-gray-900 dark:text-white">
                {tourEnd.toLocaleDateString("fr-FR")}
              </p>
            </div>
          ) : null}
        </div>
        <div className="mt-3">
          <div className="mb-1 flex items-center justify-between text-xs text-gray-500">
            <span>Progression du cycle</span>
            <span>
              {tresorerie.toursVerses} / {totalTours} tours soldés
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{
                width: `${Math.min((tresorerie.toursVerses / Math.max(totalTours, 1)) * 100, 100)}%`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );

  const editContent =
    membership.role === "ADMIN" ? (
      <div className="space-y-8">
        <EditCycleForm
          groupId={groupId}
          cycleId={cycleId}
          canManage={true}
          initialCycle={{
            nom_cycle: cycle.nom_cycle,
            date_debut: cycle.date_debut.toISOString(),
            date_fin: cycle.date_fin.toISOString(),
            duree_tour_de_gain: cycle.duree_tour_de_gain,
            montant_cotisation: Number(cycle.montant_cotisation),
            penalites_activees: cycle.penalites_activees,
            mode_penalite: cycle.mode_penalite,
            valeur_penalite: cycle.valeur_penalite ? Number(cycle.valeur_penalite) : null,
          }}
          initialOrder={cycle.participants.map((participant) => participant.id_membre_groupe)}
        />

        {/* ─── Réorganisation de l'ordre de passage ─── */}
        {!cycleTermine && (
          <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
            <h3 className="mb-1 text-base font-semibold text-gray-900 dark:text-white">
              Ordre de passage
            </h3>
            <p className="mb-4 text-sm text-gray-500">
              Modifiez l&apos;ordre des bénéficiaires. Les tours déjà distribués sont verrouillés.
            </p>
            <AdminOrdreEditor
              groupId={groupId}
              cycleId={cycleId}
              participants={participantsEditables}
            />
          </div>
        )}

        {/* ─── Demandes d'échange ─── */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <h3 className="mb-1 text-base font-semibold text-gray-900 dark:text-white">
            Demandes d&apos;échange de place
          </h3>
          <p className="mb-4 text-sm text-gray-500">
            Validez ou refusez les échanges de tour acceptés par les deux membres.
          </p>
          <EchangesAdmin groupId={groupId} cycleId={cycleId} echanges={echangesAdmin} />
        </div>
      </div>
    ) : null;

  const distributionContent =
    membership.role === "ADMIN" ? (
      <DistributionForm
        groupId={groupId}
        cycleId={cycleId}
        tours={toursForDistribution}
        defaultTour={defaultTour}
        devise={membership.groupe.devise}
      />
    ) : null;

  const paymentContent =
    membership.role === "ADMIN" ? (
      <CyclePaymentForm
        groupId={groupId}
        cycleId={cycleId}
        participants={participantsForForm}
        tours={toursForForm}
        defaultTour={defaultTour}
      />
    ) : null;

  // Panneau admin : toutes les cotisations de tous les membres avec dates
  const allCotisationsContent =
    membership.role === "ADMIN" ? (
      <CyclePaymentsHistory
        payments={payments
          .filter((p) => p.numero_tour !== null)
          .sort((a, b) => {
            if ((a.numero_tour ?? 0) !== (b.numero_tour ?? 0)) {
              return (a.numero_tour ?? 0) - (b.numero_tour ?? 0);
            }
            return b.date_de_paiement.getTime() - a.date_de_paiement.getTime();
          })
          .map((payment) => {
            const participant = cycle.participants.find(
              (par) => par.id_membre_groupe === payment.id_membre_groupe,
            );
            const memberName = participant
              ? `${participant.membre_groupe.user.prenom} ${participant.membre_groupe.user.nom}`
              : payment.id_membre_groupe.slice(0, 8);

            return {
              id_cotisation: payment.id_cotisation,
              memberName,
              numero_tour: payment.numero_tour,
              date_de_paiement: payment.date_de_paiement.toISOString(),
              montant: Number(payment.montant),
              penalite_appliquee: payment.penalite_appliquee,
              montant_penalite: payment.montant_penalite ? Number(payment.montant_penalite) : null,
              penalite_collectee: payment.penalite_collectee,
            };
          })}
        devise={devise}
        historyScope={`cycles:${cycleId}:cotisations-admin`}
        historyTargetId={cycleId}
        showMember
        description="Toutes les cotisations du cycle, par membre et par tour, avec les dates de versement."
        emptyLabel="Aucune cotisation visible pour ce cycle."
      />
    ) : null;

  const historyContent =
    membership.role === "ADMIN" ? (
      <DistributionHistory
        versements={versementsCycle.map((v) => ({
          ...v,
          montant_verse: Number(v.montant_verse),
          date_versement: v.date_versement.toISOString(),
        }))}
        tours={toursForHistory}
        totalTours={totalTours}
        devise={membership.groupe.devise}
        historyScope={`cycles:${cycleId}:distributions`}
        historyTargetId={cycleId}
      />
    ) : null;

  // Paiements du membre connecté avec types convertis (Decimal → number déjà fait dans paymentsByMember)
  const myMemberPayments = paymentsByMember.get(membership.id_membre_groupe) ?? [];

  const myPaymentsContent = (
    <div className="space-y-4">
      {membership.role !== "ADMIN" ? (
        <CycleMemberPaymentPanel
          groupId={groupId}
          cycleId={cycleId}
          totalDue={myDebtSummary?.totalDue ?? 0}
          cotisationDue={myDebtSummary?.cotisationDue ?? 0}
          penaltyDue={myDebtSummary?.penaltyDue ?? 0}
          devise={devise}
          defaultTelephone={membership.user.telephone}
        />
      ) : null}
      <CyclePaymentsHistory
      payments={myMemberPayments.map((payment) => ({
        id_cotisation: payment.id_cotisation,
        numero_tour: payment.numero_tour,
        date_de_paiement: payment.date_de_paiement.toISOString(),
        montant: payment.montant,
        penalite_appliquee: payment.penalite_appliquee,
        montant_penalite: payment.montant_penalite,
        penalite_collectee: payment.penalite_collectee,
      }))}
      devise={devise}
      historyScope={`cycles:${cycleId}:mes-paiements`}
      historyTargetId={cycleId}
      description="Vos cotisations enregistrées dans ce cycle, avec les dates exactes de paiement."
      emptyLabel="Aucune cotisation visible pour vous dans ce cycle."
      showSummary
    />
    </div>
  );

  const memberPayContent =
    (myDebtSummary?.totalDue ?? 0) > 0 ? (
      <CycleMemberPaymentPanel
        groupId={groupId}
        cycleId={cycleId}
        totalDue={myDebtSummary?.totalDue ?? 0}
        cotisationDue={myDebtSummary?.cotisationDue ?? 0}
        penaltyDue={myDebtSummary?.penaltyDue ?? 0}
        devise={devise}
        defaultTelephone={membership.user.telephone}
      />
    ) : null;

  const memberDefaultPanel =
    (myDebtSummary?.totalDue ?? 0) > 0 ? ("memberPay" as const) : ("overview" as const);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">{cycle.nom_cycle}</h1>
          <p className="text-sm text-muted-foreground">
            Du {cycle.date_debut.toLocaleDateString("fr-FR")} au{" "}
            {cycle.date_fin.toLocaleDateString("fr-FR")}
          </p>
        </div>
      </div>

      <CycleDetailActions
        isAdmin={membership.role === "ADMIN"}
        overview={overviewContent}
        memberPay={memberPayContent}
        defaultPanel={memberDefaultPanel}
        edit={editContent}
        payment={paymentContent}
        distribution={distributionContent}
        history={historyContent}
        allCotisations={allCotisationsContent}
        participants={
          <CycleParticipantsTable participants={participantsForTable} devise={devise} />
        }
        myPayments={myPaymentsContent}
        ordrePassage={
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Ordre de passage des bénéficiaires dans ce cycle.{" "}
              {!cycleTermine &&
                membership.role === "MEMBRE" &&
                "Vous pouvez demander un échange de place avec un autre membre."}
            </p>
            <OrdrePassage
              groupId={groupId}
              cycleId={cycleId}
              participants={participantsOrdre}
              tourActuel={activeTour ?? totalTours + 1}
              monId={membership.id_membre_groupe}
              isAdmin={membership.role === "ADMIN"}
              cycleTermine={cycleTermine}
            />
          </div>
        }
        caissePenalites={
          membership.role === "ADMIN" ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <p className="text-xs text-amber-600 font-medium mb-1">Caisse pénalités (tour actuel)</p>
                  <p className="text-xl font-bold text-amber-700">
                    {tresorerie.caissePenalitesTour.toLocaleString("fr-FR")} {devise}
                  </p>
                </div>
                <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
                  <p className="text-xs text-orange-600 font-medium mb-1">Caisse pénalités (cycle entier)</p>
                  <p className="text-xl font-bold text-orange-700">
                    {tresorerie.caissePenalitesCycle.toLocaleString("fr-FR")} {devise}
                  </p>
                </div>
              </div>
              {tresorerie.caissePenalitesTour > 0 || tresorerie.caissePenalitesCycle > 0 ? (
                <PenaltyWithdrawalForm
                  groupId={groupId}
                  cycleId={cycleId}
                  activeTour={activeTour}
                  devise={devise}
                  caisseTour={tresorerie.caissePenalitesTour}
                  caisseCycle={tresorerie.caissePenalitesCycle}
                />
              ) : (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-center">
                  <p className="text-sm text-gray-500">Aucune pénalité collectée pour le moment.</p>
                </div>
              )}
            </div>
          ) : null
        }
        closeAction={
          !cycleTermine ? <CloseCycleButton groupId={groupId} cycleId={cycleId} /> : null
        }
        deleteAction={
          <DeleteCycleButton groupId={groupId} cycleId={cycleId} cycleName={cycle.nom_cycle} />
        }
        backAction={
          <Button asChild variant="outline" size="sm">
            <Link href={`/dashboard/groups/${groupId}/cycles`}>Retour</Link>
          </Button>
        }
      />
    </div>
  );
}
