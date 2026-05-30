"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, History, Users } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

type Props = {
  rubrique: any;
  onClose: () => void;
};

export function RubriqueDetails({ rubrique, onClose }: Props) {
  const [tab, setTab] = React.useState<"solde" | "historique">("solde");

  const totalCollected = rubrique.paiements.reduce(
    (acc: number, p: any) => acc + parseFloat(p.montant_paye),
    0
  );
  const totalWithdrawn = rubrique.retraits.reduce(
    (acc: number, r: any) => acc + parseFloat(r.montant),
    0
  );
  const currentBalance = totalCollected - totalWithdrawn;

  const exportToCSV = () => {
    const headers = ["Membre", "Montant Dû", "Montant Payé", "Reste à payer"];
    const rows = rubrique.membres_concernes.map((mc: any) => {
      const due = rubrique.type_montant === "FIXE" ? parseFloat(rubrique.montant_fixe) : 0;
      const paid = rubrique.paiements
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
    link.setAttribute("download", `etat_cotisation_${rubrique.nom}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Détails : {rubrique.nom}</span>
            <Button variant="outline" size="sm" onClick={exportToCSV}>
              <Download className="mr-2 h-4 w-4" />
              Exporter CSV
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-4 py-4">
          <div className="rounded-lg border p-3 bg-green-50 dark:bg-green-900/20">
            <p className="text-xs text-green-600 dark:text-green-400 font-semibold uppercase">Collecté</p>
            <p className="text-xl font-bold">{totalCollected.toLocaleString()} XAF</p>
          </div>
          <div className="rounded-lg border p-3 bg-red-50 dark:bg-red-900/20">
            <p className="text-xs text-red-600 dark:text-red-400 font-semibold uppercase">Retiré</p>
            <p className="text-xl font-bold">{totalWithdrawn.toLocaleString()} XAF</p>
          </div>
          <div className="rounded-lg border p-3 bg-blue-50 dark:bg-blue-900/20">
            <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold uppercase">Solde Caisse</p>
            <p className="text-xl font-bold">{currentBalance.toLocaleString()} XAF</p>
          </div>
        </div>

        <div className="flex border-b mb-4">
          <button
            className={`px-4 py-2 text-sm font-medium ${
              tab === "solde" ? "border-b-2 border-brand-600 text-brand-600" : "text-gray-500"
            }`}
            onClick={() => setTab("solde")}
          >
            <Users className="inline-block mr-2 h-4 w-4" />
            Soldes par membre
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium ${
              tab === "historique" ? "border-b-2 border-brand-600 text-brand-600" : "text-gray-500"
            }`}
            onClick={() => setTab("historique")}
          >
            <History className="inline-block mr-2 h-4 w-4" />
            Historique des transactions
          </button>
        </div>

        {tab === "solde" && (
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Membre</TableHead>
                  <TableHead>Dû</TableHead>
                  <TableHead>Payé</TableHead>
                  <TableHead>Reste</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rubrique.membres_concernes.map((mc: any) => {
                  const due = rubrique.type_montant === "FIXE" ? parseFloat(rubrique.montant_fixe) : 0;
                  const paid = rubrique.paiements
                    .filter((p: any) => p.id_membre_groupe === mc.id_membre_groupe)
                    .reduce((acc: number, p: any) => acc + parseFloat(p.montant_paye), 0);
                  const balance = due - paid;
                  
                  return (
                    <TableRow key={mc.id_membre_rubrique}>
                      <TableCell className="font-medium">
                        {mc.membre.user.prenom} {mc.membre.user.nom}
                      </TableCell>
                      <TableCell>{due > 0 ? `${due.toLocaleString()}` : "-"}</TableCell>
                      <TableCell className="text-green-600 font-semibold">
                        {paid.toLocaleString()}
                      </TableCell>
                      <TableCell className={balance > 0 ? "text-red-500 font-bold" : "text-gray-400"}>
                        {balance > 0 ? balance.toLocaleString() : "0"}
                      </TableCell>
                      <TableCell>
                        {due > 0 ? (
                          balance <= 0 ? (
                            <Badge className="bg-green-500">À jour</Badge>
                          ) : (
                            <Badge variant="destructive">Incomplet</Badge>
                          )
                        ) : (
                          <Badge variant="outline">Variable</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {tab === "historique" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Dernières opérations</h4>
              {[...rubrique.paiements, ...rubrique.retraits]
                .sort((a, b) => new Date(b.date_paiement || b.date_retrait).getTime() - new Date(a.date_paiement || a.date_retrait).getTime())
                .map((op: any, i) => {
                  const isRetrait = !!op.id_retrait;
                  const date = new Date(op.date_paiement || op.date_retrait);
                  
                  return (
                    <div key={i} className="flex items-center justify-between p-2 border rounded-lg text-sm">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${isRetrait ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"}`}>
                          {isRetrait ? <Download className="h-4 w-4 rotate-180" /> : <Download className="h-4 w-4" />}
                        </div>
                        <div>
                          <p className="font-medium">
                            {isRetrait ? `Retrait : ${op.motif}` : `Paiement : ${op.membre.user.prenom} ${op.membre.user.nom}`}
                          </p>
                          <p className="text-xs text-gray-500">
                            {format(date, "PPP", { locale: fr })}
                            {op.note && ` • ${op.note}`}
                          </p>
                        </div>
                      </div>
                      <p className={`font-bold ${isRetrait ? "text-red-600" : "text-green-600"}`}>
                        {isRetrait ? "-" : "+"}{parseFloat(op.montant_paye || op.montant).toLocaleString()} XAF
                      </p>
                    </div>
                  );
                })}
              {[...rubrique.paiements, ...rubrique.retraits].length === 0 && (
                <p className="text-center py-4 text-gray-500">Aucune transaction.</p>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
