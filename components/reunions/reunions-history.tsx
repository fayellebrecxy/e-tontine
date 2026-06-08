"use client";

import * as React from "react";
import { RotateCcw, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useHistoryVisibility } from "@/hooks/use-history-visibility";
import { ReunionCard } from "@/components/reunions/reunion-card";

type ReunionHistoryItem = {
  id_reunion: string;
  titre: string;
  date_reunion: Date | string;
  lieu: string | null;
  type_reunion: "ORDINAIRE" | "EXTRAORDINAIRE" | "URGENCE";
  statut: "PLANIFIEE" | "TERMINEE" | "ANNULEE";
  montant_amende: number | null;
  presences: Array<{
    id_presence: string;
    id_membre_groupe?: string;
    statut_presence: string;
    amende_payee: boolean;
  }>;
};

type ReunionsHistoryProps = {
  groupId: string;
  reunions: ReunionHistoryItem[];
  isAdmin: boolean;
  devise: string;
};

export function ReunionsHistory({ groupId, reunions, isAdmin, devise }: ReunionsHistoryProps) {
  const historyVisibility = useHistoryVisibility(`reunions:${groupId}:passees`);
  const allHistoryHidden = historyVisibility.isHidden(groupId);
  const visibleReunions = allHistoryHidden
    ? []
    : reunions.filter((reunion) => !historyVisibility.isHidden(reunion.id_reunion));

  if (!reunions.length) {
    return null;
  }

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
          Réunions passées ({visibleReunions.length})
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          {historyVisibility.hiddenTargetIds.size > 0 && !allHistoryHidden && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => historyVisibility.restoreAll("Historique des réunions réaffiché.")}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Restaurer
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() =>
              allHistoryHidden
                ? historyVisibility.restoreAll("Historique des réunions réaffiché.")
                : historyVisibility.hide(groupId, "Historique des réunions masqué.")
            }
          >
            {allHistoryHidden ? (
              <RotateCcw className="mr-2 h-4 w-4" />
            ) : (
              <X className="mr-2 h-4 w-4" />
            )}
            {allHistoryHidden ? "Restaurer l'historique" : "Masquer tout l'historique"}
          </Button>
        </div>
      </div>

      {allHistoryHidden ? (
        <div className="rounded-xl border border-dashed border-gray-300 py-10 text-center text-sm text-muted-foreground">
          Historique des réunions passées masqué.
        </div>
      ) : visibleReunions.length ? (
        <div className="space-y-3">
          {visibleReunions.map((reunion) => (
            <div key={reunion.id_reunion} className="relative">
              <div className="absolute right-3 top-3 z-10">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-8 border border-white/80 bg-white/90 px-2 text-xs text-gray-500 shadow-sm hover:bg-rose-50 hover:text-rose-600 dark:border-gray-700 dark:bg-gray-900/90"
                  onClick={() =>
                    historyVisibility.hide(
                      reunion.id_reunion,
                      "Réunion masquée de votre historique.",
                    )
                  }
                  aria-label="Masquer cette réunion"
                  title="Masquer cette réunion"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="ml-1">Masquer</span>
                </Button>
              </div>
              <ReunionCard
                reunion={{
                  ...reunion,
                  date_reunion: new Date(reunion.date_reunion),
                }}
                groupId={groupId}
                isAdmin={isAdmin}
                devise={devise}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3 rounded-xl border border-dashed border-gray-300 px-4 py-10 text-center text-sm text-muted-foreground">
          <p>Aucune réunion passée visible.</p>
          {historyVisibility.hiddenTargetIds.size > 0 && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => historyVisibility.restoreAll("Historique des réunions réaffiché.")}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Restaurer l'historique
            </Button>
          )}
        </div>
      )}
    </section>
  );
}
