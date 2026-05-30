"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings, Users } from "lucide-react";

import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "./app-sidebar";

type GroupItem = {
  id_groupe: string;
  nom: string;
  description?: string | null;
  devise?: string;
};

type MembershipItem = {
  id_membre_groupe: string;
  role: "ADMIN" | "MEMBRE";
  statut_adhesion: "ACTIF" | "INACTIF" | "EN_ATTENTE";
  statut_visuel: string;
  date_adhesion: string | Date;
  date_depart?: string | Date | null;
};

type MemberItem = {
  id_membre_groupe: string;
  role: "ADMIN" | "MEMBRE";
  user: {
    id_user: string;
    nom: string;
    prenom: string;
  };
};

type GroupApiItem = {
  groupe: GroupItem;
};

type GroupSummaryBody = {
  ok?: boolean;
  groupe?: GroupItem;
  membership?: MembershipItem;
};

type MembersApiBody = {
  ok?: boolean;
  members?: MemberItem[];
};

export function GroupShell({
  groupId,
  children,
}: {
  groupId: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [group, setGroup] = React.useState<GroupItem | null>(null);
  const [members, setMembers] = React.useState<MemberItem[]>([]);
  const [membership, setMembership] = React.useState<MembershipItem | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [pendingRejoin, setPendingRejoin] = React.useState(false);

  React.useEffect(() => {
    let isMounted = true;

    const load = async () => {
      const summaryRes = await fetch(`/api/groups/${groupId}`, { cache: "no-store" });
      const summaryBody = (await summaryRes.json().catch(() => null)) as
        | null
        | GroupSummaryBody;

      if (!isMounted) return;

      if (summaryRes.ok && summaryBody?.ok) {
        setGroup(summaryBody.groupe ?? null);
        setMembership(summaryBody.membership ?? null);
      }

      if (summaryBody?.membership?.statut_adhesion === "ACTIF") {
        const membersRes = await fetch(`/api/groups/${groupId}/members`, { cache: "no-store" });
        const membersBody = (await membersRes.json().catch(() => null)) as
          | null
          | MembersApiBody;

        if (membersRes.ok && membersBody?.ok && membersBody.members) {
          setMembers(membersBody.members);
        }
      }

      setLoading(false);
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [groupId]);

  const requestRejoin = () => {
    if (pendingRejoin || membership?.statut_adhesion !== "INACTIF") return;
    setPendingRejoin(true);

    fetch(`/api/groups/${groupId}/rejoin`, { method: "POST" })
      .then(async (res) => {
        const body = (await res.json().catch(() => null)) as
          | null
          | { ok?: boolean; error?: string; pending?: boolean };

        if (!res.ok || !body?.ok) {
          return;
        }

        setMembership((current) =>
          current ? { ...current, statut_adhesion: "EN_ATTENTE" } : current,
        );
      })
      .finally(() => setPendingRejoin(false));
  };

  const isActive = membership?.statut_adhesion === "ACTIF";
  const isInactive = membership?.statut_adhesion === "INACTIF";
  const isPending = membership?.statut_adhesion === "EN_ATTENTE";

  if (!isActive) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            {group?.nom ?? "Chargement..."}
          </h1>
          <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            {isInactive ? (
              <p>Vous avez été exclu de ce groupe.</p>
            ) : isPending ? (
              <p>Votre demande de réintégration est en attente.</p>
            ) : (
              <p>Accès limité.</p>
            )}
          </div>
          {isInactive && (
            <Button
              type="button"
              className="mt-6 w-full"
              disabled={pendingRejoin}
              onClick={requestRejoin}
            >
              Demander à réintégrer
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar
        groupId={groupId}
        groupName={group?.nom ?? ""}
        isAdmin={membership?.role === "ADMIN"}
      />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex flex-1 items-center justify-between">
            <h1 className="text-sm font-semibold truncate">
              {group?.nom}
            </h1>
            {group?.devise && (
              <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium dark:bg-gray-800">
                {group.devise}
              </span>
            )}
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 lg:p-6">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
