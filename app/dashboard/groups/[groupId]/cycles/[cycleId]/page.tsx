import Link from "next/link";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { applyAutomaticOverduePenalties } from "@/lib/cycle-penalties";
import { Button } from "@/components/ui/button";
import { CyclePaymentForm } from "@/components/groups/cycle-payment-form";
import { CloseCycleButton } from "@/components/groups/close-cycle-button";
import { EditCycleForm } from "@/components/groups/edit-cycle-form";
import { DistributionForm } from "@/components/groups/distribution-form";
import { DistributionHistory } from "@/components/groups/distribution-history";
import { calculerPotTour, getVersementsCycle, getTresorerieCycle } from "@/lib/cycle-distributions";

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function computeCurrentIndex(dateDebut: Date, dureeTour: number) {
  const now = new Date();
  const diffMs = now.getTime() - dateDebut.getTime();
  if (diffMs < 0) return 0;
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return Math.floor(days / dureeTour);
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
    select: { id_membre_groupe: true, role: true, groupe: { select: { devise: true } } },
  });

  if (!membership) {
    redirect("/dashboard");
  }

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
    });
    paymentsByMember.set(payment.id_membre_groupe, entry);
  });

  const montantFixe = Number(cycle.montant_cotisation);
  const now = new Date();
  const currentIndex = computeCurrentIndex(cycle.date_debut, cycle.duree_tour_de_gain);
  const totalTours = cycle.participants.length;
  const cycleTermine = currentIndex >= totalTours;
  const currentParticipant = !cycleTermine ? cycle.participants[currentIndex] : null;
  const currentName = currentParticipant
    ? `${currentParticipant.membre_groupe.user.prenom} ${currentParticipant.membre_groupe.user.nom}`
    : "Cycle termine";
  const tourEnd = addDays(
    cycle.date_debut,
    cycle.duree_tour_de_gain * Math.min(currentIndex + 1, totalTours),
  );

  const defaultTour = Math.min(currentIndex + 1, totalTours);

  const participantsForForm = cycle.participants.map((participant) => ({
    id_membre_groupe: participant.id_membre_groupe,
    nom: participant.membre_groupe.user.nom,
    prenom: participant.membre_groupe.user.prenom,
  }));
  const toursForForm = cycle.participants.map((participant) => ({
    numero: participant.ordre,
    beneficiaire: `${participant.membre_groupe.user.prenom} ${participant.membre_groupe.user.nom}`,
    dateEcheance: addDays(
      cycle.date_debut,
      cycle.duree_tour_de_gain * participant.ordre,
    ).toLocaleDateString("fr-FR"),
  }));
  const participantsStats = cycle.participants.map((participant) => {
    const member = participant.membre_groupe;
    const paymentsList = paymentsByMember.get(member.id_membre_groupe) ?? [];
    
    // Calcul par tour pour une précision maximale
    const tourDetails = Array.from({ length: totalTours }, (_, i) => {
      const tourNum = i + 1;
      const dueDate = addDays(cycle.date_debut, cycle.duree_tour_de_gain * tourNum);
      const tourPayments = paymentsList.filter(p => p.numero_tour === tourNum);
      const paidAmount = tourPayments.reduce((acc, p) => acc + p.montant, 0);
      const penaltiesAmount = tourPayments.reduce((acc, p) => acc + (p.montant_penalite || 0), 0);
      
      const isOverdue = now > dueDate && paidAmount < montantFixe;
      const daysLate = isOverdue ? Math.ceil((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;
      
      return {
        tourNum,
        dueDate,
        paidAmount,
        penaltiesAmount,
        isOverdue,
        daysLate,
        isComplete: paidAmount >= montantFixe
      };
    });

    const totalPaid = tourDetails.reduce((acc, t) => acc + t.paidAmount, 0);
    const totalPenalties = tourDetails.reduce((acc, t) => acc + t.penaltiesAmount, 0);
    const totalDaysLate = tourDetails.reduce((acc, t) => acc + t.daysLate, 0);
    const hasActivePenalty = tourDetails.some(t => t.penaltiesAmount > 0);
    const isLate = tourDetails.some(t => t.isOverdue);
    const isIncomplete = tourDetails.some(t => t.tourNum <= currentIndex + 1 && !t.isComplete);

    return {
      participant,
      totalPaid,
      totalPenalties,
      totalDaysLate,
      hasActivePenalty,
      isLate,
      isIncomplete,
      tourDetails
    };
  });

  // Récupérer les versements et la trésorerie (admin uniquement)
  const [versementsCycle, tresorerie] = membership.role === "ADMIN"
    ? await Promise.all([
        getVersementsCycle(cycleId),
        getTresorerieCycle(cycleId),
      ])
    : [[], { totalCollecte: 0, totalDistribue: 0, soldeDisponible: 0, toursVerses: 0 }];

  // Calculer le pot collecté par tour pour le formulaire de distribution
  const potsParTour = membership.role === "ADMIN"
    ? await Promise.all(
        cycle.participants.map((p) =>
          calculerPotTour(cycleId, p.ordre).then((pot) => ({ numero: p.ordre, pot }))
        ),
      )
    : [];

  const versementsParTour = new Map(versementsCycle.map((v) => [v.numero_tour, v]));

  const toursForDistribution = cycle.participants.map((participant) => {
    const potInfo = potsParTour.find((p) => p.numero === participant.ordre);
    return {
      numero: participant.ordre,
      beneficiaire: `${participant.membre_groupe.user.prenom} ${participant.membre_groupe.user.nom}`,
      idBeneficiaire: participant.id_membre_groupe,
      dateEcheance: addDays(
        cycle.date_debut,
        cycle.duree_tour_de_gain * participant.ordre,
      ).toLocaleDateString("fr-FR"),
      potCollecte: potInfo?.pot.potTotal ?? 0,
      dejaVerse: versementsParTour.has(participant.ordre),
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

  const globalStats = {
    totalPenalties: participantsStats.reduce((acc, p) => acc + p.totalPenalties, 0),
    totalLateMembers: participantsStats.filter(p => p.isLate).length,
    totalDaysLate: participantsStats.reduce((acc, p) => acc + p.totalDaysLate, 0),
    totalExpected: montantFixe * totalTours * totalTours, // Simplification: chaque membre paie à chaque tour
    totalCollected: participantsStats.reduce((acc, p) => acc + p.totalPaid, 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">{cycle.nom_cycle}</h1>
          <p className="text-sm text-muted-foreground">
            Du {cycle.date_debut.toLocaleDateString("fr-FR")} au {cycle.date_fin.toLocaleDateString("fr-FR")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {membership.role === "ADMIN" && !cycleTermine ? (
            <CloseCycleButton groupId={groupId} cycleId={cycleId} />
          ) : null}
          <Button asChild variant="outline" size="sm">
            <Link href={`/dashboard/groups/${groupId}/cycles`}>Retour aux cycles</Link>
          </Button>
        </div>
      </div>

      {/* Trésorerie (Admin) */}
      {membership.role === "ADMIN" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-xs font-medium text-gray-500 uppercase">Total collecté</p>
            <p className="mt-1 text-2xl font-bold text-emerald-600">
              {tresorerie.totalCollecte.toLocaleString("fr-FR")} {membership.groupe.devise}
            </p>
            <p className="text-xs text-gray-400">Cotisations + pénalités</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-xs font-medium text-gray-500 uppercase">Total distribué</p>
            <p className="mt-1 text-2xl font-bold text-brand-600">
              {tresorerie.totalDistribue.toLocaleString("fr-FR")} {membership.groupe.devise}
            </p>
            <p className="text-xs text-gray-400">{tresorerie.toursVerses} tour(s) soldé(s)</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-xs font-medium text-gray-500 uppercase">Solde disponible</p>
            <p className={`mt-1 text-2xl font-bold ${tresorerie.soldeDisponible >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
              {tresorerie.soldeDisponible.toLocaleString("fr-FR")} {membership.groupe.devise}
            </p>
          </div>
        </div>
      )}

      {membership.role === "ADMIN" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-xs font-medium text-gray-500 uppercase">Membres en retard</p>
            <p className="mt-1 text-2xl font-bold text-rose-600">{globalStats.totalLateMembers}</p>
            <p className="text-xs text-gray-400">{globalStats.totalDaysLate} jours de retard cumulés</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-xs font-medium text-gray-500 uppercase">Pénalités générées</p>
            <p className="mt-1 text-2xl font-bold text-amber-600">
              {globalStats.totalPenalties.toLocaleString("fr-FR")} {membership.groupe.devise}
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-xs font-medium text-gray-500 uppercase">Collecté</p>
            <p className="mt-1 text-2xl font-bold text-emerald-600">
              {globalStats.totalCollected.toLocaleString("fr-FR")} {membership.groupe.devise}
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-xs font-medium text-gray-500 uppercase">Progression financière</p>
            <p className="mt-1 text-2xl font-bold text-brand-600">
              {Math.round((globalStats.totalCollected / (montantFixe * totalTours * totalTours)) * 100 || 0)}%
            </p>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-gray-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase">Tour actuel — Bénéficiaire du pot</p>
            <p className="text-lg font-semibold text-brand-600">{currentName}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {cycleTermine
                ? "Tous les tours sont terminés. Le cycle est clos."
                : `C'est au tour de ${currentName} de recevoir le pot collecté par tous les membres.`}
            </p>
          </div>
          {!cycleTermine ? (
            <div className="text-right">
              <p className="text-xs text-gray-500">Échéance du tour</p>
              <p className="text-sm font-bold text-gray-900">{tourEnd.toLocaleDateString("fr-FR")}</p>
            </div>
          ) : null}
        </div>
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>Progression du cycle</span>
            <span>{Math.min(currentIndex, totalTours)} / {totalTours} tours complétés</span>
          </div>
          <div className="h-2 w-full rounded-full bg-gray-100">
            <div
              className="h-2 rounded-full bg-brand-500"
              style={{
                width: `${Math.min((currentIndex / Math.max(totalTours, 1)) * 100, 100)}%`,
              }}
            />
          </div>
        </div>
      </div>

      {membership.role === "ADMIN" ? (
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
      ) : null}

      {membership.role === "ADMIN" ? (
        <DistributionForm
          groupId={groupId}
          cycleId={cycleId}
          tours={toursForDistribution}
          defaultTour={defaultTour}
          devise={membership.groupe.devise}
        />
      ) : null}

      {membership.role === "ADMIN" ? (
        <CyclePaymentForm
          groupId={groupId}
          cycleId={cycleId}
          participants={participantsForForm}
          tours={toursForForm}
          defaultTour={defaultTour}
        />
      ) : null}

      {membership.role !== "ADMIN" && (
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
          <p className="text-sm font-semibold text-blue-800">ℹ️ Votre espace membre</p>
          <p className="text-xs text-blue-700 mt-1">
            Vous voyez ici votre situation personnelle dans ce cycle. Seul l'administrateur peut enregistrer un paiement en votre nom. Contactez-le si vous avez effectué un versement qui n'apparaît pas.
          </p>
        </div>
      )}

      {membership.role === "ADMIN" && (
        <DistributionHistory
          versements={versementsCycle.map((v) => ({
            ...v,
            montant_verse: Number(v.montant_verse),
          }))}
          tours={toursForHistory}
          totalTours={totalTours}
          devise={membership.groupe.devise}
        />
      )}

      <div className="space-y-3">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">Situation des participants</h2>
        <div className="grid gap-3">
          {participantsStats.map(({ participant, totalPaid, totalPenalties, totalDaysLate, hasActivePenalty, isLate, isIncomplete, tourDetails }) => {
            const member = participant.membre_groupe;
            if (
              membership.role !== "ADMIN" &&
              member.id_membre_groupe !== membership.id_membre_groupe
            ) {
              return null;
            }

            const montantInitial = montantFixe * totalTours;
            const totalDu = montantInitial + totalPenalties;
            const progressPercent = Math.min((totalPaid / montantInitial) * 100, 100);

            return (
              <div
                key={member.id_membre_groupe}
                className="rounded-xl border border-gray-200 bg-white p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold uppercase">
                      {member.user.prenom[0]}{member.user.nom[0]}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {member.user.prenom} {member.user.nom}
                      </p>
                      <p className="text-xs text-gray-500">{member.user.email}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {isLate && (
                      <span className="inline-flex items-center rounded-md bg-rose-100 px-2.5 py-1 text-xs font-bold text-rose-700 ring-1 ring-inset ring-rose-600/20">
                        🔴 En retard ({totalDaysLate}j)
                      </span>
                    )}
                    {hasActivePenalty && (
                      <span className="inline-flex items-center rounded-md bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-700 ring-1 ring-inset ring-amber-600/20">
                        ⚠️ Pénalité appliquée
                      </span>
                    )}
                    {isIncomplete && (
                      <span className="inline-flex items-center rounded-md bg-orange-100 px-2.5 py-1 text-xs font-bold text-orange-700 ring-1 ring-inset ring-orange-600/20">
                        🟠 Paiement incomplet
                      </span>
                    )}
                    {!isIncomplete && !isLate && totalPaid >= montantInitial && (
                      <span className="inline-flex items-center rounded-md bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                        🟢 À jour
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-medium text-gray-500 uppercase">Cotisation totale (tous les tours)</p>
                    <p className="text-sm font-semibold">{montantInitial.toLocaleString("fr-FR")} {membership.groupe.devise}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-medium text-gray-500 uppercase">Pénalités</p>
                    <p className="text-sm font-semibold text-amber-600">+{totalPenalties.toLocaleString("fr-FR")} {membership.groupe.devise}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-medium text-gray-500 uppercase">Total à payer</p>
                    <p className="text-sm font-bold text-gray-900">{totalDu.toLocaleString("fr-FR")} {membership.groupe.devise}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-medium text-gray-500 uppercase">Total versé</p>
                    <p className="text-sm font-bold text-emerald-600">{totalPaid.toLocaleString("fr-FR")} {membership.groupe.devise}</p>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-between text-[10px] mb-1">
                    <span className="text-gray-500 font-medium">Progression de la cotisation</span>
                    <span className="text-gray-900 font-bold">{Math.round(progressPercent)}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-gray-100">
                    <div
                      className="h-1.5 rounded-full bg-emerald-500 transition-all"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                <div className="mt-4 border-t border-gray-50 pt-4">
                  <details className="group">
                    <summary className="flex cursor-pointer items-center justify-between list-none text-xs font-semibold text-gray-900">
                      <span>Détail par tour</span>
                      <span className="text-brand-600 group-open:rotate-180 transition-transform">▼</span>
                    </summary>
                    <div className="mt-3 space-y-2">
                      {tourDetails.map((tour) => (
                        <div key={tour.tourNum} className="flex items-center justify-between text-[11px] p-2 rounded-lg bg-gray-50">
                          <div className="space-y-0.5">
                            <p className="font-bold text-gray-900">Tour {tour.tourNum}</p>
                            <p className="text-gray-500">Échéance : {tour.dueDate.toLocaleDateString("fr-FR")}</p>
                          </div>
                          <div className="text-right space-y-0.5">
                            <p className="font-medium">
                              {tour.paidAmount.toLocaleString("fr-FR")} / {montantFixe.toLocaleString("fr-FR")}
                            </p>
                            {tour.penaltiesAmount > 0 && (
                              <p className="text-amber-600 font-bold">Pén. : +{tour.penaltiesAmount.toLocaleString("fr-FR")}</p>
                            )}
                            {tour.isOverdue && (
                              <p className="text-rose-600 font-bold">Retard: {tour.daysLate}j</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </details>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
