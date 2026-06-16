"use client";

import { usePathname } from "next/navigation";

import { PageReveal } from "@/components/motion/page-reveal";

export function PublicPageReveal({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return <PageReveal key={pathname}>{children}</PageReveal>;
}
