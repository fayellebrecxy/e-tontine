"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Users, UserCircle, ChevronDown, ChevronRight } from "lucide-react";

import { useSidebar } from "@/components/layout/sidebar-context";

type GroupItem = {
  id_groupe: string;
  nom: string;
};

type GroupApiItem = {
  groupe: GroupItem;
};

export function AppSidebar() {
  const pathname = usePathname();
  const { isExpanded, isHovered, isMobileOpen, setIsHovered } = useSidebar();
  const [groups, setGroups] = React.useState<GroupItem[]>([]);
  const [groupsOpen, setGroupsOpen] = React.useState(false);

  const isActive = React.useCallback((path: string) => pathname === path, [pathname]);

  React.useEffect(() => {
    let isMounted = true;

    const load = async () => {
      const res = await fetch("/api/groups", { cache: "no-store" });
      const body = (await res.json().catch(() => null)) as
        | null
        | { ok?: boolean; groups?: GroupApiItem[] };
      if (!isMounted) return;
      if (res.ok && body?.ok && body.groups) {
        setGroups(body.groups.map((item) => item.groupe));
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, []);

  React.useEffect(() => {
    if (pathname.startsWith("/dashboard/groups")) {
      setGroupsOpen(true);
    }
  }, [pathname]);

  const sidebarWidth = isExpanded || isHovered || isMobileOpen ? "w-72" : "w-20";

  return (
    <aside
      className={`fixed left-0 top-0 z-40 h-screen border-r border-gray-200 bg-white px-3 py-4 transition-all duration-200 dark:border-gray-800 dark:bg-gray-900 lg:translate-x-0 ${
        isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      } ${sidebarWidth}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex h-full flex-col gap-6">
        <div className="flex items-center gap-3 px-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 text-white">
            ET
          </div>
          {(isExpanded || isHovered || isMobileOpen) && (
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">E-Tontine</p>
              <p className="text-xs text-gray-500">Gestion des groupes</p>
            </div>
          )}
        </div>

        <nav className="flex flex-1 flex-col gap-2">
          <Link
            href="/dashboard"
            className={`menu-item ${isActive("/dashboard") ? "menu-item-active" : "menu-item-inactive"}`}
          >
            <LayoutGrid className="h-5 w-5" />
            {(isExpanded || isHovered || isMobileOpen) && <span>Dashboard</span>}
          </Link>

          <button
            type="button"
            onClick={() => setGroupsOpen((prev) => !prev)}
            className={`menu-item justify-between ${
              pathname.startsWith("/dashboard/groups") ? "menu-item-active" : "menu-item-inactive"
            }`}
          >
            <span className="flex items-center gap-3">
              <Users className="h-5 w-5" />
              {(isExpanded || isHovered || isMobileOpen) && <span>Groupes</span>}
            </span>
            {(isExpanded || isHovered || isMobileOpen) &&
              (groupsOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />)}
          </button>

          {groupsOpen && (isExpanded || isHovered || isMobileOpen) && (
            <div className="ml-2 space-y-1">
              <Link
                href="/dashboard/groups"
                className={`menu-dropdown-item ${
                  pathname === "/dashboard/groups"
                    ? "menu-dropdown-item-active"
                    : "menu-dropdown-item-inactive"
                }`}
              >
                Tous les groupes
              </Link>
              {groups.map((group) => (
                <Link
                  key={group.id_groupe}
                  href={`/dashboard/groups/${group.id_groupe}/members`}
                  className={`menu-dropdown-item ${
                    pathname.includes(group.id_groupe)
                      ? "menu-dropdown-item-active"
                      : "menu-dropdown-item-inactive"
                  }`}
                >
                  {group.nom}
                </Link>
              ))}
            </div>
          )}

          <Link
            href="/account"
            className={`menu-item ${isActive("/account") ? "menu-item-active" : "menu-item-inactive"}`}
          >
            <UserCircle className="h-5 w-5" />
            {(isExpanded || isHovered || isMobileOpen) && <span>Compte</span>}
          </Link>
        </nav>
      </div>
    </aside>
  );
}
