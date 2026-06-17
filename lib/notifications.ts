import { prisma } from "./prisma";

export type NotificationType = 
  | "PAIEMENT_RECU"
  | "PENALITE_APPLIQUEE"
  | "INVITATION_RECU"
  | "NOUVEAU_MEMBRE"
  | "RAPPEL_ECHEANCE"
  | "NOUVEAU_CYCLE"
  | "NOUVELLE_RUBRIQUE"
  // Réunions
  | "REUNION_PLANIFIEE"
  | "REUNION_ANNULEE"
  | "REUNION_PRESENCE"
  | "REUNION_EXCUSE"
  | "REUNION_COMPTE_RENDU"
  | "RAPPEL_REUNION_J1"
  | "RAPPEL_REUNION_J2"
  | "AMENDE_PAYEE"
  // Épargne
  | "EPARGNE_COMPTE_OUVERT"
  | "EPARGNE_OPERATION"
  | "EPARGNE_SIGNALEMENT"
  // Prêts
  | "PRET_DEMANDE"
  | "PRET_AVALISTE_DEMANDE"
  | "PRET_AVALISTE_ACCEPTE"
  | "PRET_AVALISTE_REFUSE"
  | "PRET_APPROUVE"
  | "PRET_REFUSE"
  | "PRET_ANNULE"
  | "PRET_DECAISSEMENT"
  | "PRET_REMBOURSEMENT"
  | "PRET_SAISIE_GARANTIE"
  | "PRET_REDISTRIBUTION";

export async function createNotification({
  userId,
  groupId,
  message,
  type,
}: {
  userId: string;
  groupId?: string;
  message: string;
  type: NotificationType;
}) {
  try {
    return await prisma.notificationGroupe.create({
      data: {
        id_user: userId,
        id_groupe: groupId,
        message,
        type_notification: type,
      },
    });
  } catch (error) {
    console.error("Erreur lors de la création de la notification:", error);
  }
}

// Helper : notifier par id_membre_groupe (résout automatiquement l'id_user)
export async function notifyMembre({
  id_membre_groupe,
  titre,
  message,
  type,
}: {
  id_membre_groupe: string;
  titre?: string;
  message: string;
  type: NotificationType;
}) {
  try {
    const membre = await prisma.membreGroupe.findUnique({
      where: { id_membre_groupe },
      select: { id_user: true, id_groupe: true },
    });
    if (!membre) return;
    return await createNotification({
      userId: membre.id_user,
      groupId: membre.id_groupe,
      message: titre ? `${titre} : ${message}` : message,
      type,
    });
  } catch (error) {
    console.error("Erreur notifyMembre:", error);
  }
}

/** Marque comme lues les notifications d'approbation devenues obsolètes après décaissement. */
export async function markStalePretApprovalNotificationsRead({
  userId,
  groupId,
}: {
  userId: string;
  groupId: string;
}) {
  try {
    await prisma.notificationGroupe.updateMany({
      where: {
        id_user: userId,
        id_groupe: groupId,
        type_notification: "PRET_APPROUVE",
        date_lecture: null,
      },
      data: { date_lecture: new Date() },
    });
  } catch (error) {
    console.error("Erreur markStalePretApprovalNotificationsRead:", error);
  }
}

export function filterStalePretApprovalNotifications<
  T extends { type_notification: string; id_groupe: string | null },
>(notifications: T[], disbursedGroupIds: Set<string>): T[] {
  return notifications.filter(
    (n) =>
      n.type_notification !== "PRET_APPROUVE" ||
      !n.id_groupe ||
      !disbursedGroupIds.has(n.id_groupe),
  );
}

export async function notifyGroupAdmins({
  groupId,
  message,
  type,
}: {
  groupId: string;
  message: string;
  type: NotificationType;
}) {
  try {
    const admins = await prisma.membreGroupe.findMany({
      where: {
        id_groupe: groupId,
        role: "ADMIN",
        statut_adhesion: "ACTIF",
      },
      select: { id_user: true },
    });

    const notifications = admins.map((admin) =>
      createNotification({
        userId: admin.id_user,
        groupId,
        message,
        type,
      })
    );

    await Promise.all(notifications);
  } catch (error) {
    console.error("Erreur lors de la notification des admins:", error);
  }
}
