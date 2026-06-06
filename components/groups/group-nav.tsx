"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Mail, Settings, Repeat, Landmark, CalendarDays } from "lucide-react";

const allItems = [
  { label: "Apercu", href: "", icon: LayoutDashboard, adminOnly: false },
  { label: "Membres", href: "members", icon: Users, adminOnly: false },
  { label: "Invitations", href: "invitations", icon: Mail, adminOnly: true },
  { label: "Rubriques", href: "rubriques", icon: Landmark, adminOnly: false },
  { label: "Cycles", href: "cycles", icon: Repeat, adminOnly: false },
  { label: "Réunions", href: "reunions", icon: CalendarDays, adminOnly: false },
  { label: "Parametres", href: "settings", icon: Settings, adminOnly: true },
];

export function GroupNav({ groupId, isAdmin = false }: { groupId: string; isAdmin?: boolean }) {
  const pathname = usePathname();
  const items = allItems.filter((item) => !item.adminOnly || isAdmin);

  return (
    <div className="space-y-2">
      <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Menu du groupe</h2>
      <nav className="space-y-1">
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
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                active
                  ? "bg-brand-50 text-brand-600"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800"
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
