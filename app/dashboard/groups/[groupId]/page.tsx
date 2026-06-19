import Link from "next/link";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { calculerStatutMembre } from "@/lib/membre-statut";
import { DownloadReleveButton } from "@/components/groups/download-releve-button";
import { MesPretsSummary } from "@/components/pret/mes-prets-summary";
import { getMesPretsForEmprunteur, syncBorrowerPretNotifications } from "@/lib/pret-dashboard";

export const dynamic = "force-dynamic";

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
        },
      },
    },
  });

  if (!membership) {
    redirect("/dashboard");
  }

  const mesPrets =
    membership.statut_adhesion === "ACTIF"
      ? await getMesPretsForEmprunteur([membership.id_membre_groupe], groupId)
      : [];
  if (mesPrets.length > 0) {
    await syncBorrowerPretNotifications(user.id, mesPrets);
  }

  // Requête directe selon le rôle pour garantir que tous les cycles du membre sont visibles
  type CyclePreview = {
    id_cycle: string;
    nom_cycle: string;
    date_debut: Date;
    date_fin: Date;
    duree_tour_de_gain: number;
  };

  // Statuts des membres — recalculés en temps réel à chaque chargement
  let statsStatuts = { vert: 0, orange: 0, rouge: 0 };
  let monStatutDetail: { statut: string; raisons: string[] } | null = null;

  if (membership.statut_adhesion === "ACTIF") {
    if (membership.role === "ADMIN") {
      // Recalculer tous les statuts en temps réel puis mettre à jour la base
      const tousLesMembres = await prisma.membreGroupe.findMany({
        where: { id_groupe: groupId, statut_adhesion: "ACTIF" },
        select: { id_membre_groupe: true },
      });
      // Calcul en parallèle (recalcul frais, pas la valeur stockée)
      const statuts = await Promise.all(
        tousLesMembres.map(async (m) => {
          const detail = await calculerStatutMembre(m.id_membre_groupe);
          // Mise à jour silencieuse en base pour les composants qui lisent statut_visuel
          await prisma.membreGroupe.update({
            where: { id_membre_groupe: m.id_membre_groupe },
            data: { statut_visuel: detail.statut },
          }).catch(() => null);
          return detail.statut;
        }),
      );
      statsStatuts = {
        vert:   statuts.filter((s) => s === "VERT").length,
        orange: 0,
        rouge:  statuts.filter((s) => s === "ROUGE").length,
      };
    } else {
      // Recalcul frais pour le membre connecté
      monStatutDetail = await calculerStatutMembre(membership.id_membre_groupe);
    }
  }

  let normalizedCycles: CyclePreview[] = [];

  if (membership.statut_adhesion === "ACTIF") {
    if (membership.role === "ADMIN") {
      normalizedCycles = await prisma.cycleTontine.findMany({
        where: { id_groupe: groupId },
        orderBy: { date_debut: "desc" },
        select: {
          id_cycle: true,
          nom_cycle: true,
          date_debut: true,
          date_fin: true,
          duree_tour_de_gain: true,
        },
      });
    } else {
      // Requête directe sur CycleParticipant → garantit que le membre voit ses cycles
      const participations = await prisma.cycleParticipant.findMany({
        where: { id_membre_groupe: membership.id_membre_groupe },
        orderBy: { cycle: { date_debut: "desc" } },
        select: {
          cycle: {
            select: {
              id_cycle: true,
              nom_cycle: true,
              date_debut: true,
              date_fin: true,
              duree_tour_de_gain: true,
            },
          },
        },
      });
      normalizedCycles = participations.map((p) => p.cycle);
    }
  }

  const STATUT_VISUEL_COLORS: Record<string, { bg: string; text: string; dot: string; label: string }> = {
    VERT:   { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", dot: "bg-emerald-500", label: "À jour" },
    ROUGE:  { bg: "bg-rose-50 border-rose-200",       text: "text-rose-700",    dot: "bg-rose-500",    label: "En retard" },
  };

  return (
    <div className="space-y-6">
      {/* ─── En-tête groupe ─── */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">{membership.groupe.nom}</h2>
            {membership.groupe.description && (
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{membership.groupe.description}</p>
            )}
            {membership.groupe.devise && (
              <p className="mt-1 text-xs text-gray-400">Devise : {membership.groupe.devise}</p>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${
              membership.statut_adhesion === "ACTIF"
                ? "bg-emerald-50 text-emerald-700"
                : "bg-gray-100 text-gray-500"
            }`}>
              {membership.statut_adhesion}
            </span>
            {membership.statut_adhesion === "ACTIF" && (
              <DownloadReleveButton
                groupId={groupId}
                membreId={membership.id_membre_groupe}
                membreNom={`${membership.groupe.nom}`}
                variant="full"
              />
            )}
          </div>
        </div>
      </div>

      {mesPrets.length > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-4 dark:border-amber-900/40 dark:bg-amber-950/20">
          <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-amber-900 dark:text-amber-100">
            Mes prêts
          </h2>
          <MesPretsSummary prets={mesPrets} showGroupName={false} compact />
        </div>
      )}

      {/* ─── Mon statut (membre) ─── */}
      {membership.role === "MEMBRE" && monStatutDetail && (
        <div className={`rounded-2xl border p-4 ${STATUT_VISUEL_COLORS[monStatutDetail.statut]?.bg ?? "bg-gray-50 border-gray-200"}`}>
          <div className="flex items-center gap-2 mb-2">
            <span className={`h-3 w-3 rounded-full flex-shrink-0 ${STATUT_VISUEL_COLORS[monStatutDetail.statut]?.dot ?? "bg-gray-400"}`} />
            <p className={`text-sm font-semibold ${STATUT_VISUEL_COLORS[monStatutDetail.statut]?.text ?? "text-gray-700"}`}>
              Mon statut : {STATUT_VISUEL_COLORS[monStatutDetail.statut]?.label ?? monStatutDetail.statut}
            </p>
          </div>
          <ul className="space-y-0.5">
            {monStatutDetail.raisons.map((r, i) => (
              <li key={i} className={`text-xs ${STATUT_VISUEL_COLORS[monStatutDetail!.statut]?.text ?? "text-gray-500"}`}>
                • {r}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ─── Stats statuts membres (admin) ─── */}
      {membership.role === "ADMIN" && membership.statut_adhesion === "ACTIF" && (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center">
            <span className="block text-3xl font-bold text-emerald-700">{statsStatuts.vert}</span>
            <span className="text-sm text-emerald-600 font-medium">🟢 À jour</span>
          </div>
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-center">
            <span className="block text-3xl font-bold text-rose-700">{statsStatuts.rouge}</span>
            <span className="text-sm text-rose-600 font-medium">🔴 En retard</span>
          </div>
        </div>
      )}

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
              const cycleHref = `/dashboard/groups/${groupId}/cycles/${cycle.id_cycle}`;
              return (
                <Link
                  key={cycle.id_cycle}
                  href={cycleHref}
                  className="block rounded-lg border border-gray-200 px-3 py-2 transition-colors hover:border-brand-300 hover:bg-brand-50/40"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-gray-900">{cycle.nom_cycle}</p>
                    {isActive ? (
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-600">
                        En cours
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    {cycle.date_debut.toLocaleDateString("fr-FR")} -{" "}
                    {cycle.date_fin.toLocaleDateString("fr-FR")}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    Duree tour: {cycle.duree_tour_de_gain} jours
                  </p>
                  <p className="mt-2 text-xs font-semibold text-brand-600">Ouvrir le cycle →</p>
                </Link>
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
