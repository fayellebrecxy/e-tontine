"use client";

import * as React from "react";
import { RotateCcw, Trash2, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useHistoryVisibility } from "@/hooks/use-history-visibility";

export type CyclePaymentHistoryItem = {
  id_cotisation: string;
  memberName?: string;
  numero_tour: number | null;
  date_de_paiement: string;
  montant: number;
  penalite_appliquee: boolean;
  montant_penalite: number | null;
  penalite_collectee: boolean;
};

type CyclePaymentsHistoryProps = {
  payments: CyclePaymentHistoryItem[];
  devise: string;
  historyScope: string;
  historyTargetId: string;
  showMember?: boolean;
  description: string;
  emptyLabel: string;
  showSummary?: boolean;
};

export function CyclePaymentsHistory({
  payments,
  devise,
  historyScope,
  historyTargetId,
  showMember = false,
  description,
  emptyLabel,
  showSummary = false,
}: CyclePaymentsHistoryProps) {
  const historyVisibility = useHistoryVisibility(historyScope);
  const allHistoryHidden = historyVisibility.isHidden(historyTargetId);
  const visiblePayments = allHistoryHidden
    ? []
    : payments.filter((payment) => !historyVisibility.isHidden(payment.id_cotisation));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">{description}</p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() =>
            allHistoryHidden
              ? historyVisibility.restoreAll("Historique réaffiché.")
              : historyVisibility.hide(historyTargetId, "Historique masqué.")
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
        <div className="rounded-lg border border-dashed border-gray-300 py-8 text-center text-sm text-muted-foreground">
          Historique masqué.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          <Table>
            <TableHeader>
              <TableRow>
                {showMember ? <TableHead>Membre</TableHead> : null}
                <TableHead>Tour</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Cotisation</TableHead>
                <TableHead className="hidden sm:table-cell">Pénalité</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visiblePayments.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={showMember ? 7 : 6}
                    className="py-8 text-center text-sm text-muted-foreground"
                  >
                    {emptyLabel}
                  </TableCell>
                </TableRow>
              ) : (
                visiblePayments.map((payment) => {
                  const isPendingPenalty =
                    payment.montant === 0 &&
                    payment.penalite_appliquee &&
                    !payment.penalite_collectee;
                  const isCollectedPenaltyOnly =
                    payment.montant === 0 &&
                    payment.penalite_appliquee &&
                    payment.penalite_collectee;
                  return (
                    <TableRow
                      key={payment.id_cotisation}
                      className={isPendingPenalty ? "bg-amber-50/60 dark:bg-amber-900/10" : ""}
                    >
                      {showMember ? (
                        <TableCell className="font-medium">{payment.memberName ?? "—"}</TableCell>
                      ) : null}
                      <TableCell className="font-medium">
                        Tour {payment.numero_tour ?? "—"}
                      </TableCell>
                      <TableCell className="text-sm text-gray-700">
                        {new Date(payment.date_de_paiement).toLocaleDateString("fr-FR", {
                          day: "2-digit",
                          month: showMember ? "short" : "long",
                          year: "numeric",
                        })}
                      </TableCell>
                      <TableCell
                        className={
                          isPendingPenalty || isCollectedPenaltyOnly
                            ? "italic text-muted-foreground"
                            : "font-medium text-emerald-600"
                        }
                      >
                        {isPendingPenalty
                          ? showMember
                            ? "—"
                            : "Pas encore payé"
                          : isCollectedPenaltyOnly
                            ? "Payée à part"
                          : `${payment.montant.toLocaleString("fr-FR")} ${devise}`}
                      </TableCell>
                      <TableCell className="hidden font-medium text-amber-600 sm:table-cell">
                        {payment.montant_penalite
                          ? `${payment.montant_penalite.toLocaleString("fr-FR")} ${devise}`
                          : "—"}
                      </TableCell>
                      <TableCell>
                        {isPendingPenalty ? (
                          <Badge
                            variant="secondary"
                            className="bg-red-100 text-red-700 hover:bg-red-100"
                          >
                            {showMember ? "Pénalité auto" : "Pénalité due"}
                          </Badge>
                        ) : isCollectedPenaltyOnly ? (
                          <Badge
                            variant="secondary"
                            className="bg-amber-100 text-amber-700 hover:bg-amber-100"
                          >
                            Pénalité payée
                          </Badge>
                        ) : payment.penalite_appliquee ? (
                          <Badge
                            variant="secondary"
                            className="bg-amber-100 text-amber-700 hover:bg-amber-100"
                          >
                            {showMember ? "Retard" : "En retard"}
                          </Badge>
                        ) : (
                          <Badge
                            variant="secondary"
                            className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                          >
                            À l'heure
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-gray-400 hover:bg-rose-50 hover:text-rose-600"
                          onClick={() =>
                            historyVisibility.hide(
                              payment.id_cotisation,
                              "Ligne masquée de votre historique.",
                            )
                          }
                          aria-label="Masquer cette ligne"
                          title="Masquer cette ligne"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {showSummary && !allHistoryHidden && visiblePayments.length > 0 ? (
        <div className="flex flex-wrap gap-4 rounded-lg border border-gray-100 bg-gray-50 p-3 text-sm">
          <span>
            <span className="font-medium text-gray-700">Total versé : </span>
            <span className="font-bold text-emerald-600">
              {visiblePayments.reduce((acc, p) => acc + p.montant, 0).toLocaleString("fr-FR")}{" "}
              {devise}
            </span>
          </span>
          <span>
            <span className="font-medium text-gray-700">Pénalités : </span>
            <span className="font-bold text-amber-600">
              {visiblePayments
                .reduce((acc, p) => acc + (p.montant_penalite ?? 0), 0)
                .toLocaleString("fr-FR")}{" "}
              {devise}
            </span>
          </span>
          <span>
            <span className="font-medium text-gray-700">Nb de versements : </span>
            <span className="font-bold text-gray-900">{visiblePayments.length}</span>
          </span>
        </div>
      ) : null}
    </div>
  );
}
