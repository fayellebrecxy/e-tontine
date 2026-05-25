"use client";

import { useSidebar } from "@/components/layout/sidebar-context";

export function Backdrop() {
  const { isMobileOpen, toggleMobileSidebar } = useSidebar();

  if (!isMobileOpen) return null;

  return <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={toggleMobileSidebar} />;
}
