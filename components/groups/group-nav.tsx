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
  PiggyBank,
  HandCoins,
} from "lucide-react";

const allItems = [
  { label: "Apercu", href: "", icon: LayoutDashboard, adminOnly: false },
  { label: "Membres", href: "members", icon: Users, adminOnly: false },
  { label: "Invitations", href: "invitations", icon: Mail, adminOnly: true },
  { label: "Rubriques", href: "rubriques", icon: Landmark, adminOnly: false },
  { label: "Cycles", href: "cycles", icon: Repeat, adminOnly: false },
  { label: "Réunions", href: "reunions", icon: CalendarDays, adminOnly: false },
  { label: "Épargne", href: "epargne", icon: PiggyBank, adminOnly: false },
  { label: "Prêts", href: "prets", icon: HandCoins, adminOnly: false },
  { label: "Finances", href: "finances", icon: Wallet, adminOnly: false },
  { label: "Parametres", href: "settings", icon: Settings, adminOnly: true },
];

export function GroupNav({ groupId, isAdmin = false }: { groupId: string; isAdmin?: boolean }) {
  const pathname = usePathname();
  const items = allItems.filter((item) => !item.adminOnly || isAdmin);

  return (
    <div className="space-y-3">
      <h2 className="px-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
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
              className={`flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2.5 font-sans text-sm font-medium transition-colors ${
                active
                  ? "bg-primary/10 text-primary"
                  : "text-on-surface-variant hover:bg-surface-container-low hover:text-primary"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
