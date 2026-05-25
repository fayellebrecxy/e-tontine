"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings, Trash2, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { GroupNav } from "@/components/groups/group-nav";

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase text-gray-400">Groupe</p>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            {group?.nom ?? "Chargement..."}
          </h1>
          {group?.description ? (
            <p className="mt-1 text-sm text-gray-500">{group.description}</p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
          <Users className="h-4 w-4" />
          {loading ? "..." : isActive ? `${members.length} membres` : "Acces limite"}
          {group?.devise ? (
            <span className="ml-2 rounded-full bg-gray-100 px-2 py-1 text-xs">{group.devise}</span>
          ) : null}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="min-w-0">{children}</div>

        <aside className="space-y-4">
          {isActive ? (
            <>
              <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                <GroupNav groupId={groupId} />
              </div>

              {membership?.role === "ADMIN" ? (
                <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                  <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Actions</h2>
                  <div className="mt-3 flex flex-col gap-2">
                    <Button asChild variant="outline" className="justify-start">
                      <Link href={`/dashboard/groups/${groupId}/settings`}>
                        <Settings className="mr-2 h-4 w-4" />
                        Mettre a jour
                      </Link>
                    </Button>
                    <Button asChild variant="destructive" className="justify-start">
                      <Link href={`/dashboard/groups/${groupId}/settings`}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Supprimer
                      </Link>
                    </Button>
                  </div>
                </div>
              ) : null}

              <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Membres</h2>
                <div className="mt-3 space-y-2">
                  {loading ? (
                    <p className="text-xs text-gray-500">Chargement...</p>
                  ) : members.length ? (
                    members.map((member) => (
                      <div key={member.id_membre_groupe} className="flex items-center justify-between">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-gray-800 dark:text-gray-200">
                            {member.user.prenom} {member.user.nom}
                          </p>
                          <p className="text-xs text-gray-500">
                            {member.role === "ADMIN" ? "Admin" : "Membre"}
                          </p>
                        </div>
                        {member.role === "ADMIN" ? (
                          <span className="rounded-full bg-brand-50 px-2 py-1 text-xs font-semibold text-brand-600">
                            ADMIN
                          </span>
                        ) : (
                          <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-500">
                            MEMBRE
                          </span>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-500">Aucun membre.</p>
                  )}
                </div>

                <div className="mt-4">
                  <Button
                    asChild
                    variant={pathname.endsWith("/members") ? "default" : "outline"}
                    className="w-full justify-start"
                  >
                    <Link href={`/dashboard/groups/${groupId}/members`}>
                      <Users className="mr-2 h-4 w-4" />
                      Voir les membres
                    </Link>
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-600 dark:border-gray-800 dark:bg-gray-900">
              <p className="font-semibold text-gray-900 dark:text-white">Acces limite</p>
              {isInactive ? (
                <p className="mt-2">Vous avez ete exclu de ce groupe.</p>
              ) : null}
              {isPending ? (
                <p className="mt-2">Votre demande de reintegration est en attente.</p>
              ) : null}
              {isInactive ? (
                <Button
                  type="button"
                  className="mt-4 w-full"
                  disabled={pendingRejoin}
                  onClick={requestRejoin}
                >
                  Demander a reintegrer
                </Button>
              ) : null}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
