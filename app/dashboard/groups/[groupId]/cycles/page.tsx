import Link from "next/link";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CreateCycleForm } from "@/components/groups/create-cycle-form";
import { Button } from "@/components/ui/button";

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

export const dynamic = "force-dynamic";

export default async function GroupCyclesPage({
  params,
  searchParams,
}: {
  params: Promise<{ groupId: string }>;
  searchParams?: Promise<{ status?: string }>;
}) {
  const { groupId } = await params;
  const { status } = (await searchParams) ?? {};

  const supabase = await createSupabaseServerClient();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;

  if (!user) {
    redirect(`/auth/login?next=${encodeURIComponent(`/dashboard/groups/${groupId}/cycles`)}`);
  }

  const membership = await prisma.membreGroupe.findFirst({
    where: { id_user: user.id, id_groupe: groupId, statut_adhesion: "ACTIF" },
    select: {
      id_membre_groupe: true,
      role: true,
      groupe: {
        select: {
          devise: true,
          cycles: {
            orderBy: { date_debut: "desc" },
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
                  id_membre_groupe: true,
                  ordre: true,
                  membre_groupe: {
                    select: { user: { select: { nom: true, prenom: true } } },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!membership) {
    redirect("/dashboard");
  }

  const normalized =
    membership.role === "ADMIN"
      ? membership.groupe.cycles
      : membership.groupe.cycles.filter((c) =>
          c.participants.some((p) => p.id_membre_groupe === membership.id_membre_groupe),
        );

  const now = new Date();
  const filtered = normalized.filter((cycle) => {
    if (status === "active") {
      return cycle.date_debut <= now && cycle.date_fin >= now;
    }
    if (status === "closed") {
      return cycle.date_fin < now;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Cycles</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gere les cycles de tontine pour ce groupe.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button asChild variant={status === "active" ? "default" : "outline"} size="sm">
          <Link href={`/dashboard/groups/${groupId}/cycles?status=active`}>En cours</Link>
        </Button>
        <Button asChild variant={status === "closed" ? "default" : "outline"} size="sm">
          <Link href={`/dashboard/groups/${groupId}/cycles?status=closed`}>Termines</Link>
        </Button>
        <Button asChild variant={!status ? "default" : "outline"} size="sm">
          <Link href={`/dashboard/groups/${groupId}/cycles`}>Tous</Link>
        </Button>
      </div>

      {membership.role === "ADMIN" && (
        <CreateCycleForm groupId={groupId} canManage={true} />
      )}

      <div className="space-y-3">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">Cycles enregistres</h2>
        {filtered.length ? (
          <div className="grid gap-3">
            {filtered.map((cycle) => {
              const index = computeCurrentIndex(cycle.date_debut, cycle.duree_tour_de_gain);
              const totalTours = cycle.participants.length;
              const isFinished = index >= totalTours;
              const current = !isFinished ? cycle.participants[index] : null;
              const currentName = current
                ? `${current.membre_groupe.user.prenom} ${current.membre_groupe.user.nom}`
                : "Cycle termine";
              const progress = totalTours ? Math.min(index / totalTours, 1) : 0;
              const progressPercent = Math.round(progress * 100);
              const tourEnd = addDays(
                cycle.date_debut,
                cycle.duree_tour_de_gain * Math.min(index + 1, totalTours),
              );

              return (
                <div key={cycle.id_cycle} className="rounded-xl border border-gray-200 bg-white p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{cycle.nom_cycle}</p>
                      <p className="text-xs text-gray-500">
                        {cycle.date_debut.toLocaleDateString("fr-FR")} - {" "}
                        {cycle.date_fin.toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {isFinished ? (
                        <span className="inline-flex items-center rounded-md bg-emerald-100 px-2.5 py-1 text-[10px] font-bold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                          🟢 Terminé
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-md bg-brand-100 px-2.5 py-1 text-[10px] font-bold text-brand-700 ring-1 ring-inset ring-brand-600/20">
                          🔵 En cours
                        </span>
                      )}
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/dashboard/groups/${groupId}/cycles/${cycle.id_cycle}`}>
                          Voir détails
                        </Link>
                      </Button>
                    </div>
                  </div>

                  <div className="mt-3 space-y-2 text-xs text-gray-500">
                    <p>
                      Montant fixe: {Number(cycle.montant_cotisation).toLocaleString("fr-FR")} {" "}
                      {membership.groupe.devise}
                    </p>
                    <p>Duree tour: {cycle.duree_tour_de_gain} jours</p>
                    <p>Beneficiaire actuel: {currentName}</p>
                    <p>Ordre des bénéficiaires:</p>
                    <ul className="list-decimal list-inside text-xs text-gray-500">
                      {cycle.participants.map((p, idx) => (
                        <li key={p.ordre}>
                          {idx + 1}. {p.membre_groupe.user.prenom} {p.membre_groupe.user.nom}
                        </li>
                      ))}
                    </ul>
                    {!isFinished ? (
                      <p>Fin du tour: {tourEnd.toLocaleDateString("fr-FR")}</p>
                    ) : null}
                  </div>

                  <div className="mt-3">
                    <div className="h-2 w-full rounded-full bg-gray-100">
                      <div
                        className="h-2 rounded-full bg-brand-500"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      {Math.min(index, totalTours)} / {totalTours} tours completes
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Aucun cycle pour le moment.</p>
        )}
      </div>
    </div>
  );
}
