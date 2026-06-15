"use client";

import * as React from "react";

import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Backdrop } from "@/components/layout/backdrop";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { useSidebar } from "@/components/layout/sidebar-context";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();

  const mainOffset = isMobileOpen ? "ml-0" : isExpanded || isHovered ? "lg:ml-64" : "lg:ml-20";

  return (
    <div className="min-h-screen bg-surface-light text-on-surface">
      <AppSidebar />
      <Backdrop />
      <div className={`flex min-h-screen flex-col transition-all duration-200 ${mainOffset}`}>
        <AppHeader />
        <main className="mx-auto w-full max-w-container-max flex-1 p-4 pb-28 md:p-8 lg:pb-8">
          {children}
        </main>
      </div>
      <MobileBottomNav />
    </div>
  );
}
