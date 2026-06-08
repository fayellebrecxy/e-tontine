import { SiteHeader } from "@/components/site-header";

export function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f7f4ee] text-slate-950 dark:bg-slate-950 dark:text-white">
      <SiteHeader />
      <main>{children}</main>
    </div>
  );
}
