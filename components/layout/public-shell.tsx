import { SiteHeader } from "@/components/site-header";

export function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl px-4 py-8 lg:px-6">{children}</main>
    </div>
  );
}
