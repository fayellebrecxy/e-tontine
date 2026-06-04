"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, Trash2, Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { CreateCycleForm } from "@/components/groups/create-cycle-form";

type CycleItem = {
  id_cycle: string;
  nom_cycle: string;
  date_debut: string;
  date_fin: string;
  duree_tour_de_gain: number;
  montant_cotisation: number;
  participants: { id_membre_groupe: string }[];
};

type CyclesTableProps = {
  groupId: string;
  cycles: CycleItem[];
  isAdmin: boolean;
  devise: string;
  statusFilter?: string;
};

const PAGE_SIZE = 8;

function getCycleStatus(cycle: CycleItem) {
  const now = new Date();
  const debut = new Date(cycle.date_debut);
  const fin = new Date(cycle.date_fin);
  if (now < debut) return "upcoming";
  if (now > fin) return "closed";
  return "active";
}

export function CyclesTable({ groupId, cycles, isAdmin, devise, statusFilter }: CyclesTableProps) {
  const router = useRouter();
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [page, setPage] = React.useState(1);

  const filtered = cycles.filter((c) => {
    if (statusFilter === "active") return getCycleStatus(c) === "active";
    if (statusFilter === "closed") return getCycleStatus(c) === "closed";
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleDelete = async (cycleId: string, nom: string) => {
    if (!confirm(`Supprimer le cycle "${nom}" ? Cette action est irréversible.`)) return;
    setDeletingId(cycleId);
    try {
      const res = await fetch(`/api/groups/${groupId}/cycles/${cycleId}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        toast.error(body?.error ?? "Erreur lors de la suppression.");
        return;
      }
      toast.success("Cycle supprimé.");
      router.refresh();
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Barre d'actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {filtered.length} cycle{filtered.length !== 1 ? "s" : ""}
        </p>
        {isAdmin && (
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button size="sm" className="gap-1.5">
                <Plus className="h-4 w-4" />
                Nouveau cycle
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full max-w-xl overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Créer un cycle</SheetTitle>
              </SheetHeader>
              <div className="mt-4">
                <CreateCycleForm
                  groupId={groupId}
                  canManage={true}
                  onSuccess={() => {
                    setSheetOpen(false);
                    router.refresh();
                  }}
                />
              </div>
            </SheetContent>
          </Sheet>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden dark:border-gray-800 dark:bg-gray-900">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead className="hidden sm:table-cell">Début</TableHead>
              <TableHead className="hidden sm:table-cell">Fin</TableHead>
              <TableHead className="hidden md:table-cell">Participants</TableHead>
              <TableHead className="hidden md:table-cell">Cotisation / tour</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-muted-foreground text-sm">
                  {statusFilter === "active"
                    ? "Aucun cycle en cours."
                    : statusFilter === "closed"
                    ? "Aucun cycle terminé."
                    : "Aucun cycle pour le moment."}
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((cycle) => {
                const status = getCycleStatus(cycle);
                return (
                  <TableRow key={cycle.id_cycle}>
                    <TableCell className="font-medium">{cycle.nom_cycle}</TableCell>
                    <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                      {new Date(cycle.date_debut).toLocaleDateString("fr-FR")}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                      {new Date(cycle.date_fin).toLocaleDateString("fr-FR")}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm">
                      {cycle.participants.length}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm">
                      {Number(cycle.montant_cotisation).toLocaleString("fr-FR")} {devise}
                    </TableCell>
                    <TableCell>
                      {status === "active" ? (
                        <Badge variant="default" className="bg-brand-100 text-brand-700 hover:bg-brand-100">
                          En cours
                        </Badge>
                      ) : status === "closed" ? (
                        <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                          Terminé
                        </Badge>
                      ) : (
                        <Badge variant="outline">À venir</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button asChild variant="ghost" size="icon" title="Voir détails">
                          <Link href={`/dashboard/groups/${groupId}/cycles/${cycle.id_cycle}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        {isAdmin && (
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Supprimer"
                            disabled={deletingId === cycle.id_cycle}
                            onClick={() => handleDelete(cycle.id_cycle, cycle.nom_cycle)}
                          >
                            {deletingId === cycle.id_cycle ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4 text-rose-500" />
                            )}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              />
            </PaginationItem>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <PaginationItem key={p}>
                <PaginationLink isActive={p === page} onClick={() => setPage(p)}>
                  {p}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
