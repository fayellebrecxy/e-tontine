"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Clock, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export type DashboardNotification = {
  id_notification: string;
  type_notification: string;
  message: string;
  date_creation: string;
  date_lecture: string | null;
};

const notificationLabel = (type: string) => {
  switch (type) {
    case "GROUP_UPDATED":
      return "Mise à jour du groupe";
    case "GROUP_DELETED":
      return "Suppression du groupe";
    case "PRET_DEMANDE":
      return "Demande de prêt";
    case "PRET_AVALISTE_DEMANDE":
      return "Demande de garantie";
    case "PRET_AVALISTE_ACCEPTE":
      return "Contrat avaliste";
    case "PRET_AVALISTE_REFUSE":
      return "Avaliste refusé";
    case "PRET_APPROUVE":
      return "Prêt approuvé";
    case "PRET_REFUSE":
      return "Prêt refusé";
    case "PRET_ANNULE":
      return "Prêt annulé";
    case "PRET_DECAISSEMENT":
      return "Prêt versé";
    case "PRET_REMBOURSEMENT":
      return "Remboursement prêt";
    case "PRET_SAISIE_GARANTIE":
      return "Saisie garantie";
    case "PRET_REDISTRIBUTION":
      return "Redistribution intérêts";
    default:
      return "Notification";
  }
};

export function DashboardNotifications({
  initialNotifications,
}: {
  initialNotifications: DashboardNotification[];
}) {
  const router = useRouter();
  const [notifications, setNotifications] = React.useState(initialNotifications);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [deletingAll, setDeletingAll] = React.useState(false);

  const refreshCounters = () => {
    router.refresh();
  };

  const deleteNotification = async (id: string) => {
    if (deletingId || deletingAll) return;
    setDeletingId(id);

    const previousNotifications = notifications;
    setNotifications((current) =>
      current.filter((notification) => notification.id_notification !== id),
    );

    try {
      const res = await fetch(`/api/notifications/${id}`, { method: "DELETE" });
      if (!res.ok) {
        setNotifications(previousNotifications);
        toast.error("Impossible de supprimer cette notification.");
        return;
      }

      toast.success("Notification supprimée.");
      refreshCounters();
    } catch {
      setNotifications(previousNotifications);
      toast.error("Impossible de supprimer cette notification.");
    } finally {
      setDeletingId(null);
    }
  };

  const deleteAll = async () => {
    if (deletingAll || notifications.length === 0) return;
    setDeletingAll(true);

    const previousNotifications = notifications;
    setNotifications([]);

    try {
      const res = await fetch("/api/notifications", { method: "DELETE" });
      if (!res.ok) {
        setNotifications(previousNotifications);
        toast.error("Impossible de supprimer les notifications.");
        return;
      }

      toast.success("Notifications supprimées.");
      refreshCounters();
    } catch {
      setNotifications(previousNotifications);
      toast.error("Impossible de supprimer les notifications.");
    } finally {
      setDeletingAll(false);
    }
  };

  if (!notifications.length) {
    return (
      <div className="mt-4 rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-white/15 dark:text-slate-400">
        Aucune notification pour le moment.
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-3">
      <div className="flex justify-end">
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
          disabled={deletingAll}
          onClick={deleteAll}
        >
          <X className="h-4 w-4" />
          {deletingAll ? "Suppression..." : "Tout supprimer"}
        </Button>
      </div>

      {notifications.map((notification) => (
        <div
          key={notification.id_notification}
          className="rounded-lg bg-[#fbfaf7] p-3 dark:bg-white/5"
        >
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-medium text-slate-950 dark:text-white">
              {notificationLabel(notification.type_notification)}
            </p>
            <div className="flex shrink-0 items-center gap-1">
              <Clock className="h-4 w-4 text-slate-400" />
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                disabled={deletingId === notification.id_notification || deletingAll}
                onClick={() => deleteNotification(notification.id_notification)}
                aria-label="Supprimer la notification"
                title="Supprimer"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <p className="mt-1 text-sm leading-5 text-slate-600 dark:text-slate-300">
            {notification.message}
          </p>
          <p className="mt-2 text-xs text-slate-400">
            {new Date(notification.date_creation).toLocaleString("fr-FR")}
          </p>
        </div>
      ))}
    </div>
  );
}
