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

type TourDetail = {
  tourNum: number;
  dueDate: Date | string;
  paidAmount: number;
  penaltiesAmount: number;
  isOverdue: boolean;
  daysLate: number;
  isComplete: boolean;
};

type ParticipantStat = {
  id: string;
  name: string;
  email: string;
  totalPaid: number;
  totalPenalties: number;
  totalDaysLate: number;
  isLate: boolean;
  isIncomplete: boolean;
  hasActivePenalty: boolean;
  montantInitial: number;
  tourDetails: TourDetail[];
};

type CycleParticipantsTableProps = {
  participants: ParticipantStat[];
  devise: string;
};

const PAGE_SIZE = 6;

export function CycleParticipantsTable({ participants, devise }: CycleParticipantsTableProps) {
  const [page, setPage] = React.useState(1);
  const totalPages = Math.max(1, Math.ceil(participants.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = participants.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Participant</TableHead>
              <TableHead className="hidden md:table-cell">Total dû</TableHead>
              <TableHead>Total versé</TableHead>
              <TableHead className="hidden sm:table-cell">Pénalités</TableHead>
              <TableHead>Statut</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                  Aucun participant dans ce cycle.
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((participant) => {
                const totalDue = participant.montantInitial + participant.totalPenalties;

                return (
                  <TableRow key={participant.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium text-gray-900 dark:text-white">{participant.name}</p>
                        <p className="text-xs text-muted-foreground">{participant.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {totalDue.toLocaleString("fr-FR")} {devise}
                    </TableCell>
                    <TableCell className="font-medium text-emerald-600">
                      {participant.totalPaid.toLocaleString("fr-FR")} {devise}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-amber-600">
                      {participant.totalPenalties.toLocaleString("fr-FR")} {devise}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1.5">
                        {participant.isLate ? (
                          <Badge variant="secondary" className="bg-rose-100 text-rose-700 hover:bg-rose-100">
                            Retard {participant.totalDaysLate}j
                          </Badge>
                        ) : null}
                        {participant.hasActivePenalty ? (
                          <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-100">
                            Pénalité
                          </Badge>
                        ) : null}
                        {participant.isIncomplete ? (
                          <Badge variant="secondary" className="bg-orange-100 text-orange-700 hover:bg-orange-100">
                            Incomplet
                          </Badge>
                        ) : null}
                        {!participant.isLate && !participant.isIncomplete ? (
                          <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                            À jour
                          </Badge>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
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
    </div>
  );
}
