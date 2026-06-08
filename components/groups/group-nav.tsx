"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Mail,
  Settings,
  Repeat,
  Landmark,
  CalendarDays,
  Wallet,
} from "lucide-react";

const allItems = [
  { label: "Apercu", href: "", icon: LayoutDashboard, adminOnly: false },
  { label: "Membres", href: "members", icon: Users, adminOnly: false },
  { label: "Invitations", href: "invitations", icon: Mail, adminOnly: true },
  { label: "Rubriques", href: "rubriques", icon: Landmark, adminOnly: false },
  { label: "Cycles", href: "cycles", icon: Repeat, adminOnly: false },
  { label: "Réunions", href: "reunions", icon: CalendarDays, adminOnly: false },
  { label: "Finances", href: "finances", icon: Wallet, adminOnly: false },
  { label: "Parametres", href: "settings", icon: Settings, adminOnly: true },
];

export function GroupNav({ groupId, isAdmin = false }: { groupId: string; isAdmin?: boolean }) {
  const pathname = usePathname();
  const items = allItems.filter((item) => !item.adminOnly || isAdmin);

  return (
    <div className="space-y-3">
      <h2 className="px-2 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
        Menu du groupe
      </h2>
      <nav className="flex gap-2 overflow-x-auto pb-1 lg:block lg:space-y-1 lg:overflow-visible lg:pb-0">
        {items.map((item) => {
          const href = item.href
            ? `/dashboard/groups/${groupId}/${item.href}`
            : `/dashboard/groups/${groupId}`;
          const Icon = item.icon;
          const active = item.href
            ? pathname.startsWith(href)
            : pathname === `/dashboard/groups/${groupId}`;

          return (
            <Link
              key={item.href}
              href={href}
              className={`flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition ${
                active
                  ? "bg-slate-950 text-white dark:bg-white dark:text-slate-950"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
