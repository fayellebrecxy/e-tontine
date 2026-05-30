"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { enregistrerVersementPot } from "@/lib/actions/rubriques";

type Props = {
  groupId: string;
  adminId: string;
  cycles: any[];
  onClose: () => void;
};

export function VersementPotForm({ groupId, adminId, cycles, onClose }: Props) {
  const [loading, setLoading] = React.useState(false);
  const [formData, setFormData] = React.useState({
    cycleId: "",
    beneficiaireId: "",
    montant: "",
    tour: "1",
    mode: "ESPECES" as any,
    reference: "",
  });

  const selectedCycle = cycles.find((c) => c.id_cycle === formData.cycleId);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await enregistrerVersementPot({
        cycleId: formData.cycleId,
        beneficiaireId: formData.beneficiaireId,
        adminId,
        montant: parseFloat(formData.montant),
        tour: parseInt(formData.tour),
        mode: formData.mode,
        reference: formData.reference,
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
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Enregistrer un versement du pot</DialogTitle>
          <DialogDescription>
            Enregistrez le versement du pot de la tontine au bénéficiaire.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Cycle de tontine</Label>
            <Select
              value={formData.cycleId}
              onValueChange={(val) => setFormData({ ...formData, cycleId: val, beneficiaireId: "" })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choisir un cycle" />
              </SelectTrigger>
              <SelectContent>
                {cycles.map((c) => (
                  <SelectItem key={c.id_cycle} value={c.id_cycle}>
                    {c.nom_cycle}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Bénéficiaire</Label>
            <Select
              value={formData.beneficiaireId}
              onValueChange={(val) => setFormData({ ...formData, beneficiaireId: val })}
              disabled={!formData.cycleId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choisir le bénéficiaire" />
              </SelectTrigger>
              <SelectContent>
                {selectedCycle?.participants.map((p: any) => (
                  <SelectItem key={p.membre_groupe.id_membre_groupe} value={p.membre_groupe.id_membre_groupe}>
                    {p.membre_groupe.user.prenom} {p.membre_groupe.user.nom} (Tour {p.ordre})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="montant">Montant versé</Label>
              <Input
                id="montant"
                type="number"
                value={formData.montant}
                onChange={(e) => setFormData({ ...formData, montant: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tour">Numéro du tour</Label>
              <Input
                id="tour"
                type="number"
                value={formData.tour}
                onChange={(e) => setFormData({ ...formData, tour: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Mode de versement</Label>
            <Select
              value={formData.mode}
              onValueChange={(val) => setFormData({ ...formData, mode: val })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ESPECES">Espèces</SelectItem>
                <SelectItem value="VIREMENT">Virement</SelectItem>
                <SelectItem value="MOBILE_MONEY">Mobile Money</SelectItem>
                <SelectItem value="CHEQUE">Chèque</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ref">Référence externe (Optionnel)</Label>
            <Input
              id="ref"
              placeholder="Ex: ID Transaction, N° Chèque"
              value={formData.reference}
              onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !formData.cycleId || !formData.beneficiaireId || !formData.montant}
          >
            {loading ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
