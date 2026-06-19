"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Backdrop } from "@/components/layout/backdrop";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { useSidebar } from "@/components/layout/sidebar-context";
import { PageReveal } from "@/components/motion/page-reveal";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();

  const mainOffset = isMobileOpen ? "ml-0" : isExpanded || isHovered ? "lg:ml-64" : "lg:ml-20";

  return (
    <div className="min-h-screen bg-surface-light text-on-surface">
      <AppSidebar />
      <Backdrop />
      <div className={`flex min-h-screen flex-col transition-all duration-200 ${mainOffset}`}>
        <AppHeader />
        <main className="w-full flex-1 px-3 py-4 pb-28 md:px-4 md:py-5 lg:px-5 lg:pb-8">
          <PageReveal key={pathname}>{children}</PageReveal>
        </main>
      </div>
      <MobileBottomNav />
    </div>
  );
}
