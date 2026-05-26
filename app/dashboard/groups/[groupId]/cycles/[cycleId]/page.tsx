import Link from "next/link";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { CyclePaymentForm } from "@/components/groups/cycle-payment-form";
import { CloseCycleButton } from "@/components/groups/close-cycle-button";

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
};

export default async function GroupCycleDetailPage({
  params,
}: {
  params: Promise<{ groupId: string; cycleId: string }>;
}) {
  const { groupId, cycleId } = await params;

  const supabase = await createSupabaseServerClient();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;

  if (!user) {
    redirect(`/auth/login?next=${encodeURIComponent(`/dashboard/groups/${groupId}/cycles/${cycleId}`)}`);
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
    });
    paymentsByMember.set(payment.id_membre_groupe, entry);
  });

  const montantFixe = Number(cycle.montant_cotisation);
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

  const participantsForForm = cycle.participants.map((participant) => ({
    id_membre_groupe: participant.id_membre_groupe,
    nom: participant.membre_groupe.user.nom,
    prenom: participant.membre_groupe.user.prenom,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">{cycle.nom_cycle}</h1>
          <p className="text-sm text-muted-foreground">
            {cycle.date_debut.toLocaleDateString("fr-FR")} - {" "}
            {cycle.date_fin.toLocaleDateString("fr-FR")}
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

      <div className="rounded-2xl border border-gray-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-gray-900">Beneficiaire actuel</p>
            <p className="text-lg font-semibold text-brand-600">{currentName}</p>
          </div>
          {!cycleTermine ? (
            <p className="text-xs text-gray-500">Fin du tour: {tourEnd.toLocaleDateString("fr-FR")}</p>
          ) : null}
        </div>
        <div className="mt-3">
          <div className="h-2 w-full rounded-full bg-gray-100">
            <div
              className="h-2 rounded-full bg-brand-500"
              style={{
                width: `${Math.min((currentIndex / Math.max(totalTours, 1)) * 100, 100)}%`,
              }}
            />
          </div>
          <p className="mt-1 text-xs text-gray-500">
            {Math.min(currentIndex, totalTours)} / {totalTours} tours completes
          </p>
        </div>
      </div>

      {membership.role === "ADMIN" ? (
        <CyclePaymentForm groupId={groupId} cycleId={cycleId} participants={participantsForForm} />
      ) : null}

      <div className="space-y-3">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">Participants</h2>
        <div className="grid gap-3">
          {cycle.participants.map((participant) => {
            const member = participant.membre_groupe;
            if (membership.role !== "ADMIN" && member.id_membre_groupe !== membership.id_membre_groupe) {
              return null;
            }

            const paymentsList = paymentsByMember.get(member.id_membre_groupe) ?? [];
            const totalPaid = paymentsList.reduce((acc, item) => acc + item.montant, 0);
            const remaining = Math.max(0, montantFixe - totalPaid);
            const advance = Math.max(0, totalPaid - montantFixe);
            const progressPercent = Math.min((totalPaid / montantFixe) * 100, 100);
            const isLate = !cycleTermine && new Date() > tourEnd && totalPaid < montantFixe;

            return (
              <div key={member.id_membre_groupe} className="rounded-xl border border-gray-200 bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {member.user.prenom} {member.user.nom}
                    </p>
                    <p className="text-xs text-gray-500">{member.user.email}</p>
                  </div>
                  <div className="text-right text-xs text-gray-500">
                    <p>Verse: {totalPaid.toLocaleString("fr-FR")}</p>
                    <p>Restant: {remaining.toLocaleString("fr-FR")}</p>
                    {advance > 0 ? <p>Avance: {advance.toLocaleString("fr-FR")}</p> : null}
                    {isLate ? <p className="font-semibold text-rose-600">En retard</p> : null}
                  </div>
                </div>

                <div className="mt-3">
                  <div className="h-2 w-full rounded-full bg-gray-100">
                    <div
                      className="h-2 rounded-full bg-emerald-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    {Math.min(totalPaid, montantFixe).toLocaleString("fr-FR")} / {" "}
                    {montantFixe.toLocaleString("fr-FR")} {membership.groupe.devise}
                  </p>
                </div>

                <div className="mt-3">
                  <p className="text-xs font-semibold text-gray-900">Historique des versements</p>
                  {paymentsList.length ? (
                    <div className="mt-2 space-y-1 text-xs text-gray-500">
                      {paymentsList.map((payment) => (
                        <div key={payment.id_cotisation} className="flex justify-between">
                          <span>{payment.date_de_paiement.toLocaleDateString("fr-FR")}</span>
                          <span>{payment.montant.toLocaleString("fr-FR")}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-gray-500">Aucun versement.</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
