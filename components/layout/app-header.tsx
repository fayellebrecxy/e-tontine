"use client";

import Link from "next/link";
import { Menu } from "lucide-react";

import { useSidebar } from "@/components/layout/sidebar-context";
import { Button } from "@/components/ui/button";
import { JoinGroupDialog } from "@/components/invitations/join-group-dialog";
import { NotificationCenter } from "@/components/notifications/notification-center";

export function AppHeader() {
  const { toggleSidebar, toggleMobileSidebar } = useSidebar();

  const handleToggle = () => {
    if (window.innerWidth >= 1024) {
      toggleSidebar();
    } else {
      toggleMobileSidebar();
    }
  };

  return (
    <header className="sticky top-0 z-30 w-full border-b bg-white/90 backdrop-blur dark:border-gray-800 dark:bg-gray-900/80">
      <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-3 lg:px-6">
        <div className="flex items-center gap-3">
          <button
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-800"
            onClick={handleToggle}
            aria-label="Toggle sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link href="/dashboard" className="text-base font-semibold text-gray-900 dark:text-white">
            E-Tontine
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-end gap-3">
          <nav className="flex items-center gap-2">
            <JoinGroupDialog variant="ghost" className="hidden sm:flex" />
            <NotificationCenter />
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard">Dashboard</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href="/account">Compte</Link>
            </Button>
            <form action="/logout" method="post">
              <Button type="submit" variant="outline" size="sm">
                Se deconnecter
              </Button>
            </form>
          </nav>
        </div>
      </div>
    </header>
  );
}
