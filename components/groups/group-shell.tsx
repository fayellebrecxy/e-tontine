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
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let isMounted = true;

    const load = async () => {
      const [groupsRes, membersRes] = await Promise.all([
        fetch("/api/groups", { cache: "no-store" }),
        fetch(`/api/groups/${groupId}/members`, { cache: "no-store" }),
      ]);

      const groupsBody = (await groupsRes.json().catch(() => null)) as
        | null
        | { ok?: boolean; groups?: GroupApiItem[] };
      const membersBody = (await membersRes.json().catch(() => null)) as
        | null
        | MembersApiBody;

      if (!isMounted) return;

      if (groupsRes.ok && groupsBody?.ok && groupsBody.groups) {
        const found = groupsBody.groups.find((item) => item.groupe.id_groupe === groupId);
        setGroup(found?.groupe ?? null);
      }

      if (membersRes.ok && membersBody?.ok && membersBody.members) {
        setMembers(membersBody.members);
      }

      setLoading(false);
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [groupId]);

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
          {loading ? "..." : `${members.length} membres`}
          {group?.devise ? <span className="ml-2 rounded-full bg-gray-100 px-2 py-1 text-xs">{group.devise}</span> : null}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="min-w-0">{children}</div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <GroupNav groupId={groupId} />
          </div>

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
                      <p className="text-xs text-gray-500">{member.role === "ADMIN" ? "Admin" : "Membre"}</p>
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
        </aside>
      </div>
    </div>
  );
}
