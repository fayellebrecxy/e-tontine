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
import { enregistrerRetrait } from "@/lib/actions/rubriques";

type Props = {
  groupId: string;
  adminId: string;
  rubriques: any[];
  onClose: () => void;
};

export function RetraitForm({ groupId, adminId, rubriques, onClose }: Props) {
  const [loading, setLoading] = React.useState(false);
  const [formData, setFormData] = React.useState({
    montant: "",
    motif: "",
    rubriqueId: "GLOBAL",
  });

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await enregistrerRetrait({
        groupId,
        adminId,
        montant: parseFloat(formData.montant),
        motif: formData.motif,
        rubriqueId: formData.rubriqueId === "GLOBAL" ? undefined : formData.rubriqueId,
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
          <SheetTitle>Enregistrer un retrait d'argent</SheetTitle>
          <SheetDescription>
            Saisissez le montant et le motif du retrait.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 py-6">
          <div className="space-y-2">
            <Label>Source des fonds</Label>
            <Select
              value={formData.rubriqueId}
              onValueChange={(val) => setFormData({ ...formData, rubriqueId: val })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choisir la source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GLOBAL">Caisse Globale</SelectItem>
                {rubriques.map((r) => (
                  <SelectItem key={r.id_rubrique} value={r.id_rubrique}>
                    Rubrique: {r.nom}
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
            <Label htmlFor="motif">Motif du retrait</Label>
            <Input
              id="motif"
              placeholder="Ex: Achat fournitures, Aide sociale..."
              value={formData.motif}
              onChange={(e) => setFormData({ ...formData, motif: e.target.value })}
            />
          </div>
        </div>

        <SheetFooter className="flex-col gap-2 sm:flex-col">
          <Button onClick={handleSubmit} className="w-full" disabled={loading || !formData.montant || !formData.motif}>
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
