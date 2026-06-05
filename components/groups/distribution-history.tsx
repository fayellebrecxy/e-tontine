"use client";

import * as React from "react";

import { Badge } from "@/components/ui/badge";
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
}: DistributionHistoryProps) {
  const [page, setPage] = React.useState(1);
  const versementsParTour = new Map(versements.map((v) => [v.numero_tour, v]));
  const toursParNumero = new Map(tours.map((t) => [t.numero, t]));
  const rows = Array.from({ length: totalTours }, (_, i) => i + 1);
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
        <span className="text-xs text-muted-foreground">
          {toursVerses} / {totalTours} tours soldés
        </span>
      </div>

      {/* Résumé trésorerie */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="space-y-1">
          <p className="text-[10px] font-medium text-gray-500 uppercase">Tours soldés</p>
          <p className="text-xl font-bold text-emerald-600">
            {toursVerses} / {totalTours}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-medium text-gray-500 uppercase">Total distribué</p>
          <p className="text-xl font-bold text-brand-600">
            {totalDistribue.toLocaleString("fr-FR")} {devise}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-medium text-gray-500 uppercase">Progression</p>
          <p className="text-xl font-bold text-gray-900">
            {totalTours > 0 ? Math.round((toursVerses / totalTours) * 100) : 0}%
          </p>
        </div>
      </div>

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
                      : tourInfo?.beneficiaire ?? "—"}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {tourInfo
                      ? `${tourInfo.potCollecte.toLocaleString("fr-FR")} ${devise}`
                      : "—"}
                  </TableCell>
                  <TableCell className="font-medium">
                    {versement
                      ? `${Number(versement.montant_verse).toLocaleString("fr-FR")} ${devise}`
                      : "—"}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground">
                    {versement
                      ? new Date(versement.date_versement).toLocaleDateString("fr-FR")
                      : "—"}
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">
                    {versement?.mode_versement
                      ? MODE_LABELS[versement.mode_versement] ?? versement.mode_versement
                      : "—"}
                  </TableCell>
                  <TableCell>
                    {versement ? (
                      <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                        Soldé
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-100">
                        En attente
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 ? (
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

      {versements.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-4">
          Aucun versement enregistré pour ce cycle.
        </p>
      )}
    </div>
  );
}
