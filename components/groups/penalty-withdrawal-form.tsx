"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const [scope, setScope] = React.useState<PenaltyWithdrawalScope>("TOUR");
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
      <CardHeader>
        <CardTitle className="text-base text-amber-900">Caisse des pénalités</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-amber-800">
          Les pénalités sont séparées du pot du bénéficiaire. Vous pouvez retirer la caisse du tour
          actif ou la caisse globale du cycle.
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
      </CardContent>
    </Card>
  );
}
