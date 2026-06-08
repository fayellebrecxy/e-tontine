"use client";

import * as React from "react";
import Link from "next/link";
import { RotateCcw, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useHistoryVisibility } from "@/hooks/use-history-visibility";

type AmendeCollecteeItem = {
  id_presence: string;
  statut_presence: string;
  date_enregistrement: string;
  reunion: {
    id_reunion: string;
    titre: string;
    date_reunion: string;
    montant_amende: number | null;
  };
  membre_groupe: {
    user: { nom: string; prenom: string };
  };
};

type RetraitAmendeItem = {
  id_retrait_amende: string;
  montant: number;
  motif: string;
  date_retrait: string;
  valideur: {
    user: { nom: string; prenom: string };
  };
};

type CaisseAmendesHistoryProps = {
  groupId: string;
  devise: string;
  amendes: AmendeCollecteeItem[];
  retraits: RetraitAmendeItem[];
};

function VisibilityButton({ hidden, onClick }: { hidden: boolean; onClick: () => void }) {
  return (
    <Button type="button" size="sm" variant="outline" onClick={onClick}>
      {hidden ? <RotateCcw className="mr-2 h-4 w-4" /> : <X className="mr-2 h-4 w-4" />}
      {hidden ? "Restaurer" : "Tout masquer"}
    </Button>
  );
}

export function CaisseAmendesHistory({
  groupId,
  devise,
  amendes,
  retraits,
}: CaisseAmendesHistoryProps) {
  const amendesVisibility = useHistoryVisibility(`reunions:${groupId}:amendes-collectees`);
  const retraitsVisibility = useHistoryVisibility(`reunions:${groupId}:retraits-amendes`);
  const amendesAllHidden = amendesVisibility.isHidden(groupId);
  const retraitsAllHidden = retraitsVisibility.isHidden(groupId);
  const visibleAmendes = amendesAllHidden
    ? []
    : amendes.filter((item) => !amendesVisibility.isHidden(item.id_presence));
  const visibleRetraits = retraitsAllHidden
    ? []
    : retraits.filter((item) => !retraitsVisibility.isHidden(item.id_retrait_amende));

  return (
    <>
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold text-gray-900 dark:text-white">
            Amendes collectées ({visibleAmendes.length})
          </h2>
          <VisibilityButton
            hidden={amendesAllHidden}
            onClick={() =>
              amendesAllHidden
                ? amendesVisibility.restoreAll("Historique des amendes réaffiché.")
                : amendesVisibility.hide(groupId, "Historique des amendes masqué.")
            }
          />
        </div>

        {amendesAllHidden ? (
          <div className="rounded-xl border border-dashed border-gray-300 py-10 text-center text-sm text-muted-foreground">
            Historique des amendes collectées masqué.
          </div>
        ) : visibleAmendes.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 py-10 text-center text-sm text-muted-foreground">
            Aucune amende collectée visible.
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Membre</th>
                  <th className="px-4 py-3 text-left font-medium">Réunion</th>
                  <th className="px-4 py-3 text-left font-medium">Statut</th>
                  <th className="px-4 py-3 text-right font-medium">Montant</th>
                  <th className="px-4 py-3 text-right font-medium">Date paiement</th>
                  <th className="px-4 py-3 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white dark:divide-gray-800 dark:bg-gray-900">
                {visibleAmendes.map((item) => (
                  <tr
                    key={item.id_presence}
                    className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                      {item.membre_groupe.user.prenom} {item.membre_groupe.user.nom}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      <Link
                        href={`/dashboard/groups/${groupId}/reunions/${item.reunion.id_reunion}`}
                        className="hover:text-amber-700 hover:underline"
                      >
                        {item.reunion.titre}
                      </Link>
                      <p className="text-xs text-gray-400">
                        {new Date(item.reunion.date_reunion).toLocaleDateString("fr-FR", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-700">
                        {item.statut_presence === "EN_RETARD" ? "En retard" : "Absent"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-emerald-700">
                      +{Number(item.reunion.montant_amende ?? 0).toLocaleString("fr-FR")} {devise}
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-gray-500">
                      {new Date(item.date_enregistrement).toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-gray-400 hover:bg-rose-50 hover:text-rose-600"
                        onClick={() =>
                          amendesVisibility.hide(
                            item.id_presence,
                            "Amende masquée de l'historique.",
                          )
                        }
                        aria-label="Masquer cette amende"
                        title="Masquer cette amende"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold text-gray-900 dark:text-white">
            Retraits effectués ({visibleRetraits.length})
          </h2>
          <VisibilityButton
            hidden={retraitsAllHidden}
            onClick={() =>
              retraitsAllHidden
                ? retraitsVisibility.restoreAll("Historique des retraits réaffiché.")
                : retraitsVisibility.hide(groupId, "Historique des retraits masqué.")
            }
          />
        </div>

        {retraitsAllHidden ? (
          <div className="rounded-xl border border-dashed border-gray-300 py-10 text-center text-sm text-muted-foreground">
            Historique des retraits masqué.
          </div>
        ) : visibleRetraits.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 py-10 text-center text-sm text-muted-foreground">
            Aucun retrait visible.
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Date</th>
                  <th className="px-4 py-3 text-left font-medium">Motif</th>
                  <th className="px-4 py-3 text-left font-medium">Admin</th>
                  <th className="px-4 py-3 text-right font-medium">Montant</th>
                  <th className="px-4 py-3 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white dark:divide-gray-800 dark:bg-gray-900">
                {visibleRetraits.map((item) => (
                  <tr
                    key={item.id_retrait_amende}
                    className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-500">
                      {new Date(item.date_retrait).toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{item.motif}</td>
                    <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">
                      {item.valideur.user.prenom} {item.valideur.user.nom}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-rose-600">
                      -{Number(item.montant).toLocaleString("fr-FR")} {devise}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-gray-400 hover:bg-rose-50 hover:text-rose-600"
                        onClick={() =>
                          retraitsVisibility.hide(
                            item.id_retrait_amende,
                            "Retrait masqué de l'historique.",
                          )
                        }
                        aria-label="Masquer ce retrait"
                        title="Masquer ce retrait"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
