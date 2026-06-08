import Link from "next/link";
import { Landmark } from "lucide-react";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";

export async function SiteHeader() {
  const supabase = await createSupabaseServerClient();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;

  return (
    <header className="sticky top-0 z-30 border-b border-black/10 bg-[#f7f4ee]/90 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/85">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-2 text-base font-semibold text-slate-950 dark:text-white"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-950 text-white dark:bg-white dark:text-slate-950">
            <Landmark className="h-4 w-4" />
          </span>
          <span>E-Tontine</span>
        </Link>
        <nav className="flex items-center gap-2">
          {user ? (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link href="/account">Compte</Link>
              </Button>
              <Button
                asChild
                size="sm"
                className="bg-slate-950 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-white/90"
              >
                <Link href="/dashboard">Ouvrir l'espace</Link>
              </Button>
              <form action="/logout" method="post" className="hidden sm:block">
                <Button type="submit" variant="outline" size="sm">
                  Se déconnecter
                </Button>
              </form>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link href="/auth/login">Se connecter</Link>
              </Button>
              <Button
                asChild
                size="sm"
                className="bg-slate-950 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-white/90"
              >
                <Link href="/auth/register">Créer un compte</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
