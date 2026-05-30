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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { createRubrique } from "@/lib/actions/rubriques";

type Props = {
  groupId: string;
  members: any[];
  onClose: () => void;
};

export function RubriqueAssistant({ groupId, members, onClose }: Props) {
  const [step, setStep] = React.useState(1);
  const [loading, setLoading] = React.useState(false);
  const [formData, setFormData] = React.useState({
    nom: "",
    typeMontant: "FIXE" as "FIXE" | "VARIABLE",
    montantFixe: "",
    duree: "",
    dateLimite: "",
    estObligatoire: true,
    membresIds: members.map((m) => m.id_membre_groupe),
  });

  const nextStep = () => setStep((s) => s + 1);
  const prevStep = () => setStep((s) => s - 1);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await createRubrique({
        groupId,
        nom: formData.nom,
        typeMontant: formData.typeMontant,
        montantFixe: formData.montantFixe ? parseFloat(formData.montantFixe) : undefined,
        duree: formData.duree,
        dateLimite: formData.dateLimite || undefined,
        estObligatoire: formData.estObligatoire,
        membresIds: formData.membresIds,
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
      <SheetContent className="sm:max-w-[500px]">
        <SheetHeader>
          <SheetTitle>Créer une rubrique de cotisation</SheetTitle>
          <SheetDescription>
            Étape {step} sur 3
          </SheetDescription>
        </SheetHeader>

        <div className="py-6">
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nom">Nom de la rubrique</Label>
                <Input
                  id="nom"
                  placeholder="Ex: Frais de fonctionnement, Boisson, etc."
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Type de montant</Label>
                <RadioGroup
                  value={formData.typeMontant}
                  onValueChange={(val: "FIXE" | "VARIABLE") =>
                    setFormData({ ...formData, typeMontant: val })
                  }
                  className="flex flex-col space-y-1"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="FIXE" id="fixe" />
                    <Label htmlFor="fixe">Fixe</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="VARIABLE" id="variable" />
                    <Label htmlFor="variable">Variable</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              {formData.typeMontant === "FIXE" && (
                <div className="space-y-2">
                  <Label htmlFor="montant">Montant (XAF)</Label>
                  <Input
                    id="montant"
                    type="number"
                    value={formData.montantFixe}
                    onChange={(e) => setFormData({ ...formData, montantFixe: e.target.value })}
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="duree">Durée / Fréquence (Optionnel)</Label>
                <Input
                  id="duree"
                  placeholder="Ex: Mensuel, Hebdomadaire"
                  value={formData.duree}
                  onChange={(e) => setFormData({ ...formData, duree: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateLimite">Date d'échéance (Optionnel)</Label>
                <Input
                  id="dateLimite"
                  type="date"
                  value={formData.dateLimite}
                  onChange={(e) => setFormData({ ...formData, dateLimite: e.target.value })}
                />
              </div>
              <div className="flex items-center space-x-2 pt-2">
                <Checkbox
                  id="obligatoire"
                  checked={formData.estObligatoire}
                  onCheckedChange={(val: boolean) =>
                    setFormData({ ...formData, estObligatoire: val })
                  }
                />
                <Label htmlFor="obligatoire">Cotisation obligatoire</Label>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <Label>Membres concernés</Label>
              <div className="max-h-[300px] overflow-y-auto space-y-2 border rounded-md p-3">
                {members.map((member) => (
                  <div key={member.id_membre_groupe} className="flex items-center space-x-2">
                    <Checkbox
                      id={`member-${member.id_membre_groupe}`}
                      checked={formData.membresIds.includes(member.id_membre_groupe)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFormData({
                            ...formData,
                            membresIds: [...formData.membresIds, member.id_membre_groupe],
                          });
                        } else {
                          setFormData({
                            ...formData,
                            membresIds: formData.membresIds.filter(
                              (id) => id !== member.id_membre_groupe
                            ),
                          });
                        }
                      }}
                    />
                    <Label htmlFor={`member-${member.id_membre_groupe}`} className="cursor-pointer">
                      {member.user.prenom} {member.user.nom}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <SheetFooter className="flex-col gap-2 sm:flex-col">
          {step < 3 ? (
            <Button onClick={nextStep} className="w-full" disabled={!formData.nom}>
              Suivant
            </Button>
          ) : (
            <Button onClick={handleSubmit} className="w-full" disabled={loading}>
              {loading ? "Création..." : "Enregistrer"}
            </Button>
          )}
          {step > 1 && (
            <Button variant="outline" className="w-full" onClick={prevStep}>
              Précédent
            </Button>
          )}
          <Button variant="ghost" className="w-full" onClick={onClose}>
            Annuler
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
