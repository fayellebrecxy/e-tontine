"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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
import { Checkbox } from "@/components/ui/checkbox";
import { createRubrique } from "@/lib/actions/rubriques";
import {
  RubriqueFormFields,
  defaultRubriqueFormValues,
} from "./rubrique-form-fields";

type Props = {
  groupId: string;
  members: any[];
  onClose: () => void;
};

export function RubriqueAssistant({ groupId, members, onClose }: Props) {
  const router = useRouter();
  const [step, setStep] = React.useState(1);
  const [loading, setLoading] = React.useState(false);
  const [formData, setFormData] = React.useState(defaultRubriqueFormValues());
  const [membresIds, setMembresIds] = React.useState<string[]>(
    members.map((m) => m.id_membre_groupe),
  );

  const nextStep = () => setStep((s) => s + 1);
  const prevStep = () => setStep((s) => s - 1);

  const canProceedFromStep1 = formData.nom.trim().length > 0;
  const canProceedFromStep2 =
    formData.montantFixe !== "" &&
    parseFloat(formData.montantFixe) > 0 &&
    formData.dateDebut !== "";

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const result = await createRubrique({
        groupId,
        nom: formData.nom,
        montantFixe: parseFloat(formData.montantFixe),
        typeRubrique: formData.typeRubrique,
        frequence:
          formData.typeRubrique === "RECURRENTE"
            ? formData.frequence
            : "UNIQUE",
        dateDebut: formData.dateDebut,
        dateLimite: formData.dateLimite || undefined,
        estObligatoire: formData.estObligatoire,
        membresIds,
      });

      if (!result.ok) {
        toast.error("error" in result ? result.error : "Erreur lors de la création.");
        return;
      }

      toast.success("Rubrique créée.");
      router.refresh();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open onOpenChange={onClose}>
      <SheetContent className="sm:max-w-[500px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Créer une rubrique de cotisation</SheetTitle>
          <SheetDescription>Étape {step} sur 3</SheetDescription>
        </SheetHeader>

        <div className="py-6">
          {step === 1 && (
            <div className="space-y-2">
              <Label htmlFor="nom">Nom de la rubrique</Label>
              <Input
                id="nom"
                placeholder="Ex: Frais de fonctionnement, Boisson…"
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
              />
            </div>
          )}

          {step === 2 && (
            <RubriqueFormFields values={formData} onChange={setFormData} showNom={false} />
          )}

          {step === 3 && (
            <div className="space-y-4">
              <Label>Membres concernés</Label>
              <div className="max-h-[300px] overflow-y-auto space-y-2 border rounded-md p-3">
                {members.map((member) => (
                  <div key={member.id_membre_groupe} className="flex items-center space-x-2">
                    <Checkbox
                      id={`member-${member.id_membre_groupe}`}
                      checked={membresIds.includes(member.id_membre_groupe)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setMembresIds([...membresIds, member.id_membre_groupe]);
                        } else {
                          setMembresIds(
                            membresIds.filter((id) => id !== member.id_membre_groupe),
                          );
                        }
                      }}
                    />
                    <Label
                      htmlFor={`member-${member.id_membre_groupe}`}
                      className="cursor-pointer"
                    >
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
            <Button
              onClick={nextStep}
              className="w-full"
              disabled={step === 1 ? !canProceedFromStep1 : !canProceedFromStep2}
            >
              Suivant
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              className="w-full"
              disabled={loading || membresIds.length === 0}
            >
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
