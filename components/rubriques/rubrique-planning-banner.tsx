"use client";

import { Calendar, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  FREQUENCE_LABELS,
  getRubriquePlanningSummary,
  type FrequenceRubrique,
  type RubriquePlanningInput,
  type TypeRubriqueCotisation,
} from "@/lib/rubrique-dates";

type Props = {
  rubrique: {
    type_rubrique: TypeRubriqueCotisation;
    frequence: FrequenceRubrique;
    date_debut: string | Date;
    duree_jours?: number | null;
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
    duree_jours: rubrique.duree_jours,
    date_fin: rubrique.date_fin ? new Date(rubrique.date_fin) : null,
    date_limite: rubrique.date_limite ? new Date(rubrique.date_limite) : null,
  };

  const summary = getRubriquePlanningSummary(planning);

  if (compact) {
    return (
      <p className="text-xs text-muted-foreground truncate">
        {summary.frequenceLabel}
        {summary.dateDebutLabel ? ` · Début ${summary.dateDebutLabel}` : ""}
      </p>
    );
  }

  return (
    <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary">{FREQUENCE_LABELS[rubrique.frequence]}</Badge>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 text-sm">
        <div className="flex items-start gap-2">
          <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
          <div>
            <p className="text-muted-foreground text-xs">Date de début</p>
            <p className="font-medium">{summary.dateDebutLabel}</p>
          </div>
        </div>

        {summary.dateFinLabel ? (
          <div className="flex items-start gap-2">
            <Clock className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
            <div>
              <p className="text-muted-foreground text-xs">Date de fin</p>
              <p className="font-medium">{summary.dateFinLabel}</p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
