import { SiteHeader } from "@/components/site-header";
import { PublicPageReveal } from "@/components/layout/public-page-reveal";

export function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <SiteHeader />
      <main>
        <PublicPageReveal>{children}</PublicPageReveal>
      </main>
    </div>
  );
}
