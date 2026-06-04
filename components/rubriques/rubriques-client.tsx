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

type Props = {
  groupId: string;
  rubriques: any[];
  members: any[];
  isAdmin: boolean;
  adminId: string;
};

function getMemberBalance(rubrique: any, membreId: string) {
  const due = parseFloat(rubrique.montant_fixe);
  const paid = rubrique.paiements
    .filter((p: any) => p.id_membre_groupe === membreId)
    .reduce((acc: number, p: any) => acc + parseFloat(p.montant_paye), 0);
  return Math.max(0, Math.round((due - paid) * 100) / 100);
}

export function RubriquesClient({
  groupId,
  rubriques,
  members,
  isAdmin,
  adminId,
}: Props) {
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

  const selectedRubrique = rubriques.find((r) => r.id_rubrique === selectedRubriqueId);

  const memberReste = selectedRubrique ? getMemberBalance(selectedRubrique, adminId) : 0;

  React.useEffect(() => {
    if (!isAdmin && tab === "historique") {
      setTab("solde");
    }
  }, [isAdmin, tab]);

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
            className="pl-8 h-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex-1 overflow-y-auto space-y-1">
          {filteredRubriques.map((rubrique) => (
            <button
              key={rubrique.id_rubrique}
              onClick={() => setSelectedRubriqueId(rubrique.id_rubrique)}
              className={cn(
                "flex w-full flex-col items-start gap-1 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-accent",
                selectedRubriqueId === rubrique.id_rubrique
                  ? "bg-accent text-accent-foreground shadow-sm"
                  : "text-muted-foreground",
              )}
            >
              <div className="flex w-full items-center justify-between">
                <span className="font-medium text-foreground">{rubrique.nom}</span>
                {rubrique.est_obligatoire && (
                  <div className="h-1.5 w-1.5 rounded-full bg-brand-600" />
                )}
              </div>
              <span className="text-xs truncate">{rubrique.montant_fixe} XAF</span>
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
          ))}
          {filteredRubriques.length === 0 && (
            <p className="text-center text-xs text-muted-foreground py-4">Aucune rubrique</p>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2">
        {selectedRubrique && planningRubrique ? (
          <div className="space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-3xl font-bold tracking-tight">{selectedRubrique.nom}</h1>
                  <Badge variant={selectedRubrique.est_obligatoire ? "default" : "secondary"}>
                    {selectedRubrique.est_obligatoire ? "Obligatoire" : "Facultative"}
                  </Badge>
                </div>
                <p className="text-muted-foreground mt-1">
                  {isAdmin
                    ? "Gestion et suivi de la rubrique de cotisation"
                    : "Votre situation sur cette rubrique"}
                </p>
              </div>
              {isAdmin && (
                <div className="flex flex-wrap gap-2 shrink-0">
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
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            <RubriquePlanningBanner
              rubrique={planningRubrique}
              resteAPayer={isAdmin ? 0 : memberReste}
            />

            {isAdmin && (
              <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-green-50/50 border-green-100 dark:bg-green-900/10 dark:border-green-900/20 shadow-none">
                  <CardHeader className="pb-2 px-4">
                    <CardDescription className="text-green-600 dark:text-green-400 font-semibold uppercase text-xs">
                      Fonds Collectés
                    </CardDescription>
                    <CardTitle className="text-2xl">
                      {totalCollected.toLocaleString()} XAF
                    </CardTitle>
                  </CardHeader>
                </Card>
                <Card className="bg-red-50/50 border-red-100 dark:bg-red-900/10 dark:border-red-900/20 shadow-none">
                  <CardHeader className="pb-2 px-4">
                    <CardDescription className="text-red-600 dark:text-red-400 font-semibold uppercase text-xs">
                      Total Retraits
                    </CardDescription>
                    <CardTitle className="text-2xl">
                      {totalWithdrawn.toLocaleString()} XAF
                    </CardTitle>
                  </CardHeader>
                </Card>
                <Card className="bg-brand-50/50 border-brand-100 dark:bg-brand-900/10 dark:border-brand-900/20 shadow-none">
                  <CardHeader className="pb-2 px-4">
                    <CardDescription className="text-brand-600 dark:text-brand-400 font-semibold uppercase text-xs">
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
                        ? "text-primary border-b-2 border-primary pb-2 -mb-2.5"
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
                          ? "text-primary border-b-2 border-primary pb-2 -mb-2.5"
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
              </div>

              {tab === "solde" ? (
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
                            .reduce(
                              (acc: number, p: any) => acc + parseFloat(p.montant_paye),
                              0,
                            );
                          const balance = due - paid;

                          return (
                            <TableRow key={mc.id_membre_rubrique}>
                              <TableCell className="font-medium">
                                {mc.membre.user.prenom} {mc.membre.user.nom}
                                {mc.membre.id_membre_groupe === adminId && (
                                  <Badge variant="outline" className="ml-2 text-[10px] h-4">
                                    Vous
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>{due.toLocaleString()} XAF</TableCell>
                              <TableCell className="text-green-600 font-medium">
                                {paid.toLocaleString()} XAF
                              </TableCell>
                              <TableCell
                                className={
                                  balance > 0 ? "text-red-500 font-bold" : "text-muted-foreground"
                                }
                              >
                                {balance > 0 ? `${balance.toLocaleString()} XAF` : "0 XAF"}
                              </TableCell>
                              <TableCell className="text-right">
                                {balance <= 0 ? (
                                  <Badge className="bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/10">
                                    À jour
                                  </Badge>
                                ) : (
                                  <Badge
                                    variant="destructive"
                                    className="bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/10"
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
              ) : (
                <div className="space-y-3">
                  {[...selectedRubrique.paiements, ...(selectedRubrique.retraits ?? [])]
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
                          className="flex items-center justify-between p-4 border rounded-xl bg-card hover:shadow-sm transition-shadow"
                        >
                          <div className="flex items-center gap-4">
                            <div
                              className={cn(
                                "p-2.5 rounded-full",
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
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
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
                    })}
                  {[...selectedRubrique.paiements, ...selectedRubrique.retraits].length ===
                    0 && (
                    <div className="text-center py-12 border-2 border-dashed rounded-xl">
                      <History className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-20" />
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
              <LayoutDashboard className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
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
              La rubrique « {selectedRubrique?.nom} » et toutes les données associées
              (paiements, retraits liés) seront définitivement supprimées. Cette action est
              irréversible.
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
