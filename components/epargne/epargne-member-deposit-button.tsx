"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Smartphone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MobileMoneyCheckout } from "@/components/payments/mobile-money-checkout";

export function EpargneMemberDepositButton({
  groupId,
  accountId,
  devise,
  defaultTelephone,
}: {
  groupId: string;
  accountId: string;
  devise: string;
  defaultTelephone?: string;
}) {
  const router = useRouter();
  const [montant, setMontant] = React.useState("");
  const [open, setOpen] = React.useState(false);

  const amount = Number(montant);

  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-4 space-y-3">
      <div>
        <p className="text-sm font-semibold text-emerald-900">Déposer sur mon compte</p>
        <p className="text-xs text-emerald-800">
          Effectuez un dépôt via Orange Money ou MTN MoMo.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="depot-montant">Montant ({devise})</Label>
        <Input
          id="depot-montant"
          type="number"
          min={1}
          step="1"
          value={montant}
          onChange={(e) => setMontant(e.target.value)}
          placeholder="Ex : 10000"
        />
      </div>
      <Button
        type="button"
        className="gap-2"
        disabled={!Number.isFinite(amount) || amount <= 0}
        onClick={() => setOpen(true)}
      >
        <Smartphone className="h-4 w-4" />
        Déposer via Mobile Money
      </Button>

      <MobileMoneyCheckout
        groupId={groupId}
        contextType="EPARGNE_DEPOT"
        contextId={accountId}
        montant={amount}
        montantLabel={`${amount.toLocaleString("fr-FR")} ${devise}`}
        defaultTelephone={defaultTelephone}
        open={open}
        onOpenChange={setOpen}
        onSuccess={() => {
          setMontant("");
          router.refresh();
        }}
        title="Dépôt épargne Mobile Money"
      />
    </div>
  );
}
