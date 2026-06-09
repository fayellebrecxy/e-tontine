import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Landmark, ShieldCheck, UsersRound, WalletCards } from "lucide-react";

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#eef2ee] text-slate-950">
      <div className="pointer-events-none absolute inset-0 auth-ledger-grid opacity-70" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-[linear-gradient(180deg,rgba(12,28,22,0.10),transparent)]" />

      <header className="relative z-20 px-4 py-4 sm:px-6">
        <div className="mx-auto flex h-12 max-w-7xl items-center justify-between rounded-lg border border-white/70 bg-white/75 px-3 shadow-sm backdrop-blur-xl">
          <Link href="/" className="group inline-flex items-center gap-2 text-sm font-bold text-slate-950">
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-950 text-white transition-transform duration-300 group-hover:scale-105">
              <Landmark className="h-4 w-4" />
            </span>
            E-Tontine
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Accueil
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto grid min-h-[calc(100vh-5rem)] w-full max-w-7xl items-center gap-8 px-4 pb-8 pt-2 sm:px-6 lg:grid-cols-[0.94fr_1.06fr] lg:pb-12">
        <section className="hidden min-h-[40rem] overflow-hidden rounded-xl border border-slate-900/10 bg-slate-950 shadow-2xl shadow-slate-900/20 lg:block">
          <div className="relative h-full min-h-[40rem]">
            <Image
              src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=1400&q=85"
              alt="Documents financiers et gestion de caisse"
              fill
              priority
              sizes="(min-width: 1024px) 45vw, 100vw"
              className="object-cover opacity-75"
            />
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(5,15,12,0.95),rgba(5,15,12,0.46)_45%,rgba(22,101,52,0.30))]" />
            <div className="absolute inset-x-8 top-8 h-px bg-white/30" />
            <div className="absolute bottom-0 left-0 right-0 p-8">
              <div className="auth-rise max-w-lg">
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-emerald-50 backdrop-blur">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Traçabilité et transparence
                </div>
                <h1 className="text-4xl font-black leading-tight tracking-normal text-white">
                  Une tontine moderne, lisible et contrôlée par chaque membre.
                </h1>
                <p className="mt-4 text-sm leading-6 text-slate-200">
                  Suivi des cotisations, réunions, caisses, épargne et notifications dans une expérience simple pour les membres et solide pour les administrateurs.
                </p>
              </div>

              <div className="mt-8 grid grid-cols-3 gap-3">
                {[
                  { label: "Groupes", value: "Pilotage", icon: UsersRound },
                  { label: "Caisses", value: "Soldes", icon: WalletCards },
                  { label: "Preuves", value: "Journal", icon: ShieldCheck },
                ].map((item) => (
                  <div key={item.label} className="auth-rise rounded-lg border border-white/15 bg-white/10 p-3 text-white backdrop-blur-md">
                    <item.icon className="mb-3 h-4 w-4 text-emerald-200" />
                    <p className="text-[11px] uppercase text-slate-300">{item.label}</p>
                    <p className="mt-1 text-sm font-bold">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="flex min-h-[34rem] items-center justify-center">
          {children}
        </section>
      </main>
    </div>
  );
}
