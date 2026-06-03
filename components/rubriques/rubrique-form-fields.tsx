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
import { FREQUENCE_LABELS, TYPE_RUBRIQUE_LABELS } from "@/lib/rubrique-dates";

export type RubriqueFormValues = {
  nom: string;
  montantFixe: string;
  typeRubrique: "PONCTUELLE" | "RECURRENTE";
  frequence: "HEBDOMADAIRE" | "MENSUEL" | "TRIMESTRIEL" | "ANNUEL";
  dateDebut: string;
  dateLimite: string;
  estObligatoire: boolean;
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
    typeRubrique: "PONCTUELLE",
    frequence: "MENSUEL",
    dateDebut: todayInputValue(),
    dateLimite: "",
    estObligatoire: true,
  };
}

export function RubriqueFormFields({ values, onChange, showNom = true }: Props) {
  const set = (patch: Partial<RubriqueFormValues>) => onChange({ ...values, ...patch });

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
        <Label>Type de cotisation</Label>
        <Select
          value={values.typeRubrique}
          onValueChange={(v: "PONCTUELLE" | "RECURRENTE") => set({ typeRubrique: v })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PONCTUELLE">{TYPE_RUBRIQUE_LABELS.PONCTUELLE}</SelectItem>
            <SelectItem value="RECURRENTE">{TYPE_RUBRIQUE_LABELS.RECURRENTE}</SelectItem>
          </SelectContent>
        </Select>
      </div>

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

      {values.typeRubrique === "RECURRENTE" ? (
        <div className="space-y-2">
          <Label>Fréquence de cotisation</Label>
          <Select
            value={values.frequence}
            onValueChange={(v: RubriqueFormValues["frequence"]) => set({ frequence: v })}
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
          <p className="text-xs text-muted-foreground">
            La fin de période en cours sera calculée automatiquement à partir de la date de début.
          </p>
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="dateDebut">Date de début</Label>
        <Input
          id="dateDebut"
          type="date"
          value={values.dateDebut}
          onChange={(e) => set({ dateDebut: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="dateLimite">
          {values.typeRubrique === "PONCTUELLE"
            ? "Date d'échéance (optionnelle)"
            : "Date limite de campagne (optionnelle)"}
        </Label>
        <Input
          id="dateLimite"
          type="date"
          value={values.dateLimite}
          onChange={(e) => set({ dateLimite: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">
          {values.typeRubrique === "PONCTUELLE"
            ? "Si renseignée, les membres verront cette date comme échéance de paiement."
            : "Limite globale au-delà de laquelle la rubrique n'accepte plus de nouvelle période."}
        </p>
      </div>

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
