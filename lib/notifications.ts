import { prisma } from "./prisma";

export type NotificationType = 
  | "PAIEMENT_RECU"
  | "PENALITE_APPLIQUEE"
  | "INVITATION_RECU"
  | "NOUVEAU_MEMBRE"
  | "RAPPEL_ECHEANCE"
  | "NOUVEAU_CYCLE"
  | "NOUVELLE_RUBRIQUE";

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
