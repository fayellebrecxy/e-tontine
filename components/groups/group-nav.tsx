"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Mail, Settings, ClipboardList, Repeat } from "lucide-react";

const items = [
  { label: "Apercu", href: "", icon: LayoutDashboard },
  { label: "Membres", href: "members", icon: Users },
  { label: "Invitations", href: "invitations", icon: Mail },
  { label: "Parametres", href: "settings", icon: Settings },
  { label: "Regles", href: "regles", icon: ClipboardList },
  { label: "Cycles", href: "cycles", icon: Repeat },
];

export function GroupNav({ groupId }: { groupId: string }) {
  const pathname = usePathname();

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
