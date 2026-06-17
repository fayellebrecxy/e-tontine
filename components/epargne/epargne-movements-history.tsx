"use client";

import * as React from "react";
import { RotateCcw, Trash2, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useHistoryVisibility } from "@/hooks/use-history-visibility";
import { SignalementEpargneButton } from "@/components/epargne/signalement-button";

type EpargneMovementHistoryItem = {
  id_mouvement: string;
  type_operation:
    | "DEPOT"
    | "RETRAIT"
    | "PRET_DEBIT_BANQUE"
    | "PRET_CREDIT_BANQUE"
    | "PRET_INTERET"
    | "PRET_SAISIE_GARANTIE"
    | "PRET_REDISTRIBUTION_INTERETS";
  montant: number;
  motif: string;
  solde_apres: number;
  date_operation: string;
  operatorName: string;
  signalementsCount: number;
};

const TYPE_LABELS: Record<EpargneMovementHistoryItem["type_operation"], string> = {
  DEPOT: "💰 Dépôt",
  RETRAIT: "📤 Retrait",
  PRET_DEBIT_BANQUE: "🏦 Prêt — prélèvement banque",
  PRET_CREDIT_BANQUE: "🏦 Prêt — retour banque",
  PRET_INTERET: "📈 Intérêts prêt",
  PRET_SAISIE_GARANTIE: "⚠️ Saisie garantie",
  PRET_REDISTRIBUTION_INTERETS: "🎁 Redistribution intérêts",
};

const CREDIT_TYPES = new Set<EpargneMovementHistoryItem["type_operation"]>([
  "DEPOT",
  "PRET_CREDIT_BANQUE",
  "PRET_REDISTRIBUTION_INTERETS",
]);

const MONEY_FORMATTER = new Intl.NumberFormat("fr-FR", {
  maximumFractionDigits: 0,
});

function formatMontant(montant: number, devise: string) {
  return `${MONEY_FORMATTER.format(montant)} ${devise}`;
}

function fmtDate(date: string) {
  return new Date(date).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function EpargneMovementsHistory({
  groupId,
  accountId,
  movements,
  devise,
}: {
  groupId: string;
  accountId: string;
  movements: EpargneMovementHistoryItem[];
  devise: string;
}) {
  const historyVisibility = useHistoryVisibility(`epargne:${groupId}:${accountId}:mouvements`);
  const allHistoryHidden = historyVisibility.isHidden(accountId);
  const visibleMovements = allHistoryHidden
    ? []
    : movements.filter((movement) => !historyVisibility.isHidden(movement.id_mouvement));

  return (
    <section className="rounded-lg border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-950">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4 dark:border-white/10">
        <div>
          <h2 className="font-semibold text-slate-950 dark:text-white">Mes mouvements</h2>
          <p className="text-xs text-slate-500">
            Le masquage allège seulement votre affichage personnel. Les traces restent conservées.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() =>
            allHistoryHidden
              ? historyVisibility.restoreAll("Historique épargne restauré.")
              : historyVisibility.hide(accountId, "Historique épargne masqué.")
          }
        >
          {allHistoryHidden ? (
            <RotateCcw className="mr-2 h-4 w-4" />
          ) : (
            <X className="mr-2 h-4 w-4" />
          )}
          {allHistoryHidden ? "Restaurer l'historique" : "Tout masquer"}
        </Button>
      </div>

      {allHistoryHidden ? (
        <div className="px-5 py-10 text-center text-sm text-slate-500">
          Historique masqué. Vous pouvez le restaurer à tout moment.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500 dark:bg-white/5">
              <tr>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Montant</th>
                <th className="px-4 py-3">Date et heure</th>
                <th className="px-4 py-3">Motif</th>
                <th className="px-4 py-3">Solde après</th>
                <th className="px-4 py-3">Effectué par</th>
                <th className="px-4 py-3">Signalement</th>
                <th className="px-4 py-3 text-right">Affichage</th>
              </tr>
            </thead>
            <tbody>
              {visibleMovements.map((movement) => {
                const isCredit = CREDIT_TYPES.has(movement.type_operation);
                return (
                  <tr key={movement.id_mouvement} className="border-t border-slate-100 dark:border-white/10">
                    <td className="px-4 py-3 font-medium">
                      {TYPE_LABELS[movement.type_operation] ?? movement.type_operation}
                    </td>
                    <td className={`px-4 py-3 font-bold ${isCredit ? "text-emerald-700" : "text-rose-700"}`}>
                      {isCredit ? "+" : "-"}{formatMontant(movement.montant, devise)}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{fmtDate(movement.date_operation)}</td>
                    <td className="px-4 py-3">{movement.motif}</td>
                    <td className="px-4 py-3 font-semibold">{formatMontant(movement.solde_apres, devise)}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-md bg-slate-100 px-2 py-1 font-semibold text-slate-700 dark:bg-white/10 dark:text-white">
                        {movement.operatorName}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {movement.signalementsCount ? (
                        <Badge variant="secondary" className="bg-amber-100 text-amber-800">Signalé</Badge>
                      ) : (
                        <SignalementEpargneButton groupId={groupId} movementId={movement.id_mouvement} />
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                        onClick={() =>
                          historyVisibility.hide(movement.id_mouvement, "Ligne masquée de votre historique.")
                        }
                        aria-label="Masquer cette ligne"
                        title="Masquer cette ligne"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
              {!visibleMovements.length && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-slate-500">
                    Aucun mouvement visible pour le moment.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
