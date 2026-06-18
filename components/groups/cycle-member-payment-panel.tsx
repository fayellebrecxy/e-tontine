"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Smartphone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MobileMoneyCheckout } from "@/components/payments/mobile-money-checkout";

type Props = {
  groupId: string;
  cycleId: string;
  totalDue: number;
  cotisationDue: number;
  penaltyDue: number;
  devise: string;
  defaultTelephone?: string;
};

export function CycleMemberPaymentPanel({
  groupId,
  cycleId,
  totalDue,
  cotisationDue,
  penaltyDue,
  devise,
  defaultTelephone,
}: Props) {
  const router = useRouter();
  const [montant, setMontant] = React.useState("");
  const [open, setOpen] = React.useState(false);

  const amount = Number(montant);
  const isValidAmount = Number.isFinite(amount) && amount > 0 && amount <= totalDue;

  if (totalDue <= 0) {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
        <p className="text-sm font-semibold text-emerald-800">✅ Vous êtes à jour</p>
        <p className="mt-1 text-xs text-emerald-700">
          Aucune cotisation ni pénalité en attente pour ce cycle.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-3">
      <div>
        <p className="text-sm font-semibold text-amber-900">Reste à payer</p>
        <p className="mt-1 text-2xl font-bold text-amber-950">
          {totalDue.toLocaleString("fr-FR")} {devise}
        </p>
        <p className="mt-1 text-xs text-amber-800">
          Cotisations : {cotisationDue.toLocaleString("fr-FR")} {devise}
          {penaltyDue > 0 ? ` · Pénalités : ${penaltyDue.toLocaleString("fr-FR")} ${devise}` : ""}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="cycle-montant">Montant à verser ({devise})</Label>
        <Input
          id="cycle-montant"
          type="number"
          min={1}
          max={totalDue}
          step="1"
          value={montant}
          onChange={(e) => setMontant(e.target.value)}
          placeholder={`Ex : ${Math.min(totalDue, 5000).toLocaleString("fr-FR")}`}
          className="bg-white"
        />
        <p className="text-xs text-amber-800">
          Paiement en tranche possible · Maximum{" "}
          {totalDue.toLocaleString("fr-FR")} {devise}
        </p>
      </div>

      <Button
        type="button"
        className="gap-2"
        disabled={!isValidAmount}
        onClick={() => setOpen(true)}
      >
        <Smartphone className="h-4 w-4" />
        Payer via Mobile Money
      </Button>

      <MobileMoneyCheckout
        groupId={groupId}
        contextType="CYCLE_COTISATION"
        contextId={cycleId}
        montant={amount}
        montantLabel={`${amount.toLocaleString("fr-FR")} ${devise}`}
        defaultTelephone={defaultTelephone}
        open={open}
        onOpenChange={setOpen}
        title="Payer ma cotisation"
        description="Choisissez votre opérateur et validez la transaction sur votre téléphone."
        onSuccess={() => {
          setMontant("");
          router.refresh();
        }}
      />
    </div>
  );
}
