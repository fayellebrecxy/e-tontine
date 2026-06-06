/**
 * Envoie des rappels J-2 et J-1 pour les réunions planifiées.
 * Appelé périodiquement (depuis /api/cron/reunion-reminders ou au chargement des pages).
 */

import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import { addDays, startOfDay, endOfDay } from "date-fns";

export async function sendReunionReminders() {
  const now = new Date();

  const twoDaysFromNow = { gte: startOfDay(addDays(now, 2)), lte: endOfDay(addDays(now, 2)) };
  const oneDayFromNow = { gte: startOfDay(addDays(now, 1)), lte: endOfDay(addDays(now, 1)) };

  const reunionsDueForReminder = await prisma.reunion.findMany({
    where: {
      statut: "PLANIFIEE",
      date_reunion: { in: [twoDaysFromNow, oneDayFromNow] as never },
      OR: [
        { date_reunion: twoDaysFromNow },
        { date_reunion: oneDayFromNow },
      ],
    },
    select: {
      id_reunion: true,
      id_groupe: true,
      titre: true,
      date_reunion: true,
      lieu: true,
      groupe: {
        select: {
          membres: {
            where: { statut_adhesion: "ACTIF" },
            select: { id_user: true },
          },
        },
      },
    },
  });

  let sent = 0;

  for (const reunion of reunionsDueForReminder) {
    const daysUntil = Math.round(
      (reunion.date_reunion.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );
    const jourLabel = daysUntil <= 1 ? "demain" : "dans 2 jours";

    const heureStr = reunion.date_reunion.toLocaleTimeString("fr-FR", {
      hour: "2-digit", minute: "2-digit",
    });
    const lieu = reunion.lieu ? ` à ${reunion.lieu}` : "";

    const message = `📅 Rappel : la réunion "${reunion.titre}" a lieu ${jourLabel} à ${heureStr}${lieu}.`;

    await Promise.all(
      reunion.groupe.membres.map((m) =>
        createNotification({
          userId: m.id_user,
          groupId: reunion.id_groupe,
          type: daysUntil <= 1 ? "RAPPEL_REUNION_J1" : "RAPPEL_REUNION_J2",
          message,
        }),
      ),
    );

    sent += reunion.groupe.membres.length;
  }

  return { sent, reunions: reunionsDueForReminder.length };
}
