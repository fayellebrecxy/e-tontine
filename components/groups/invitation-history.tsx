"use client";

import * as React from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export type InvitationHistoryItem = {
  id_invitation: string;
  code: string;
  date_creation: string;
  date_revocation: string | null;
  lien: string;
};

type InvitationHistoryProps = {
  items: InvitationHistoryItem[];
};

export function InvitationHistory({ items }: InvitationHistoryProps) {
  const copyLink = async (link: string) => {
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Lien copie.");
    } catch {
      toast.error("Impossible de copier le lien.");
    }
  };

  if (!items.length) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-6 text-sm text-gray-500 dark:border-gray-800 dark:bg-gray-900">
        Aucun historique d'invitation.
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
          <div key={item.id_invitation} className="flex flex-col gap-2 px-4 py-3 text-sm md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <p className="font-medium text-gray-900 dark:text-gray-100">{item.code}</p>
              <p className="text-xs text-gray-500">
                Cree le {new Date(item.date_creation).toLocaleString("fr-FR")}
                {item.date_revocation ? " · Revoquee" : " · Active"}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="outline" onClick={() => copyLink(item.lien)}>
                Copier lien
              </Button>
              <Button asChild type="button" size="sm" variant="ghost">
                <a href={item.lien} target="_blank" rel="noreferrer">
                  Ouvrir
                </a>
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
