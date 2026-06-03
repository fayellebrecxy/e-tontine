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
import { updateRubrique } from "@/lib/actions/rubriques";
import { RubriqueFormFields, type RubriqueFormValues } from "./rubrique-form-fields";
import type { FrequenceRubrique, TypeRubriqueCotisation } from "@/lib/rubrique-dates";

type RubriqueInitial = {
  id_rubrique: string;
  nom: string;
  montant_fixe: string | number;
  type_rubrique: TypeRubriqueCotisation;
  frequence: FrequenceRubrique;
  date_debut: string | Date;
  date_limite?: string | Date | null;
  est_obligatoire: boolean;
};

type Props = {
  groupId: string;
  rubrique: RubriqueInitial;
  onClose: () => void;
};

function toDateInput(value: string | Date | null | undefined) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function toFormValues(rubrique: RubriqueInitial): RubriqueFormValues {
  const freq =
    rubrique.frequence === "UNIQUE"
      ? "MENSUEL"
      : (rubrique.frequence as RubriqueFormValues["frequence"]);

  return {
    nom: rubrique.nom,
    montantFixe: String(rubrique.montant_fixe),
    typeRubrique: rubrique.type_rubrique,
    frequence: freq,
    dateDebut: toDateInput(rubrique.date_debut),
    dateLimite: toDateInput(rubrique.date_limite),
    estObligatoire: rubrique.est_obligatoire,
  };
}

export function EditRubriqueForm({ groupId, rubrique, onClose }: Props) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [formData, setFormData] = React.useState(() => toFormValues(rubrique));

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const result = await updateRubrique({
        rubriqueId: rubrique.id_rubrique,
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
      });

      if (!result.ok) {
        toast.error("error" in result ? result.error : "Erreur lors de la mise à jour.");
        return;
      }

      toast.success("Rubrique mise à jour.");
      router.refresh();
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  const valid =
    formData.nom.trim().length > 0 &&
    formData.montantFixe !== "" &&
    parseFloat(formData.montantFixe) > 0 &&
    formData.dateDebut !== "";

  return (
    <Sheet open onOpenChange={onClose}>
      <SheetContent className="sm:max-w-[500px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Modifier la rubrique</SheetTitle>
          <SheetDescription>
            Mettez à jour le calendrier et les paramètres. La fin de période sera recalculée
            automatiquement.
          </SheetDescription>
        </SheetHeader>

        <div className="py-6">
          <RubriqueFormFields values={formData} onChange={setFormData} />
        </div>

        <SheetFooter className="flex-col gap-2 sm:flex-col">
          <Button className="w-full" onClick={handleSubmit} disabled={loading || !valid}>
            {loading ? "Enregistrement..." : "Enregistrer"}
          </Button>
          <Button variant="ghost" className="w-full" onClick={onClose}>
            Annuler
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
