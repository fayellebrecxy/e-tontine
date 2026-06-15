import { SiteHeader } from "@/components/site-header";

export function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <SiteHeader />
      <main>{children}</main>
    </div>
  );
}
