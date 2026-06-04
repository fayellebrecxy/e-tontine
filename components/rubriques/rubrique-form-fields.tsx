"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FREQUENCE_LABELS } from "@/lib/rubrique-dates";

export type RubriqueFormValues = {
  nom: string;
  montantFixe: string;
  typeRubrique: "PONCTUELLE" | "RECURRENTE";
  frequence: "HEBDOMADAIRE" | "MENSUEL" | "TRIMESTRIEL" | "ANNUEL";
  dateDebut: string;
  dureeJours: string;
  estObligatoire: boolean;
};

const FREQUENCE_DUREE_MAP: Record<"HEBDOMADAIRE" | "MENSUEL" | "TRIMESTRIEL" | "ANNUEL", number> = {
  HEBDOMADAIRE: 7,
  MENSUEL: 30,
  TRIMESTRIEL: 90,
  ANNUEL: 365,
};

type Props = {
  values: RubriqueFormValues;
  onChange: (values: RubriqueFormValues) => void;
  showNom?: boolean;
};

function todayInputValue() {
  return new Date().toISOString().slice(0, 10);
}

export function defaultRubriqueFormValues(): RubriqueFormValues {
  return {
    nom: "",
    montantFixe: "",
    typeRubrique: "RECURRENTE",
    frequence: "MENSUEL",
    dateDebut: todayInputValue(),
    dureeJours: String(FREQUENCE_DUREE_MAP["MENSUEL"]),
    estObligatoire: true,
  };
}

export function RubriqueFormFields({ values, onChange, showNom = true }: Props) {
  const set = (patch: Partial<RubriqueFormValues>) => onChange({ ...values, ...patch });

  // La date de fin est calculée automatiquement selon la fréquence
  const dateFin = values.dateDebut
    ? (() => {
        const duree = FREQUENCE_DUREE_MAP[values.frequence];
        const date = new Date(`${values.dateDebut}T00:00:00`);
        date.setDate(date.getDate() + duree - 1);
        return date.toLocaleDateString("fr-FR");
      })()
    : null;

  return (
    <div className="space-y-4">
      {showNom ? (
        <div className="space-y-2">
          <Label htmlFor="nom">Nom de la rubrique</Label>
          <Input
            id="nom"
            placeholder="Ex: Frais de fonctionnement"
            value={values.nom}
            onChange={(e) => set({ nom: e.target.value })}
          />
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="montant">Montant (XAF)</Label>
        <Input
          id="montant"
          type="number"
          min="1"
          value={values.montantFixe}
          onChange={(e) => set({ montantFixe: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label>Fréquence de la rubrique</Label>
        <Select
          value={values.frequence}
          onValueChange={(v: RubriqueFormValues["frequence"]) =>
            set({
              frequence: v,
              dureeJours: String(FREQUENCE_DUREE_MAP[v]),
            })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(["HEBDOMADAIRE", "MENSUEL", "TRIMESTRIEL", "ANNUEL"] as const).map((f) => (
              <SelectItem key={f} value={f}>
                {FREQUENCE_LABELS[f]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="dateDebut">Date de début</Label>
        <Input
          id="dateDebut"
          type="date"
          value={values.dateDebut}
          onChange={(e) => set({ dateDebut: e.target.value })}
        />
      </div>

      {dateFin ? (
        <div className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
          Date de fin calculée automatiquement : <span className="font-medium text-foreground">{dateFin}</span>
        </div>
      ) : null}

      <div className="flex items-center space-x-2 pt-2">
        <Checkbox
          id="obligatoire"
          checked={values.estObligatoire}
          onCheckedChange={(val: boolean) => set({ estObligatoire: val })}
        />
        <Label htmlFor="obligatoire">Cotisation obligatoire</Label>
      </div>
    </div>
  );
}
