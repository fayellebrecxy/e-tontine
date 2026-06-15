"use client";

import Link from "next/link";
import { Menu, PlusCircle, UserCircle } from "lucide-react";

import { useSidebar } from "@/components/layout/sidebar-context";
import { Button } from "@/components/ui/button";
import { JoinGroupDialog } from "@/components/invitations/join-group-dialog";
import { NotificationCenter } from "@/components/notifications/notification-center";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";

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
    <header className="sticky top-0 z-20 w-full bg-surface-container-lowest border-b border-border-light h-16 flex items-center justify-between px-4 md:px-8">
      {/* Left: toggle + search */}
      <div className="flex items-center gap-3">
        <button
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border-light bg-surface text-on-surface-variant hover:bg-surface-container-low shadow-card transition-colors"
          onClick={handleToggle}
          aria-label="Toggle sidebar"
        >
          <Menu className="h-4 w-4" />
        </button>

        <div className="relative hidden md:block w-72">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            className="w-full h-9 pl-9 pr-4 rounded-lg border border-border-light bg-surface-light focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-sans text-sm transition-all placeholder:text-text-muted"
            placeholder="Rechercher des groupes, membres..."
            type="text"
          />
        </div>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-3">
        <JoinGroupDialog variant="ghost" className="hidden h-9 rounded-lg text-on-surface-variant hover:text-primary hover:bg-surface-container-low sm:flex font-sans text-sm" />

        <ThemeToggle />

        <LanguageSwitcher />

        <NotificationCenter />

        <Button asChild variant="ghost" size="icon" title="Compte" className="h-9 w-9 text-on-surface-variant hover:text-primary hover:bg-surface-container-low rounded-lg">
          <Link href="/account" aria-label="Compte">
            <UserCircle className="h-5 w-5" />
          </Link>
        </Button>

        <div className="hidden md:block w-px h-5 bg-border-light" />

        <Button
          asChild
          size="sm"
          className="hidden md:inline-flex bg-primary text-on-primary hover:bg-primary/90 font-sans font-medium text-sm rounded-lg shadow-card h-9 active:scale-95 transition-all"
        >
          <Link href="/dashboard/groups/new">
            <PlusCircle className="mr-1.5 h-4 w-4" />
            Nouveau groupe
          </Link>
        </Button>
      </div>
    </header>
  );
}
