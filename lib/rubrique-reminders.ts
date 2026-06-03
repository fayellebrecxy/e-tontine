import { startOfDay, subDays } from "date-fns";

import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import {
  getCurrentEcheance,
  getDaysUntilEcheance,
  type RubriquePlanningInput,
} from "@/lib/rubrique-dates";

const REMINDER_DAYS = [7, 3, 1] as const;

function reminderMarker(rubriqueId: string, daysBefore: number) {
  return `[rubrique:${rubriqueId}:J-${daysBefore}]`;
}

export async function sendRubriqueEcheanceReminders(groupId?: string) {
  const rubriques = await prisma.rubriqueCotisation.findMany({
    where: groupId ? { id_groupe: groupId } : undefined,
    select: {
      id_rubrique: true,
      nom: true,
      id_groupe: true,
      type_rubrique: true,
      frequence: true,
      date_debut: true,
      date_limite: true,
      montant_fixe: true,
      membres_concernes: {
        select: {
          id_membre_groupe: true,
          membre: { select: { id_user: true } },
        },
      },
      paiements: {
        select: { id_membre_groupe: true, montant_paye: true },
      },
    },
  });

  const today = startOfDay(new Date());

  for (const rubrique of rubriques) {
    const planning: RubriquePlanningInput = {
      type_rubrique: rubrique.type_rubrique,
      frequence: rubrique.frequence,
      date_debut: rubrique.date_debut,
      date_limite: rubrique.date_limite,
    };

    const echeance = getCurrentEcheance(planning);
    if (!echeance) continue;

    const daysLeft = getDaysUntilEcheance(echeance, today);
    if (daysLeft === null || !REMINDER_DAYS.includes(daysLeft as (typeof REMINDER_DAYS)[number])) {
      continue;
    }

    const due = Number(rubrique.montant_fixe);

    for (const mc of rubrique.membres_concernes) {
      const paid = rubrique.paiements
        .filter((p) => p.id_membre_groupe === mc.id_membre_groupe)
        .reduce((acc, p) => acc + Number(p.montant_paye), 0);

      const reste = Math.round((due - paid) * 100) / 100;
      if (reste <= 0) continue;

      const marker = reminderMarker(rubrique.id_rubrique, daysLeft);
      const since = subDays(today, 1);

      const alreadySent = await prisma.notificationGroupe.findFirst({
        where: {
          id_user: mc.membre.id_user,
          id_groupe: rubrique.id_groupe,
          type_notification: "RAPPEL_ECHEANCE",
          message: { contains: marker },
          date_creation: { gte: since },
        },
        select: { id_notification: true },
      });

      if (alreadySent) continue;

      const dayLabel = daysLeft === 1 ? "demain" : `dans ${daysLeft} jours`;

      await createNotification({
        userId: mc.membre.id_user,
        groupId: rubrique.id_groupe,
        type: "RAPPEL_ECHEANCE",
        message: `${marker} Rappel : il reste ${reste.toLocaleString("fr-FR")} XAF à régler pour « ${rubrique.nom} » (${dayLabel}).`,
      });
    }
  }
}
