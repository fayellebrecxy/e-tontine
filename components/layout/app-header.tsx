"use client";

import Link from "next/link";
import { LogOut, Menu, PlusCircle, UserCircle } from "lucide-react";

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
    <header className="sticky top-0 z-30 w-full border-b border-slate-200/80 bg-white/85 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/80">
      <div className="flex min-h-16 flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <button
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
            onClick={handleToggle}
            aria-label="Toggle sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div>
            <Link
              href="/dashboard"
              className="text-base font-semibold text-slate-950 dark:text-white"
            >
              E-Tontine
            </Link>
            <p className="hidden text-xs text-slate-500 dark:text-slate-400 sm:block">
              Votre espace de gestion
            </p>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-end gap-2">
          <nav className="flex items-center gap-1 sm:gap-2">
            <JoinGroupDialog variant="ghost" className="hidden h-9 rounded-md sm:flex" />
            <NotificationCenter />
            <Button asChild variant="ghost" size="icon" title="Compte">
              <Link href="/account" aria-label="Compte">
                <UserCircle className="h-4 w-4" />
              </Link>
            </Button>
            <form action="/logout" method="post">
              <Button type="submit" variant="outline" size="icon" title="Se déconnecter">
                <LogOut className="h-4 w-4" />
              </Button>
            </form>
            <Button
              asChild
              size="sm"
              className="hidden bg-green-600 text-white hover:bg-green-700 md:inline-flex"
            >
              <Link href="/dashboard/groups/new">
                <PlusCircle className="mr-2 h-4 w-4" />
                Nouveau groupe
              </Link>
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
}
