"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  ChevronRight,
  LayoutGrid,
  Plus,
  UserCircle,
  Users,
  Wallet,
  Settings,
  LogOut,
} from "lucide-react";

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
  const isVisible = isExpanded || isHovered || isMobileOpen;

  React.useEffect(() => {
    let isMounted = true;
    const load = async () => {
      const res = await fetch("/api/groups", { cache: "no-store" });
      const body = (await res.json().catch(() => null)) as null | {
        ok?: boolean;
        groups?: GroupApiItem[];
      };
      if (!isMounted) return;
      if (res.ok && body?.ok && body.groups) {
        setGroups(body.groups.map((item) => item.groupe));
      }
    };
    load();
    return () => { isMounted = false; };
  }, []);

  React.useEffect(() => {
    if (pathname.startsWith("/dashboard/groups")) {
      setGroupsOpen(true);
    }
  }, [pathname]);

  const sidebarWidth = isVisible ? "w-64" : "w-20";

  return (
    <aside
      className={`fixed left-0 top-0 z-50 h-screen bg-[#00164e] border-r border-[#264191]/30 px-3 py-4 text-white transition-all duration-200 lg:translate-x-0 flex flex-col ${
        isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      } ${sidebarWidth}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Brand */}
      <div className="flex items-center gap-3 px-3 h-16 border-b border-[#264191]/30 mb-4 shrink-0">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/20 shrink-0">
          <Wallet className="h-5 w-5 text-[#62df7d]" />
        </div>
        {isVisible && (
          <span className="font-heading text-lg font-semibold text-white tracking-tight truncate">
            E-Tontine
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto overflow-x-hidden">
        <Link
          href="/dashboard"
          className={`menu-item ${isActive("/dashboard") ? "menu-item-active" : "menu-item-inactive"}`}
          title={!isVisible ? "Dashboard" : undefined}
        >
          <LayoutGrid className="h-5 w-5 shrink-0" />
          {isVisible && <span>Dashboard</span>}
        </Link>

        <button
          type="button"
          onClick={() => setGroupsOpen((prev) => !prev)}
          className={`menu-item justify-between ${
            pathname.startsWith("/dashboard/groups") ? "menu-item-active" : "menu-item-inactive"
          }`}
          title={!isVisible ? "Groupes" : undefined}
        >
          <span className="flex items-center gap-3">
            <Users className="h-5 w-5 shrink-0" />
            {isVisible && <span>Groupes</span>}
          </span>
          {isVisible && (
            groupsOpen ? (
              <ChevronDown className="h-4 w-4 shrink-0" />
            ) : (
              <ChevronRight className="h-4 w-4 shrink-0" />
            )
          )}
        </button>

        {groupsOpen && isVisible && (
          <div className="ml-4 pl-2 border-l border-[#264191]/40 space-y-0.5">
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
            <Link
              href="/dashboard/groups/new"
              className={`menu-dropdown-item ${
                pathname === "/dashboard/groups/new"
                  ? "menu-dropdown-item-active"
                  : "menu-dropdown-item-inactive"
              }`}
            >
              <span className="inline-flex items-center gap-2">
                <Plus className="h-3.5 w-3.5" />
                Créer un groupe
              </span>
            </Link>
            {groups.map((group) => (
              <Link
                key={group.id_groupe}
                href={`/dashboard/groups/${group.id_groupe}`}
                className={`menu-dropdown-item truncate ${
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

        <div className="my-3 border-t border-[#264191]/30" />

        <Link
          href="/account"
          className={`menu-item ${isActive("/account") ? "menu-item-active" : "menu-item-inactive"}`}
          title={!isVisible ? "Compte" : undefined}
        >
          <UserCircle className="h-5 w-5 shrink-0" />
          {isVisible && <span>Compte</span>}
        </Link>

        <Link
          href="/dashboard"
          className="menu-item menu-item-inactive"
          title={!isVisible ? "Paramètres" : undefined}
        >
          <Settings className="h-5 w-5 shrink-0" />
          {isVisible && <span>Paramètres</span>}
        </Link>
      </nav>

      {/* Bottom: logout */}
      <div className="pt-3 border-t border-[#264191]/30 shrink-0">
        <form action="/logout" method="post">
          <button
            type="submit"
            className="menu-item menu-item-inactive w-full"
            title={!isVisible ? "Se déconnecter" : undefined}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {isVisible && <span>Se déconnecter</span>}
          </button>
        </form>
      </div>
    </aside>
  );
}
