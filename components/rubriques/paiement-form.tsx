"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { enregistrerPaiement } from "@/lib/actions/rubriques";
import { MobileMoneyCheckout } from "@/components/payments/mobile-money-checkout";

type Paiement = {
  id_membre_groupe: string;
  montant_paye: string | number;
};

type Props = {
  rubriqueId: string;
  groupId: string;
  montantFixe: number;
  paiements: Paiement[];
  members: any[];
  onClose: () => void;
};

function getRemainingDue(montantFixe: number, paiements: Paiement[], membreId: string) {
  const due = montantFixe;
  const paid = paiements
    .filter((p) => p.id_membre_groupe === membreId)
    .reduce((acc, p) => acc + parseFloat(String(p.montant_paye)), 0);
  return Math.max(0, Math.round((due - paid) * 100) / 100);
}

export function PaiementForm({
  rubriqueId,
  groupId,
  montantFixe,
  paiements,
  members,
  onClose,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [showMobileMoney, setShowMobileMoney] = React.useState(false);
  const [formData, setFormData] = React.useState({
    membreId: "",
    montant: "",
    note: "",
  });

  const remainingDue = formData.membreId
    ? getRemainingDue(montantFixe, paiements, formData.membreId)
    : null;

  const montantSaisi = formData.montant ? parseFloat(formData.montant) : NaN;
  const montantInvalide =
    formData.montant !== "" &&
    (!Number.isFinite(montantSaisi) ||
      montantSaisi <= 0 ||
      (remainingDue !== null && montantSaisi > remainingDue));

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await enregistrerPaiement({
        rubriqueId,
        membreId: formData.membreId,
        montant: parseFloat(formData.montant),
        note: formData.note,
        groupId,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onClose();
      router.refresh();
    } catch (err) {
      console.error(err);
      setError("Une erreur est survenue lors de l'enregistrement.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open onOpenChange={onClose}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Enregistrer un paiement</SheetTitle>
          <SheetDescription>
            Montant attendu : {montantFixe.toLocaleString("fr-FR")} XAF par membre.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 py-6">
          <div className="space-y-2">
            <Label>Membre</Label>
            <Select
              value={formData.membreId}
              onValueChange={(val) => {
                setError(null);
                setFormData({ ...formData, membreId: val, montant: "" });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choisir un membre" />
              </SelectTrigger>
              <SelectContent>
                {members.map((m) => {
                  const reste = getRemainingDue(montantFixe, paiements, m.id_membre_groupe);
                  return (
                    <SelectItem
                      key={m.id_membre_groupe}
                      value={m.id_membre_groupe}
                      disabled={reste <= 0}
                    >
                      {m.user.prenom} {m.user.nom}
                      {reste <= 0 ? " (soldé)" : ` (reste ${reste.toLocaleString("fr-FR")} XAF)`}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          {remainingDue !== null && (
            <p className="text-sm text-muted-foreground">
              Reste à payer :{" "}
              <span className="font-medium text-foreground">
                {remainingDue.toLocaleString("fr-FR")} XAF
              </span>
            </p>
          )}
          <div className="space-y-2">
            <Label htmlFor="montant">Montant (XAF)</Label>
            <Input
              id="montant"
              type="number"
              min="1"
              max={remainingDue ?? undefined}
              step="1"
              value={formData.montant}
              onChange={(e) => {
                setError(null);
                setFormData({ ...formData, montant: e.target.value });
              }}
              disabled={!formData.membreId || remainingDue === 0}
            />
            {montantInvalide && remainingDue !== null && montantSaisi > remainingDue && (
              <p className="text-sm text-destructive">
                Le montant ne peut pas dépasser {remainingDue.toLocaleString("fr-FR")} XAF.
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="note">Note (Avance, Reste, etc.)</Label>
            <Input
              id="note"
              placeholder="Ex: Avance, Paiement complet..."
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <SheetFooter className="flex-col gap-2 sm:flex-col">
          <Button
            onClick={handleSubmit}
            className="w-full"
            disabled={
              loading ||
              !formData.membreId ||
              !formData.montant ||
              montantInvalide ||
              remainingDue === 0
            }
          >
            {loading ? "Enregistrement..." : "Enregistrer manuellement"}
          </Button>
          <Button
            variant="secondary"
            className="w-full"
            disabled={
              !formData.membreId ||
              !formData.montant ||
              montantInvalide ||
              remainingDue === 0
            }
            onClick={() => setShowMobileMoney(true)}
          >
            Simuler Mobile Money
          </Button>
          <Button variant="outline" className="w-full" onClick={onClose}>
            Annuler
          </Button>
        </SheetFooter>

        {formData.membreId && formData.montant && !montantInvalide ? (
          <MobileMoneyCheckout
            groupId={groupId}
            contextType="RUBRIQUE"
            contextId={rubriqueId}
            montant={montantSaisi}
            targetMemberId={formData.membreId}
            open={showMobileMoney}
            onOpenChange={setShowMobileMoney}
            onSuccess={() => {
              onClose();
              router.refresh();
            }}
            title="Paiement rubrique Mobile Money"
          />
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
