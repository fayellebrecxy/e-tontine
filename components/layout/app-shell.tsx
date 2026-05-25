"use client";

import * as React from "react";

import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Backdrop } from "@/components/layout/backdrop";
import { useSidebar } from "@/components/layout/sidebar-context";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();

  const mainOffset = isMobileOpen
    ? "ml-0"
    : isExpanded || isHovered
    ? "lg:ml-72"
    : "lg:ml-20";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <AppSidebar />
      <Backdrop />
      <div className={`transition-all duration-200 ${mainOffset}`}>
        <AppHeader />
        <main className="px-4 py-6 lg:px-6">{children}</main>
      </div>
    </div>
  );
}
