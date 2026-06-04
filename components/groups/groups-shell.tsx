"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type GroupItem = {
  id_groupe: string;
  nom: string;
  description?: string | null;
};

type GroupApiItem = {
  groupe: GroupItem;
};

export function GroupsShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [groups, setGroups] = React.useState<GroupItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");

  React.useEffect(() => {
    let isMounted = true;
    const load = async () => {
      const res = await fetch("/api/groups?include_inactive=1", { cache: "no-store" });
      const body = (await res.json().catch(() => null)) as
        | null
        | { ok?: boolean; groups?: GroupApiItem[] };
      if (!isMounted) return;
      if (res.ok && body?.ok && body.groups) {
        setGroups(body.groups.map((item) => item.groupe));
      }
      setLoading(false);
    };

    load();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredGroups = groups.filter((g) =>
    g.nom.toLowerCase().includes(search.toLowerCase()) ||
    (g.description ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="flex gap-6">
      <aside className="hidden w-72 shrink-0 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900 lg:block">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Groupes</h2>
          <Button asChild size="icon" variant="ghost">
            <Link href="/dashboard/groups/new" aria-label="Creer un groupe">
              <Plus className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="relative mt-3">
          <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Rechercher un groupe…"
            className="pl-7 h-8 text-xs"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="mt-3 space-y-1">
          {loading ? (
            <p className="text-xs text-gray-500">Chargement...</p>
          ) : filteredGroups.length ? (
            filteredGroups.map((group) => (
              <Link
                key={group.id_groupe}
                href={`/dashboard/groups/${group.id_groupe}`}
                className={`block rounded-lg px-3 py-2 text-sm font-medium transition ${
                  pathname.includes(group.id_groupe)
                    ? "bg-brand-50 text-brand-600"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
                }`}
              >
                <p className="truncate">{group.nom}</p>
                {group.description ? (
                  <p className="truncate text-xs text-gray-400">{group.description}</p>
                ) : null}
              </Link>
            ))
          ) : (
            <p className="text-xs text-gray-500">
              {search ? "Aucun groupe trouvé." : "Aucun groupe."}
            </p>
          )}
        </div>
      </aside>

      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
