"use client";

import * as React from "react";
import { RotateCcw, Trash2, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useHistoryVisibility } from "@/hooks/use-history-visibility";

type VersementItem = {
  id_versement: string;
  numero_tour: number;
  montant_verse: number;
  date_versement: Date | string;
  mode_versement: string | null;
  reference_externe: string | null;
  beneficiaire: {
    id_membre_groupe: string;
    user: { nom: string; prenom: string };
  };
  valideur: {
    user: { nom: string; prenom: string };
  };
};

type TourInfo = {
  numero: number;
  beneficiaire: string;
  potCollecte: number;
};

type DistributionHistoryProps = {
  versements: VersementItem[];
  tours: TourInfo[];
  totalTours: number;
  devise: string;
  historyScope?: string;
  historyTargetId?: string;
};

const MODE_LABELS: Record<string, string> = {
  VIREMENT: "Virement",
  ESPECES: "Espèces",
  MOBILE_MONEY: "Mobile Money",
  CHEQUE: "Chèque",
};

const PAGE_SIZE = 6;

export function DistributionHistory({
  versements,
  tours,
  totalTours,
  devise,
  historyScope,
  historyTargetId,
}: DistributionHistoryProps) {
  const [page, setPage] = React.useState(1);
  const historyVisibility = useHistoryVisibility(historyScope ?? "distribution-history");
  const versementsParTour = new Map(versements.map((v) => [v.numero_tour, v]));
  const toursParNumero = new Map(tours.map((t) => [t.numero, t]));
  const allHistoryHidden = historyTargetId ? historyVisibility.isHidden(historyTargetId) : false;
  const rows = allHistoryHidden
    ? []
    : Array.from({ length: totalTours }, (_, i) => i + 1).filter((num) => {
        const versement = versementsParTour.get(num);
        return !versement || !historyVisibility.isHidden(versement.id_versement);
      });
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginatedRows = rows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const toursVerses = versements.length;
  const totalDistribue = versements.reduce((acc, v) => acc + Number(v.montant_verse), 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">
          Historique des versements aux bénéficiaires
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {toursVerses} / {totalTours} tours soldés
          </span>
          {historyTargetId ? (
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
              {allHistoryHidden ? "Restaurer" : "Tout masquer"}
            </Button>
          ) : null}
        </div>
      </div>

      {allHistoryHidden ? (
        <div className="rounded-xl border border-dashed border-gray-300 py-10 text-center text-sm text-muted-foreground">
          Historique masqué pour ce cycle.
        </div>
      ) : null}

      {/* Résumé trésorerie */}
      {!allHistoryHidden ? (
        <div className="grid grid-cols-2 gap-4 rounded-xl border border-gray-200 bg-white p-4 sm:grid-cols-3">
          <div className="space-y-1">
            <p className="text-[10px] font-medium uppercase text-gray-500">Tours soldés</p>
            <p className="text-xl font-bold text-emerald-600">
              {toursVerses} / {totalTours}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-medium uppercase text-gray-500">Total distribué</p>
            <p className="text-xl font-bold text-brand-600">
              {totalDistribue.toLocaleString("fr-FR")} {devise}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-medium uppercase text-gray-500">Progression</p>
            <p className="text-xl font-bold text-gray-900">
              {totalTours > 0 ? Math.round((toursVerses / totalTours) * 100) : 0}%
            </p>
          </div>
        </div>
      ) : null}

      {!allHistoryHidden ? (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tour</TableHead>
                <TableHead>Bénéficiaire</TableHead>
                <TableHead className="hidden md:table-cell">Pot collecté</TableHead>
                <TableHead>Montant versé</TableHead>
                <TableHead className="hidden sm:table-cell">Date</TableHead>
                <TableHead className="hidden md:table-cell">Mode</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedRows.map((num) => {
                const versement = versementsParTour.get(num);
                const tourInfo = toursParNumero.get(num);

                return (
                  <TableRow key={num}>
                    <TableCell className="font-medium">Tour {num}</TableCell>
                    <TableCell>
                      {versement
                        ? `${versement.beneficiaire.user.prenom} ${versement.beneficiaire.user.nom}`
                        : (tourInfo?.beneficiaire ?? "—")}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {tourInfo ? `${tourInfo.potCollecte.toLocaleString("fr-FR")} ${devise}` : "—"}
                    </TableCell>
                    <TableCell className="font-medium">
                      {versement
                        ? `${Number(versement.montant_verse).toLocaleString("fr-FR")} ${devise}`
                        : "—"}
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground sm:table-cell">
                      {versement
                        ? new Date(versement.date_versement).toLocaleDateString("fr-FR")
                        : "—"}
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">
                      {versement?.mode_versement
                        ? (MODE_LABELS[versement.mode_versement] ?? versement.mode_versement)
                        : "—"}
                    </TableCell>
                    <TableCell>
                      {versement ? (
                        <Badge
                          variant="secondary"
                          className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                        >
                          Soldé
                        </Badge>
                      ) : (
                        <Badge
                          variant="secondary"
                          className="bg-amber-100 text-amber-700 hover:bg-amber-100"
                        >
                          En attente
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {versement ? (
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-gray-400 hover:bg-rose-50 hover:text-rose-600"
                          onClick={() =>
                            historyVisibility.hide(
                              versement.id_versement,
                              "Ligne masquée de votre historique.",
                            )
                          }
                          aria-label="Masquer cette ligne"
                          title="Masquer cette ligne"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      ) : null}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : null}

      {!allHistoryHidden && totalPages > 1 ? (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={safePage === 1}
              />
            </PaginationItem>
            {Array.from({ length: totalPages }, (_, index) => index + 1).map((item) => (
              <PaginationItem key={item}>
                <PaginationLink isActive={safePage === item} onClick={() => setPage(item)}>
                  {item}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                disabled={safePage === totalPages}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      ) : null}

      {!allHistoryHidden && rows.length === 0 && (
        <p className="py-4 text-center text-sm text-muted-foreground">
          Aucun versement visible pour ce cycle.
        </p>
      )}
    </div>
  );
}
