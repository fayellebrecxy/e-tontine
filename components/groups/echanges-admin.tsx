"use client";

import * as React from "react";
import { ArrowLeftRight, CheckCircle2, RotateCcw, Trash2, X, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { useHistoryVisibility } from "@/hooks/use-history-visibility";

export type EchangeAdmin = {
  id_demande: string;
  statut: string;
  tour_demandeur: number;
  tour_cible: number;
  note?: string | null;
  date_demande: string;
  demandeur: { id_membre_groupe: string; user: { nom: string; prenom: string } };
  cible: { id_membre_groupe: string; user: { nom: string; prenom: string } };
};

type Props = {
  groupId: string;
  cycleId: string;
  echanges: EchangeAdmin[];
};

const STATUT_LABELS: Record<string, { label: string; color: string }> = {
  EN_ATTENTE: { label: "En attente cible", color: "bg-amber-100 text-amber-700" },
  ACCEPTEE_MEMBRES: { label: "⚡ À valider", color: "bg-purple-100 text-purple-700" },
  VALIDEE_ADMIN: { label: "✓ Validé", color: "bg-emerald-100 text-emerald-700" },
  REFUSEE_CIBLE: { label: "Refusé (cible)", color: "bg-red-100 text-red-600" },
  REFUSEE_ADMIN: { label: "Refusé (admin)", color: "bg-red-100 text-red-600" },
  ANNULEE: { label: "Annulée", color: "bg-gray-100 text-gray-500" },
};

export function EchangesAdmin({ groupId, cycleId, echanges }: Props) {
  const router = useRouter();
  const [loadingId, setLoadingId] = React.useState<string | null>(null);
  const historyVisibility = useHistoryVisibility(`cycles:${cycleId}:echanges`);

  const action = async (id_demande: string, act: string) => {
    setLoadingId(id_demande);
    try {
      const res = await fetch(`/api/groups/${groupId}/cycles/${cycleId}/echanges/${id_demande}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: act }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        toast.error(data.error ?? "Erreur");
        return;
      }
      if (act === "valider_admin") toast.success("Échange validé et appliqué !");
      else if (act === "refuser_admin") toast.success("Échange refusé.");
      else toast.success("Demande annulée.");
      router.refresh();
    } finally {
      setLoadingId(null);
    }
  };

  const enAttente = echanges.filter((e) => e.statut === "ACCEPTEE_MEMBRES");
  const allHistoryHidden = historyVisibility.isHidden(cycleId);
  const autres = allHistoryHidden
    ? []
    : echanges.filter(
        (e) => e.statut !== "ACCEPTEE_MEMBRES" && !historyVisibility.isHidden(e.id_demande),
      );

  if (echanges.length === 0) {
    return (
      <p className="text-sm italic text-gray-500">Aucune demande d&apos;échange sur ce cycle.</p>
    );
  }

  return (
    <div className="space-y-4">
      {/* Demandes à valider en priorité */}
      {enAttente.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-purple-700">À valider ({enAttente.length})</h4>
          {enAttente.map((e) => (
            <div
              key={e.id_demande}
              className="rounded-xl border border-purple-200 bg-purple-50 p-4 dark:border-purple-800 dark:bg-purple-900/20"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    <strong>
                      {e.demandeur.user.prenom} {e.demandeur.user.nom}
                    </strong>
                    <ArrowLeftRight className="mx-1.5 inline h-3.5 w-3.5 text-purple-500" />
                    <strong>
                      {e.cible.user.prenom} {e.cible.user.nom}
                    </strong>
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    Tour {e.tour_demandeur} ↔ Tour {e.tour_cible}
                    {e.note && <span className="ml-2 italic">&quot;{e.note}&quot;</span>}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-400">
                    Les deux membres ont accepté. En attente de votre validation.
                  </p>
                </div>
                <div className="flex flex-shrink-0 gap-2">
                  <Button
                    size="sm"
                    onClick={() => action(e.id_demande, "valider_admin")}
                    disabled={loadingId === e.id_demande}
                    className="h-8 gap-1 bg-emerald-600 text-white hover:bg-emerald-700"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Valider
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => action(e.id_demande, "refuser_admin")}
                    disabled={loadingId === e.id_demande}
                    className="h-8 gap-1 border-red-200 text-red-600 hover:bg-red-50"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    Refuser
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Historique */}
      {(autres.length > 0 || allHistoryHidden) && (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-sm font-semibold text-gray-500">Historique</h4>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() =>
                allHistoryHidden
                  ? historyVisibility.restoreAll("Historique réaffiché.")
                  : historyVisibility.hide(cycleId, "Historique masqué.")
              }
            >
              {allHistoryHidden ? (
                <RotateCcw className="mr-2 h-4 w-4" />
              ) : (
                <X className="mr-2 h-4 w-4" />
              )}
              {allHistoryHidden ? "Restaurer" : "Tout masquer"}
            </Button>
          </div>
          {allHistoryHidden ? (
            <div className="rounded-lg border border-dashed border-gray-300 py-8 text-center text-sm text-gray-500">
              Historique des échanges masqué.
            </div>
          ) : null}
          {!allHistoryHidden
            ? autres.map((e) => {
                const s = STATUT_LABELS[e.statut] ?? {
                  label: e.statut,
                  color: "bg-gray-100 text-gray-500",
                };
                return (
                  <div
                    key={e.id_demande}
                    className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900"
                  >
                    <div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        <strong>
                          {e.demandeur.user.prenom} {e.demandeur.user.nom}
                        </strong>
                        {" ↔ "}
                        <strong>
                          {e.cible.user.prenom} {e.cible.user.nom}
                        </strong>
                        <span className="ml-2 text-xs text-gray-400">
                          (tour {e.tour_demandeur} ↔ {e.tour_cible})
                        </span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${s.color}`}>
                        {s.label}
                      </span>
                      {e.statut === "EN_ATTENTE" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs text-gray-400"
                          onClick={() => action(e.id_demande, "annuler")}
                          disabled={loadingId === e.id_demande}
                        >
                          Annuler
                        </Button>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-gray-400 hover:bg-rose-50 hover:text-rose-600"
                        onClick={() =>
                          historyVisibility.hide(e.id_demande, "Demande masquée de l'historique.")
                        }
                        aria-label="Masquer cette demande"
                        title="Masquer cette demande"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })
            : null}
        </div>
      )}
    </div>
  );
}
