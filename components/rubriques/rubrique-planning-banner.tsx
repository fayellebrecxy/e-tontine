"use client";

import { Calendar, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  ECHEANCE_STATUT_LABELS,
  FREQUENCE_LABELS,
  TYPE_RUBRIQUE_LABELS,
  getCurrentEcheance,
  getDaysUntilEcheance,
  getEcheanceStatut,
  getRubriquePlanningSummary,
  formatDateFr,
  type FrequenceRubrique,
  type RubriquePlanningInput,
  type TypeRubriqueCotisation,
} from "@/lib/rubrique-dates";
import { cn } from "@/lib/utils";

type Props = {
  rubrique: {
    type_rubrique: TypeRubriqueCotisation;
    frequence: FrequenceRubrique;
    date_debut: string | Date;
    date_limite?: string | Date | null;
    date_fin?: string | Date | null;
  };
  /** Reste à payer pour le membre connecté (0 si admin vue globale sans filtre). */
  resteAPayer?: number;
  compact?: boolean;
};

export function RubriquePlanningBanner({ rubrique, resteAPayer = 0, compact }: Props) {
  const planning: RubriquePlanningInput = {
    type_rubrique: rubrique.type_rubrique,
    frequence: rubrique.frequence,
    date_debut: new Date(rubrique.date_debut),
    date_limite: rubrique.date_limite ? new Date(rubrique.date_limite) : null,
  };

  const summary = getRubriquePlanningSummary(planning);
  const echeance = getCurrentEcheance(planning);
  const statut = getEcheanceStatut(echeance, resteAPayer);
  const days = getDaysUntilEcheance(echeance);

  const statutClass =
    statut === "expire"
      ? "bg-red-500/10 text-red-600 border-red-500/20"
      : statut === "bientot"
        ? "bg-amber-500/10 text-amber-700 border-amber-500/20"
        : "bg-muted text-muted-foreground";

  if (compact) {
    return (
      <p className="text-xs text-muted-foreground truncate">
        {summary.frequenceLabel}
        {summary.dateFinLabel ? ` · Échéance ${summary.dateFinLabel}` : ""}
      </p>
    );
  }

  return (
    <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline">{TYPE_RUBRIQUE_LABELS[rubrique.type_rubrique]}</Badge>
        <Badge variant="secondary">{FREQUENCE_LABELS[rubrique.frequence]}</Badge>
        {resteAPayer > 0 && echeance ? (
          <Badge className={cn("border", statutClass)}>{ECHEANCE_STATUT_LABELS[statut]}</Badge>
        ) : null}
      </div>

      <div className="grid gap-2 sm:grid-cols-2 text-sm">
        <div className="flex items-start gap-2">
          <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
          <div>
            <p className="text-muted-foreground text-xs">Date de début</p>
            <p className="font-medium">{summary.dateDebutLabel}</p>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <Clock className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
          <div>
            <p className="text-muted-foreground text-xs">
              {rubrique.type_rubrique === "RECURRENTE"
                ? "Fin de période en cours"
                : "Date d'échéance"}
            </p>
            <p className="font-medium">
              {summary.dateFinLabel ?? "Non définie"}
              {days !== null && resteAPayer > 0 && days >= 0 ? (
                <span className="text-muted-foreground font-normal">
                  {" "}
                  (dans {days} jour{days > 1 ? "s" : ""})
                </span>
              ) : null}
              {days !== null && resteAPayer > 0 && days < 0 ? (
                <span className="text-red-600 font-normal"> (dépassée)</span>
              ) : null}
            </p>
          </div>
        </div>

        {summary.dateLimiteLabel ? (
          <div className="flex items-start gap-2 sm:col-span-2">
            <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
            <div>
              <p className="text-muted-foreground text-xs">Date limite de campagne (optionnelle)</p>
              <p className="font-medium">{summary.dateLimiteLabel}</p>
            </div>
          </div>
        ) : null}
      </div>

      {rubrique.date_fin && rubrique.type_rubrique === "RECURRENTE" ? (
        <p className="text-xs text-muted-foreground">
          Première période enregistrée jusqu&apos;au {formatDateFr(new Date(rubrique.date_fin))}.
        </p>
      ) : null}
    </div>
  );
}
