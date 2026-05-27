import Link from "next/link";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function GroupOverviewPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;

  const supabase = await createSupabaseServerClient();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;

  if (!user) {
    redirect(`/auth/login?next=${encodeURIComponent(`/dashboard/groups/${groupId}`)}`);
  }

  const membership = await prisma.membreGroupe.findUnique({
    where: { id_user_id_groupe: { id_user: user.id, id_groupe: groupId } },
    select: {
      id_membre_groupe: true,
      role: true,
      statut_adhesion: true,
      groupe: {
        select: {
          nom: true,
          description: true,
          devise: true,
          date_de_creation: true,
          cycles: {
            where: {
              id_groupe: groupId,
            },
            orderBy: { date_debut: "desc" },
            select: {
              id_cycle: true,
              nom_cycle: true,
              date_debut: true,
              date_fin: true,
              duree_tour_de_gain: true,
              participants: {
                select: {
                  id_membre_groupe: true,
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

  const normalizedCycles =
    membership.statut_adhesion === "ACTIF"
      ? membership.role === "ADMIN"
        ? membership.groupe.cycles
        : membership.groupe.cycles.filter((c) =>
            c.participants.some((p) => p.id_membre_groupe === membership.id_membre_groupe),
          )
      : [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Fiche du groupe</h2>
        <p className="text-sm text-muted-foreground">
          Statut: {membership.statut_adhesion}
        </p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-600 dark:border-gray-800 dark:bg-gray-900">
        <p className="text-sm font-semibold text-gray-900 dark:text-white">{membership.groupe.nom}</p>
        {membership.groupe.description ? (
          <p className="mt-2">{membership.groupe.description}</p>
        ) : null}
        {membership.groupe.devise ? (
          <p className="mt-2 text-xs text-gray-500">Devise: {membership.groupe.devise}</p>
        ) : null}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-600 dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">Cycles</p>
          {membership.statut_adhesion !== "ACTIF" ? (
            <span className="text-xs text-gray-400">Acces limite</span>
          ) : null}
        </div>

        {membership.statut_adhesion !== "ACTIF" ? (
          <p className="mt-2 text-xs text-gray-500">
            Les cycles sont visibles uniquement pour les membres actifs.
          </p>
        ) : normalizedCycles.length ? (
          <div className="mt-3 space-y-2">
            {normalizedCycles.map((cycle) => {
              const now = new Date();
              const isActive = cycle.date_debut <= now && cycle.date_fin >= now;
              return (
                <div key={cycle.id_cycle} className="rounded-lg border border-gray-200 px-3 py-2">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-gray-900">{cycle.nom_cycle}</p>
                    {isActive ? (
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-600">
                        En cours
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    {cycle.date_debut.toLocaleDateString("fr-FR")} - {" "}
                    {cycle.date_fin.toLocaleDateString("fr-FR")}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Duree tour: {cycle.duree_tour_de_gain} jours
                  </p>
                  <div className="mt-2">
                    <Link
                      href={`/dashboard/groups/${groupId}/cycles/${cycle.id_cycle}`}
                      className="text-xs font-semibold text-brand-600 hover:underline"
                    >
                      Voir le cycle
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="mt-2 text-xs text-gray-500">Aucun cycle pour le moment.</p>
        )}
      </div>
    </div>
  );
}
