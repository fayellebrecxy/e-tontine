"use client";

import * as React from "react";
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

type Props = {
  rubriqueId: string;
  groupId: string;
  members: any[];
  onClose: () => void;
};

export function PaiementForm({ rubriqueId, groupId, members, onClose }: Props) {
  const [loading, setLoading] = React.useState(false);
  const [formData, setFormData] = React.useState({
    membreId: "",
    montant: "",
    note: "",
  });

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await enregistrerPaiement({
        rubriqueId,
        membreId: formData.membreId,
        montant: parseFloat(formData.montant),
        note: formData.note,
        groupId,
      });
      onClose();
    } catch (error) {
      console.error(error);
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
            Saisissez les détails du paiement (avance ou reste).
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 py-6">
          <div className="space-y-2">
            <Label>Membre</Label>
            <Select
              value={formData.membreId}
              onValueChange={(val) => setFormData({ ...formData, membreId: val })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choisir un membre" />
              </SelectTrigger>
              <SelectContent>
                {members.map((m) => (
                  <SelectItem key={m.id_membre_groupe} value={m.id_membre_groupe}>
                    {m.user.prenom} {m.user.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="montant">Montant (XAF)</Label>
            <Input
              id="montant"
              type="number"
              value={formData.montant}
              onChange={(e) => setFormData({ ...formData, montant: e.target.value })}
            />
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
        </div>

        <SheetFooter className="flex-col gap-2 sm:flex-col">
          <Button onClick={handleSubmit} className="w-full" disabled={loading || !formData.membreId || !formData.montant}>
            {loading ? "Enregistrement..." : "Enregistrer"}
          </Button>
          <Button variant="outline" className="w-full" onClick={onClose}>
            Annuler
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
