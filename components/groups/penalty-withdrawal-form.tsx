"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Download, Wallet } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  enregistrerRetraitPenalite,
  type PenaltyWithdrawalScope,
} from "@/lib/actions/cycle-penalty-withdrawals";

type Props = {
  groupId: string;
  cycleId: string;
  activeTour: number | null;
  devise: string;
  caisseTour: number;
  caisseCycle: number;
};

export function PenaltyWithdrawalForm({
  groupId,
  cycleId,
  activeTour,
  devise,
  caisseTour,
  caisseCycle,
}: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = React.useState<"CAISSE" | "RETRAIT">("CAISSE");
  const [scope, setScope] = React.useState<PenaltyWithdrawalScope>(
    activeTour && caisseTour > 0 ? "TOUR" : "CYCLE",
  );
  const [montant, setMontant] = React.useState("");
  const [motif, setMotif] = React.useState("");
  const [pending, setPending] = React.useState(false);

  const available = scope === "TOUR" ? caisseTour : caisseCycle;

  const submit = async () => {
    const amount = Number(montant);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Veuillez saisir un montant valide.");
      return;
    }

    if (!motif.trim()) {
      toast.error("Le motif est requis.");
      return;
    }

    setPending(true);
    try {
      const result = await enregistrerRetraitPenalite({
        groupId,
        cycleId,
        scope,
        montant: amount,
        motif,
      });

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success("Retrait de pénalité enregistré.");
      setMontant("");
      setMotif("");
      router.refresh();
    } finally {
      setPending(false);
    }
  };

  return (
    <Card className="border-amber-200 bg-amber-50/50">
      <CardHeader className="space-y-4">
        <CardTitle className="text-base text-amber-900">Caisse des pénalités</CardTitle>
        <div
          className="inline-flex w-full rounded-md border border-amber-200 bg-white p-1 text-sm sm:w-auto"
          role="tablist"
          aria-label="Gestion de la caisse des pénalités"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "CAISSE"}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded px-3 py-2 font-medium text-amber-800 transition-colors sm:flex-none",
              activeTab === "CAISSE"
                ? "bg-amber-100 text-amber-950"
                : "text-amber-700 hover:bg-amber-50",
            )}
            onClick={() => setActiveTab("CAISSE")}
          >
            <Wallet className="h-4 w-4" aria-hidden="true" />
            Caisse
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "RETRAIT"}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded px-3 py-2 font-medium text-amber-800 transition-colors sm:flex-none",
              activeTab === "RETRAIT"
                ? "bg-amber-100 text-amber-950"
                : "text-amber-700 hover:bg-amber-50",
            )}
            onClick={() => setActiveTab("RETRAIT")}
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Retrait
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {activeTab === "CAISSE" ? (
          <>
            <p className="text-sm text-amber-800">
              Les pénalités sont séparées du pot du bénéficiaire. Ouvrez l'onglet Retrait pour
              effectuer une sortie d'argent.
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-md border border-amber-200 bg-white p-3">
                <p className="text-xs font-medium uppercase text-amber-700">Tour actif</p>
                <p className="mt-1 text-lg font-semibold text-amber-900">
                  {caisseTour.toLocaleString("fr-FR")} {devise}
                </p>
              </div>
              <div className="rounded-md border border-amber-200 bg-white p-3">
                <p className="text-xs font-medium uppercase text-amber-700">Total cycle</p>
                <p className="mt-1 text-lg font-semibold text-amber-900">
                  {caisseCycle.toLocaleString("fr-FR")} {devise}
                </p>
              </div>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-amber-800">
              Sélectionnez la caisse à débiter, puis indiquez le montant et le motif du retrait.
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Source du retrait</Label>
                <select
                  className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm"
                  value={scope}
                  onChange={(event) => setScope(event.target.value as PenaltyWithdrawalScope)}
                >
                  <option value="TOUR" disabled={!activeTour}>
                    Tour actif {activeTour ? `(${activeTour})` : ""}
                  </option>
                  <option value="CYCLE">Total cycle</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Caisse disponible</Label>
                <div className="rounded-md border bg-white px-3 py-2 text-sm font-semibold text-amber-800">
                  {available.toLocaleString("fr-FR")} {devise}
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Montant à retirer</Label>
                <Input
                  type="number"
                  min={0}
                  max={available}
                  step="0.01"
                  value={montant}
                  onChange={(event) => setMontant(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Motif</Label>
                <Input
                  value={motif}
                  onChange={(event) => setMotif(event.target.value)}
                  placeholder="Ex. frais de gestion"
                />
              </div>
            </div>

            <Button type="button" onClick={submit} disabled={pending || available <= 0}>
              {pending ? "Enregistrement..." : "Retirer"}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
