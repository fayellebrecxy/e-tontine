import Link from "next/link";
import { ArrowLeft, Landmark } from "lucide-react";

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-slate-50 text-slate-950 flex flex-col font-sans">
      <header className="absolute top-0 left-0 right-0 z-20 px-4 py-4 sm:px-6">
        <div className="mx-auto flex h-12 max-w-7xl items-center justify-between rounded-lg border border-slate-200/50 bg-white/50 px-4 shadow-sm backdrop-blur-md">
          <Link href="/" className="group inline-flex items-center gap-2 text-sm font-bold text-slate-950">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-green-600 text-white transition-transform duration-300 group-hover:scale-105">
              <Landmark className="h-4 w-4" />
            </span>
            <span className="font-heading tracking-tight">E-Tontine</span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Retour au site
          </Link>
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center p-4 md:p-8 pt-24 pb-8">
        {children}
      </main>
    </div>
  );
}
