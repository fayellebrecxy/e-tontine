import {
  addDays,
  addMonths,
  addYears,
  differenceInCalendarDays,
  endOfDay,
  format,
  startOfDay,
} from "date-fns";
import { fr } from "date-fns/locale";

export type TypeRubriqueCotisation = "PONCTUELLE" | "RECURRENTE";
export type FrequenceRubrique =
  | "UNIQUE"
  | "HEBDOMADAIRE"
  | "MENSUEL"
  | "TRIMESTRIEL"
  | "ANNUEL";

export const TYPE_RUBRIQUE_LABELS: Record<TypeRubriqueCotisation, string> = {
  PONCTUELLE: "Cotisation ponctuelle",
  RECURRENTE: "Cotisation récurrente",
};

export const FREQUENCE_LABELS: Record<FrequenceRubrique, string> = {
  UNIQUE: "Unique",
  HEBDOMADAIRE: "Hebdomadaire",
  MENSUEL: "Mensuelle",
  TRIMESTRIEL: "Trimestrielle",
  ANNUEL: "Annuelle",
};

export type RubriquePlanningInput = {
  type_rubrique: TypeRubriqueCotisation;
  frequence: FrequenceRubrique;
  date_debut: Date;
  date_limite?: Date | null;
};

export type EcheanceStatut = "sans_echeance" | "en_cours" | "bientot" | "retard" | "expire";

function getPeriodEnd(periodStart: Date, frequence: FrequenceRubrique, periodIndex: number): Date {
  const start = startOfDay(periodStart);
  switch (frequence) {
    case "HEBDOMADAIRE":
      return endOfDay(addDays(start, 7 * (periodIndex + 1) - 1));
    case "MENSUEL":
      return endOfDay(addDays(addMonths(start, periodIndex + 1), -1));
    case "TRIMESTRIEL":
      return endOfDay(addDays(addMonths(start, 3 * (periodIndex + 1)), -1));
    case "ANNUEL":
      return endOfDay(addDays(addYears(start, periodIndex + 1), -1));
    case "UNIQUE":
    default:
      return endOfDay(start);
  }
}

/** Date de fin enregistrée à la création / mise à jour (première période ou échéance ponctuelle). */
export function computeStoredDateFin(input: RubriquePlanningInput): Date | null {
  const debut = startOfDay(input.date_debut);

  if (input.type_rubrique === "PONCTUELLE") {
    return input.date_limite ? endOfDay(input.date_limite) : null;
  }

  const firstPeriodEnd = getPeriodEnd(debut, input.frequence, 0);
  if (input.date_limite) {
    const limite = endOfDay(input.date_limite);
    return firstPeriodEnd > limite ? limite : firstPeriodEnd;
  }

  return firstPeriodEnd;
}

/** Échéance de la période en cours (recalculée pour les rubriques récurrentes). */
export function getCurrentEcheance(input: RubriquePlanningInput): Date | null {
  const now = startOfDay(new Date());
  const debut = startOfDay(input.date_debut);
  const limite = input.date_limite ? endOfDay(input.date_limite) : null;

  if (input.type_rubrique === "PONCTUELLE") {
    return limite ?? null;
  }

  if (limite && now > limite) {
    return limite;
  }

  if (now < debut) {
    const firstEnd = getPeriodEnd(debut, input.frequence, 0);
    return limite && firstEnd > limite ? limite : firstEnd;
  }

  for (let periodIndex = 0; periodIndex < 240; periodIndex++) {
    const periodEnd = getPeriodEnd(debut, input.frequence, periodIndex);
    const periodStart =
      periodIndex === 0 ? debut : startOfDay(addDays(getPeriodEnd(debut, input.frequence, periodIndex - 1), 1));

    if (now >= periodStart && now <= periodEnd) {
      return limite && periodEnd > limite ? limite : periodEnd;
    }
  }

  return limite;
}

export function getDaysUntilEcheance(echeance: Date | null, now = new Date()): number | null {
  if (!echeance) return null;
  return differenceInCalendarDays(startOfDay(echeance), startOfDay(now));
}

export function getEcheanceStatut(
  echeance: Date | null,
  resteAPayer: number,
  now = new Date(),
): EcheanceStatut {
  if (resteAPayer <= 0) return "en_cours";
  if (!echeance) return "sans_echeance";

  const days = getDaysUntilEcheance(echeance, now);
  if (days === null) return "sans_echeance";
  if (days < 0) return "expire";
  if (days <= 7) return "bientot";
  return "en_cours";
}

export const ECHEANCE_STATUT_LABELS: Record<EcheanceStatut, string> = {
  sans_echeance: "Sans échéance",
  en_cours: "En cours",
  bientot: "Échéance proche",
  retard: "En retard",
  expire: "Échéance dépassée",
};

export function formatDateFr(date: Date) {
  return format(date, "PPP", { locale: fr });
}

export function getRubriquePlanningSummary(input: RubriquePlanningInput) {
  const echeance = getCurrentEcheance(input);
  const days = getDaysUntilEcheance(echeance);

  return {
    typeLabel: TYPE_RUBRIQUE_LABELS[input.type_rubrique],
    frequenceLabel: FREQUENCE_LABELS[input.frequence],
    dateDebutLabel: formatDateFr(input.date_debut),
    dateFinLabel: echeance ? formatDateFr(echeance) : null,
    dateLimiteLabel: input.date_limite ? formatDateFr(input.date_limite) : null,
    daysUntilEcheance: days,
    echeance,
  };
}

export function resolveFrequenceForType(
  type: TypeRubriqueCotisation,
  frequence: FrequenceRubrique,
): FrequenceRubrique {
  return type === "PONCTUELLE" ? "UNIQUE" : frequence === "UNIQUE" ? "MENSUEL" : frequence;
}
