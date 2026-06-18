"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowDownCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { MobileMoneyCheckout } from "@/components/payments/mobile-money-checkout";

type Props = {
  groupId: string;
  solde: number;
  devise: string;
};

export function RetraitAmendeForm({ groupId, solde, devise }: Props) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [montant, setMontant] = React.useState("");
  const [motif, setMotif] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [showMobileMoney, setShowMobileMoney] = React.useState(false);

  const montantNum = Number(montant);
  const isValid = montantNum > 0 && montantNum <= solde && motif.trim().length >= 3;

  const handleSubmit = async () => {
    if (!isValid) return;

    setSubmitting(true);
    const res = await fetch(`/api/groups/${groupId}/amendes-reunions/retraits`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ montant: montantNum, motif: motif.trim() }),
    });
    setSubmitting(false);

    const body = await res.json().catch(() => null) as null | {
      ok?: boolean;
      error?: string;
      nouveauSolde?: number;
    };

    if (!res.ok || !body?.ok) {
      toast.error(body?.error ?? "Impossible d'effectuer le retrait.");
      return;
    }

    toast.success(
      `✅ Retrait de ${montantNum.toLocaleString("fr-FR")} ${devise} effectué. Nouveau solde : ${(body.nouveauSolde ?? 0).toLocaleString("fr-FR")} ${devise}`,
    );
    setMontant("");
    setMotif("");
    setOpen(false);
    router.refresh();
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5 border-amber-300 text-amber-800 hover:bg-amber-50"
          disabled={solde <= 0}
        >
          <ArrowDownCircle className="h-4 w-4" />
          Effectuer un retrait
        </Button>
      </SheetTrigger>

      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>💸 Retrait — Caisse amendes</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-5">
          {/* Solde disponible */}
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-center">
            <p className="text-xs text-amber-600 font-medium uppercase tracking-wide">
              Solde disponible
            </p>
            <p className="text-2xl font-bold text-amber-800 mt-1">
              {solde.toLocaleString("fr-FR")} {devise}
            </p>
          </div>

          {/* Montant */}
          <div className="space-y-2">
            <Label htmlFor="montant-retrait">Montant à retirer ({devise}) *</Label>
            <Input
              id="montant-retrait"
              type="number"
              min={1}
              max={solde}
              step="100"
              value={montant}
              onChange={(e) => setMontant(e.target.value)}
              placeholder={`Max : ${solde.toLocaleString("fr-FR")}`}
            />
            {montantNum > solde && montantNum > 0 && (
              <p className="text-xs text-rose-600 font-medium">
                ⚠️ Le montant dépasse le solde disponible ({solde.toLocaleString("fr-FR")} {devise}).
              </p>
            )}
            {montantNum > 0 && montantNum <= solde && (
              <p className="text-xs text-gray-500">
                Solde après retrait :{" "}
                <strong className="text-gray-800">
                  {(solde - montantNum).toLocaleString("fr-FR")} {devise}
                </strong>
              </p>
            )}
          </div>

          {/* Motif */}
          <div className="space-y-2">
            <Label htmlFor="motif-retrait">Motif du retrait *</Label>
            <textarea
              id="motif-retrait"
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              rows={3}
              placeholder="Ex : Achat de fournitures pour la réunion, frais de déplacement…"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => { setMontant(""); setMotif(""); setOpen(false); }}
            >
              Annuler
            </Button>
            <Button
              type="button"
              className="flex-1 bg-amber-600 hover:bg-amber-700"
              onClick={handleSubmit}
              disabled={submitting || !isValid}
            >
              {submitting ? "Traitement…" : "Confirmer manuellement"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              disabled={!isValid}
              onClick={() => setShowMobileMoney(true)}
            >
              Via Mobile Money
            </Button>
          </div>

          <MobileMoneyCheckout
            groupId={groupId}
            contextType="AMENDE_RETRAIT"
            contextId={groupId}
            direction="OUTBOUND"
            montant={montantNum}
            metadata={{ montant: montantNum, motif: motif.trim() }}
            open={showMobileMoney}
            onOpenChange={setShowMobileMoney}
            onSuccess={() => {
              setMontant("");
              setMotif("");
              setOpen(false);
              router.refresh();
            }}
            title="Retrait amendes Mobile Money"
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
