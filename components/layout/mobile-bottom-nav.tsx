"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { LayoutGrid, Plus, UserCircle, Users } from "lucide-react";

type NavItem = {
  href: string;
  labelKey: "home" | "groups" | "account";
  icon: React.ComponentType<{ className?: string }>;
  match: (path: string) => boolean;
};

const items: NavItem[] = [
  {
    href: "/dashboard",
    labelKey: "home",
    icon: LayoutGrid,
    match: (p) => p === "/dashboard",
  },
  {
    href: "/dashboard/groups",
    labelKey: "groups",
    icon: Users,
    match: (p) => p.startsWith("/dashboard/groups"),
  },
  {
    href: "/account",
    labelKey: "account",
    icon: UserCircle,
    match: (p) => p.startsWith("/account"),
  },
];

/**
 * Barre de navigation mobile flottante avec glassmorphisme (style WhatsApp).
 * Visible uniquement sur petit écran.
 */
export function MobileBottomNav() {
  const pathname = usePathname();
  const t = useTranslations("nav");

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 px-4 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-2 lg:hidden">
      <div className="mx-auto flex max-w-md items-center justify-around gap-1 rounded-2xl border border-white/40 bg-white/70 px-2 py-2 shadow-[0_8px_32px_-8px_rgba(15,23,42,0.25)] backdrop-blur-xl">
        {/* 2 premiers items */}
        {items.slice(0, 2).map((item) => {
          const active = item.match(pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-1 flex-col items-center gap-0.5 rounded-xl py-1.5 transition-colors"
            >
              <span
                className={`flex h-8 w-12 items-center justify-center rounded-full transition-all ${
                  active ? "bg-primary/15 text-primary" : "text-on-surface-variant"
                }`}
              >
                <item.icon className="h-5 w-5" />
              </span>
              <span
                className={`font-sans text-[10px] font-medium ${
                  active ? "text-primary" : "text-on-surface-variant"
                }`}
              >
                {t(item.labelKey)}
              </span>
            </Link>
          );
        })}

        {/* FAB central */}
        <Link
          href="/dashboard/groups/new"
          aria-label="Nouveau groupe"
          className="-mt-6 flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary shadow-lg shadow-primary/30 ring-4 ring-white/80 transition-transform active:scale-95"
        >
          <Plus className="h-6 w-6" />
        </Link>

        {/* dernier item */}
        {items.slice(2).map((item) => {
          const active = item.match(pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-1 flex-col items-center gap-0.5 rounded-xl py-1.5 transition-colors"
            >
              <span
                className={`flex h-8 w-12 items-center justify-center rounded-full transition-all ${
                  active ? "bg-primary/15 text-primary" : "text-on-surface-variant"
                }`}
              >
                <item.icon className="h-5 w-5" />
              </span>
              <span
                className={`font-sans text-[10px] font-medium ${
                  active ? "text-primary" : "text-on-surface-variant"
                }`}
              >
                {t(item.labelKey)}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
