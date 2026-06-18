"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
  Banknote,
  History,
  Pencil,
  Calendar,
  LayoutDashboard,
  Search,
  Download,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { deleteRubrique, relaunchRubrique } from "@/lib/actions/rubriques";
import { RubriqueAssistant } from "./rubrique-assistant";
import { EditRubriqueForm } from "./edit-rubrique-form";
import { PaiementForm } from "./paiement-form";
import { RetraitForm } from "./retrait-form";
import { RubriquePlanningBanner } from "./rubrique-planning-banner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { FrequenceRubrique, TypeRubriqueCotisation } from "@/lib/rubrique-dates";
import { useHistoryVisibility } from "@/hooks/use-history-visibility";

type Props = {
  groupId: string;
  rubriques: any[];
  members: any[];
  isAdmin: boolean;
  adminId: string;
  memberTelephone?: string;
};

function getMemberBalance(rubrique: any, membreId: string) {
  const due = parseFloat(rubrique.montant_fixe);
  const paid = rubrique.paiements
    .filter((p: any) => p.id_membre_groupe === membreId)
    .reduce((acc: number, p: any) => acc + parseFloat(p.montant_paye), 0);
  return Math.max(0, Math.round((due - paid) * 100) / 100);
}

export function RubriquesClient({ groupId, rubriques, members, isAdmin, adminId, memberTelephone }: Props) {
  const router = useRouter();
  const [selectedRubriqueId, setSelectedRubriqueId] = React.useState<string | null>(
    rubriques.length > 0 ? rubriques[0].id_rubrique : null,
  );
  const [showAssistant, setShowAssistant] = React.useState(false);
  const [showEdit, setShowEdit] = React.useState(false);
  const [showPaiement, setShowPaiement] = React.useState(false);
  const [showRetrait, setShowRetrait] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [tab, setTab] = React.useState<"solde" | "historique">("solde");
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [relaunching, setRelaunching] = React.useState(false);
  const historyVisibility = useHistoryVisibility(`rubriques:${groupId}:historique`);

  const selectedRubrique = rubriques.find((r) => r.id_rubrique === selectedRubriqueId);
  const isSelectedHistoryHidden = selectedRubriqueId
    ? historyVisibility.isHidden(selectedRubriqueId)
    : false;

  const memberReste = selectedRubrique ? getMemberBalance(selectedRubrique, adminId) : 0;

  React.useEffect(() => {
    if (!isAdmin && tab === "historique") {
      setTab("solde");
    }
  }, [isAdmin, tab]);

  const hideSelectedHistory = () => {
    if (!selectedRubriqueId) return;
    historyVisibility.hide(selectedRubriqueId, "Historique masqué pour cette rubrique.");
  };

  const restoreSelectedHistory = () => {
    if (!selectedRubriqueId) return;
    historyVisibility.restore(selectedRubriqueId, "Historique réaffiché.");
  };

  const requestDeleteRubrique = (rubriqueId: string) => {
    setSelectedRubriqueId(rubriqueId);
    setShowDeleteConfirm(true);
  };

  const filteredRubriques = rubriques.filter((r) =>
    r.nom.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const totalCollected = selectedRubrique
    ? selectedRubrique.paiements.reduce(
        (acc: number, p: any) => acc + parseFloat(p.montant_paye),
        0,
      )
    : 0;
  const totalWithdrawn = selectedRubrique
    ? (selectedRubrique.retraits ?? []).reduce(
        (acc: number, r: any) => acc + parseFloat(r.montant),
        0,
      )
    : 0;
  const currentBalance = totalCollected - totalWithdrawn;
  const canRelaunch =
    !!selectedRubrique?.date_fin && new Date(selectedRubrique.date_fin) < new Date();

  const exportToCSV = () => {
    if (!selectedRubrique) return;
    const headers = ["Membre", "Montant Dû", "Montant Payé", "Reste à payer"];
    const rows = selectedRubrique.membres_concernes.map((mc: any) => {
      const due = parseFloat(selectedRubrique.montant_fixe);
      const paid = selectedRubrique.paiements
        .filter((p: any) => p.id_membre_groupe === mc.id_membre_groupe)
        .reduce((acc: number, p: any) => acc + parseFloat(p.montant_paye), 0);
      const balance = due - paid;
      return [
        `${mc.membre.user.prenom} ${mc.membre.user.nom}`,
        due.toString(),
        paid.toString(),
        balance.toString(),
      ];
    });

    const csvContent = [headers, ...rows].map((e) => e.join(",")).join("\n");
    const encodedUri = "data:text/csv;charset=utf-8," + encodeURIComponent(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `etat_cotisation_${selectedRubrique.nom}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteRubrique = async () => {
    if (!selectedRubrique || deleting) return;
    setDeleting(true);
    try {
      const result = await deleteRubrique(selectedRubrique.id_rubrique, groupId);
      if (!result.ok) {
        toast.error(result.error ?? "Impossible de supprimer la rubrique.");
        return;
      }
      const remaining = rubriques.filter((r) => r.id_rubrique !== selectedRubrique.id_rubrique);
      setSelectedRubriqueId(remaining.length > 0 ? remaining[0].id_rubrique : null);
      setShowDeleteConfirm(false);
      toast.success("Rubrique et historique supprimés.");
      router.refresh();
    } finally {
      setDeleting(false);
    }
  };

  const handleRelaunchRubrique = async () => {
    if (!selectedRubrique || relaunching) return;
    setRelaunching(true);
    try {
      const result = await relaunchRubrique(selectedRubrique.id_rubrique, groupId);
      if (!result.ok) {
        toast.error(result.error ?? "Impossible de relancer la rubrique.");
        return;
      }
      setSelectedRubriqueId(result.rubrique.id_rubrique);
      toast.success("Rubrique relancée.");
      router.refresh();
    } finally {
      setRelaunching(false);
    }
  };

  const planningRubrique = selectedRubrique
    ? {
        type_rubrique: selectedRubrique.type_rubrique as TypeRubriqueCotisation,
        frequence: selectedRubrique.frequence as FrequenceRubrique,
        date_debut: selectedRubrique.date_debut,
        duree_jours: selectedRubrique.duree_jours,
        date_limite: selectedRubrique.date_limite,
        date_fin: selectedRubrique.date_fin,
      }
    : null;

  return (
    <div className="flex min-h-[28rem] flex-col gap-6 lg:flex-row lg:items-stretch">
      <div className="flex w-full shrink-0 flex-col gap-4 border-b pb-6 lg:w-64 lg:border-b-0 lg:border-r lg:pr-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Rubriques</h2>
          {isAdmin && (
            <Button size="icon" variant="ghost" onClick={() => setShowAssistant(true)}>
              <Plus className="h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher..."
            className="h-9 pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex-1 space-y-1 overflow-y-auto">
          {filteredRubriques.map((rubrique) => (
            <div
              key={rubrique.id_rubrique}
              className={cn(
                "group flex items-start gap-1 rounded-lg transition-colors hover:bg-accent",
                selectedRubriqueId === rubrique.id_rubrique
                  ? "bg-accent text-accent-foreground shadow-sm"
                  : "text-muted-foreground",
              )}
            >
              <button
                type="button"
                onClick={() => setSelectedRubriqueId(rubrique.id_rubrique)}
                className="min-w-0 flex-1 px-3 py-2 text-left text-sm"
              >
                <div className="flex w-full items-center justify-between">
                  <span className="truncate font-medium text-foreground">{rubrique.nom}</span>
                  {rubrique.est_obligatoire && (
                    <div className="ml-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-600" />
                  )}
                </div>
                <span className="truncate text-xs">{rubrique.montant_fixe} XAF</span>
                <RubriquePlanningBanner
                  rubrique={{
                    type_rubrique: rubrique.type_rubrique,
                    frequence: rubrique.frequence,
                    date_debut: rubrique.date_debut,
                    duree_jours: rubrique.duree_jours,
                    date_limite: rubrique.date_limite,
                    date_fin: rubrique.date_fin,
                  }}
                  compact
                />
              </button>
              {isAdmin ? (
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="mr-1 mt-1 h-8 w-8 shrink-0 text-red-500 hover:bg-red-50 hover:text-red-600"
                  onClick={() => requestDeleteRubrique(rubrique.id_rubrique)}
                  aria-label={`Supprimer la rubrique ${rubrique.nom}`}
                  title="Supprimer la rubrique"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              ) : null}
            </div>
          ))}
          {filteredRubriques.length === 0 && (
            <p className="py-4 text-center text-xs text-muted-foreground">Aucune rubrique</p>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2">
        {selectedRubrique && planningRubrique ? (
          <div className="space-y-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-3xl font-bold tracking-tight">{selectedRubrique.nom}</h1>
                  <Badge variant={selectedRubrique.est_obligatoire ? "default" : "secondary"}>
                    {selectedRubrique.est_obligatoire ? "Obligatoire" : "Facultative"}
                  </Badge>
                </div>
                <p className="mt-1 text-muted-foreground">
                  {isAdmin
                    ? "Gestion et suivi de la rubrique de cotisation"
                    : "Votre situation sur cette rubrique"}
                </p>
              </div>
              {isAdmin && (
                <div className="grid w-full gap-2 sm:grid-cols-2 xl:flex xl:w-auto xl:shrink-0 xl:grid-cols-none xl:flex-wrap">
                  {canRelaunch ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRelaunchRubrique}
                      disabled={relaunching}
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      {relaunching ? "Relance..." : "Relancer"}
                    </Button>
                  ) : null}
                  <Button variant="outline" size="sm" onClick={() => setShowEdit(true)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Modifier
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setShowRetrait(true)}>
                    <History className="mr-2 h-4 w-4" />
                    Retrait
                  </Button>
                </div>
              )}
            </div>

            <RubriquePlanningBanner
              rubrique={planningRubrique}
              resteAPayer={isAdmin ? 0 : memberReste}
              groupId={!isAdmin ? groupId : undefined}
              rubriqueId={!isAdmin && selectedRubriqueId ? selectedRubriqueId : undefined}
              memberTelephone={memberTelephone}
            />

            {isAdmin && (
              <div className="grid gap-4 md:grid-cols-3">
                <Card className="border-green-100 bg-green-50/50 shadow-none dark:border-green-900/20 dark:bg-green-900/10">
                  <CardHeader className="px-4 pb-2">
                    <CardDescription className="text-xs font-semibold uppercase text-green-600 dark:text-green-400">
                      Fonds Collectés
                    </CardDescription>
                    <CardTitle className="text-2xl">
                      {totalCollected.toLocaleString()} XAF
                    </CardTitle>
                  </CardHeader>
                </Card>
                <Card className="border-red-100 bg-red-50/50 shadow-none dark:border-red-900/20 dark:bg-red-900/10">
                  <CardHeader className="px-4 pb-2">
                    <CardDescription className="text-xs font-semibold uppercase text-red-600 dark:text-red-400">
                      Total Retraits
                    </CardDescription>
                    <CardTitle className="text-2xl">
                      {totalWithdrawn.toLocaleString()} XAF
                    </CardTitle>
                  </CardHeader>
                </Card>
                <Card className="border-brand-100 bg-brand-50/50 shadow-none dark:border-brand-900/20 dark:bg-brand-900/10">
                  <CardHeader className="px-4 pb-2">
                    <CardDescription className="text-xs font-semibold uppercase text-brand-600 dark:text-brand-400">
                      Solde Disponible
                    </CardDescription>
                    <CardTitle className="text-2xl">
                      {currentBalance.toLocaleString()} XAF
                    </CardTitle>
                  </CardHeader>
                </Card>
              </div>
            )}

            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <div className="flex gap-4">
                  <button
                    onClick={() => setTab("solde")}
                    className={cn(
                      "text-sm font-medium transition-colors hover:text-primary",
                      tab === "solde"
                        ? "-mb-2.5 border-b-2 border-primary pb-2 text-primary"
                        : "text-muted-foreground",
                    )}
                  >
                    Soldes
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => setTab("historique")}
                      className={cn(
                        "text-sm font-medium transition-colors hover:text-primary",
                        tab === "historique"
                          ? "-mb-2.5 border-b-2 border-primary pb-2 text-primary"
                          : "text-muted-foreground",
                      )}
                    >
                      Historique
                    </button>
                  )}
                </div>
                {isAdmin && tab === "solde" && (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={exportToCSV}>
                      <Download className="mr-2 h-4 w-4" />
                      Exporter
                    </Button>
                    <Button size="sm" onClick={() => setShowPaiement(true)}>
                      <Banknote className="mr-2 h-4 w-4" />
                      Payer
                    </Button>
                  </div>
                )}
                {tab === "historique" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={isSelectedHistoryHidden ? restoreSelectedHistory : hideSelectedHistory}
                  >
                    {isSelectedHistoryHidden ? (
                      <RotateCcw className="mr-2 h-4 w-4" />
                    ) : (
                      <Trash2 className="mr-2 h-4 w-4" />
                    )}
                    {isSelectedHistoryHidden ? "Restaurer l'historique" : "Supprimer l'historique"}
                  </Button>
                )}
              </div>

              {tab === "solde" ? (
                <div className="space-y-4">
                  <div className="rounded-md border bg-card">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Membre</TableHead>
                          <TableHead>Dû</TableHead>
                          <TableHead>Payé</TableHead>
                          <TableHead>Reste</TableHead>
                          <TableHead className="text-right">Statut</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedRubrique.membres_concernes
                          .filter((mc: any) =>
                            !isAdmin ? mc.membre.id_membre_groupe === adminId : true,
                          )
                          .map((mc: any) => {
                            const due = parseFloat(selectedRubrique.montant_fixe);
                            const paid = selectedRubrique.paiements
                              .filter((p: any) => p.id_membre_groupe === mc.id_membre_groupe)
                              .reduce((acc: number, p: any) => acc + parseFloat(p.montant_paye), 0);
                            const balance = due - paid;

                            return (
                              <TableRow key={mc.id_membre_rubrique}>
                                <TableCell className="font-medium">
                                  {mc.membre.user.prenom} {mc.membre.user.nom}
                                  {mc.membre.id_membre_groupe === adminId && (
                                    <Badge variant="outline" className="ml-2 h-4 text-[10px]">
                                      Vous
                                    </Badge>
                                  )}
                                </TableCell>
                                <TableCell>{due.toLocaleString()} XAF</TableCell>
                                <TableCell className="font-medium text-green-600">
                                  {paid.toLocaleString()} XAF
                                </TableCell>
                                <TableCell
                                  className={
                                    balance > 0 ? "font-bold text-red-500" : "text-muted-foreground"
                                  }
                                >
                                  {balance > 0 ? `${balance.toLocaleString()} XAF` : "0 XAF"}
                                </TableCell>
                                <TableCell className="text-right">
                                  {balance <= 0 ? (
                                    <Badge className="border-green-500/20 bg-green-500/10 text-green-500 hover:bg-green-500/10">
                                      À jour
                                    </Badge>
                                  ) : (
                                    <Badge
                                      variant="destructive"
                                      className="border-red-500/20 bg-red-500/10 text-red-500 hover:bg-red-500/10"
                                    >
                                      Incomplet
                                    </Badge>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Détail des versements avec dates — visible par le membre pour traçabilité */}
                  {(() => {
                    const myPayments = selectedRubrique.paiements.filter(
                      (p: any) => p.id_membre_groupe === adminId,
                    );
                    if (myPayments.length === 0) return null;
                    return (
                      <div className="space-y-3 rounded-xl border bg-card p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Historique de mes versements
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={
                              isSelectedHistoryHidden ? restoreSelectedHistory : hideSelectedHistory
                            }
                          >
                            {isSelectedHistoryHidden ? (
                              <RotateCcw className="mr-2 h-4 w-4" />
                            ) : (
                              <Trash2 className="mr-2 h-4 w-4" />
                            )}
                            {isSelectedHistoryHidden
                              ? "Restaurer l'historique"
                              : "Supprimer l'historique"}
                          </Button>
                        </div>
                        {isSelectedHistoryHidden ? (
                          <div className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
                            Historique masqué pour cette rubrique.
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {myPayments
                              .slice()
                              .sort(
                                (a: any, b: any) =>
                                  new Date(b.date_paiement).getTime() -
                                  new Date(a.date_paiement).getTime(),
                              )
                              .map((p: any, idx: number) => (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between rounded-lg border bg-green-50/40 px-4 py-2.5 dark:bg-green-900/10"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="rounded-full bg-green-100 p-1.5 dark:bg-green-900/30">
                                      <Calendar className="h-3.5 w-3.5 text-green-600" />
                                    </div>
                                    <div>
                                      <p className="text-xs font-medium text-foreground">
                                        {format(new Date(p.date_paiement), "PPP", { locale: fr })}
                                      </p>
                                      {p.note && (
                                        <p className="text-[11px] text-muted-foreground">
                                          {p.note}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  <p className="text-sm font-bold text-green-600">
                                    +{parseFloat(p.montant_paye).toLocaleString()} XAF
                                  </p>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div className="space-y-3">
                  {isSelectedHistoryHidden ? (
                    <div className="rounded-xl border-2 border-dashed py-12 text-center">
                      <History className="mx-auto mb-3 h-10 w-10 text-muted-foreground opacity-20" />
                      <p className="text-muted-foreground">
                        Historique masqué pour cette rubrique.
                      </p>
                    </div>
                  ) : (
                    [...selectedRubrique.paiements, ...(selectedRubrique.retraits ?? [])]
                      .sort(
                        (a, b) =>
                          new Date(b.date_paiement || b.date_retrait).getTime() -
                          new Date(a.date_paiement || a.date_retrait).getTime(),
                      )
                      .map((op: any, i) => {
                        const isRetrait = !!op.id_retrait;
                        const date = new Date(op.date_paiement || op.date_retrait);

                        return (
                          <div
                            key={i}
                            className="flex items-center justify-between rounded-xl border bg-card p-4 transition-shadow hover:shadow-sm"
                          >
                            <div className="flex items-center gap-4">
                              <div
                                className={cn(
                                  "rounded-full p-2.5",
                                  isRetrait
                                    ? "bg-red-50 text-red-600 dark:bg-red-900/20"
                                    : "bg-green-50 text-green-600 dark:bg-green-900/20",
                                )}
                              >
                                {isRetrait ? (
                                  <Download className="h-5 w-5 rotate-180" />
                                ) : (
                                  <Download className="h-5 w-5" />
                                )}
                              </div>
                              <div>
                                <p className="font-semibold">
                                  {isRetrait
                                    ? `Retrait : ${op.motif}`
                                    : `Paiement : ${op.membre.user.prenom} ${op.membre.user.nom}`}
                                </p>
                                <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                                  <Calendar className="h-3 w-3" />
                                  {format(date, "PPP", { locale: fr })}
                                  {op.note && <span>• {op.note}</span>}
                                </div>
                              </div>
                            </div>
                            <p
                              className={cn(
                                "text-lg font-bold",
                                isRetrait ? "text-red-600" : "text-green-600",
                              )}
                            >
                              {isRetrait ? "-" : "+"}
                              {parseFloat(op.montant_paye || op.montant).toLocaleString()} XAF
                            </p>
                          </div>
                        );
                      })
                  )}
                  {!isSelectedHistoryHidden &&
                    [...selectedRubrique.paiements, ...selectedRubrique.retraits].length === 0 && (
                      <div className="rounded-xl border-2 border-dashed py-12 text-center">
                        <History className="mx-auto mb-3 h-10 w-10 text-muted-foreground opacity-20" />
                        <p className="text-muted-foreground">Aucune transaction enregistrée</p>
                      </div>
                    )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <LayoutDashboard className="mx-auto mb-4 h-12 w-12 text-muted-foreground opacity-20" />
              <h3 className="text-lg font-medium">Sélectionnez une rubrique</h3>
              <p className="text-muted-foreground">
                Choisissez une rubrique dans la liste pour voir son dashboard.
              </p>
            </div>
          </div>
        )}
      </div>

      {showAssistant && (
        <RubriqueAssistant
          groupId={groupId}
          members={members}
          onClose={() => {
            setShowAssistant(false);
            router.refresh();
          }}
        />
      )}

      {showEdit && selectedRubrique && (
        <EditRubriqueForm
          groupId={groupId}
          rubrique={selectedRubrique}
          onClose={() => {
            setShowEdit(false);
            router.refresh();
          }}
        />
      )}

      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer cette rubrique ?</DialogTitle>
            <DialogDescription>
              La rubrique « {selectedRubrique?.nom} » et toutes les données associées (paiements,
              retraits liés) seront définitivement supprimées. Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={deleting}
            >
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDeleteRubrique} disabled={deleting}>
              {deleting ? "Suppression…" : "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {isAdmin && showPaiement && selectedRubriqueId && selectedRubrique && (
        <PaiementForm
          rubriqueId={selectedRubriqueId}
          groupId={groupId}
          montantFixe={parseFloat(selectedRubrique.montant_fixe)}
          paiements={selectedRubrique.paiements}
          members={members.filter((m) =>
            selectedRubrique.membres_concernes.some(
              (mc: any) => mc.id_membre_groupe === m.id_membre_groupe,
            ),
          )}
          onClose={() => setShowPaiement(false)}
        />
      )}

      {showRetrait && (
        <RetraitForm
          groupId={groupId}
          adminId={adminId}
          rubriques={rubriques}
          onClose={() => setShowRetrait(false)}
        />
      )}
    </div>
  );
}
