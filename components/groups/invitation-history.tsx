"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export type InvitationHistoryItem = {
  id_invitation: string;
  code: string;
  date_creation: string;
  date_revocation: string | null;
};

type InvitationHistoryProps = {
  groupId: string;
  items: InvitationHistoryItem[];
};

export function InvitationHistory({ groupId, items }: InvitationHistoryProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  const deleteInvitation = async (item: InvitationHistoryItem) => {
    if (deletingId) return;

    const confirmed = window.confirm(
      "Supprimer cette invitation de l'historique ? Cette action est definitive.",
    );
    if (!confirmed) return;

    setDeletingId(item.id_invitation);
    try {
      const res = await fetch(
        `/api/groups/${encodeURIComponent(groupId)}/invitations?invitationId=${encodeURIComponent(item.id_invitation)}`,
        { method: "DELETE" },
      );
      const body = (await res.json().catch(() => null)) as null | { ok?: boolean; error?: string };

      if (!res.ok || !body?.ok) {
        toast.error(body?.error ?? "Impossible de supprimer cette invitation.");
        return;
      }

      toast.success("Invitation supprimee de l'historique.");
      router.refresh();
    } finally {
      setDeletingId(null);
    }
  };

  if (!items.length) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-6 text-sm text-gray-500 dark:border-gray-800 dark:bg-gray-900">
        Aucun ancien lien d'invitation.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="border-b border-gray-200 px-4 py-3 text-sm font-semibold text-gray-900 dark:border-gray-800 dark:text-white">
        Historique des invitations
      </div>
      <div className="divide-y divide-gray-200 dark:divide-gray-800">
        {items.map((item) => (
          <div
            key={item.id_invitation}
            className="flex flex-col gap-2 px-4 py-3 text-sm md:flex-row md:items-center md:justify-between"
          >
            <div className="space-y-1">
              <p className="font-medium text-gray-900 dark:text-gray-100">{item.code}</p>
              <p className="text-xs text-gray-500">
                Cree le {new Date(item.date_creation).toLocaleString("fr-FR")}
                {item.date_revocation ? " · Revoquee" : " · Ancien lien"}
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
              disabled={deletingId === item.id_invitation}
              onClick={() => deleteInvitation(item)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {deletingId === item.id_invitation ? "Suppression…" : "Supprimer"}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
