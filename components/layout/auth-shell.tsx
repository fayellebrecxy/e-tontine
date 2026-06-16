"use client";

import { PageReveal } from "@/components/motion/page-reveal";

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col bg-surface-container-low font-sans text-on-surface">
      <main className="flex flex-grow items-center justify-center p-4 md:p-8">
        <PageReveal className="flex w-full justify-center">{children}</PageReveal>
      </main>
    </div>
  );
}
