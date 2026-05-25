import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./../styles/globals.css";

import { AppShell } from "@/components/layout/app-shell";
import { SidebarProvider } from "@/components/layout/sidebar-context";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";

const outfit = Outfit({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: {
    default: "Next.js Template",
    template: "%s | Next.js Template",
  },
  description: "Next.js 15 + Supabase Auth + Prisma starter template.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={outfit.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <SidebarProvider>
            <AppShell>{children}</AppShell>
            <Toaster />
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
