"use client";

import Link from "next/link";
import { Menu, Search } from "lucide-react";

import { useSidebar } from "@/components/layout/sidebar-context";
import { Button } from "@/components/ui/button";

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
          <div className="relative hidden w-full max-w-md items-center lg:flex">
            <Search className="absolute left-3 h-4 w-4 text-gray-400" />
            <input
              type="search"
              placeholder="Rechercher un groupe..."
              className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm text-gray-700 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200"
            />
          </div>
          <nav className="flex items-center gap-2">
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
