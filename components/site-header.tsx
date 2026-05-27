import Link from "next/link";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";

export async function SiteHeader() {
  const supabase = await createSupabaseServerClient();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;

  return (
    <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/90 backdrop-blur dark:border-gray-800 dark:bg-gray-900/80">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 lg:px-6">
        <Link href="/" className="text-base font-semibold text-gray-900 dark:text-white">
          E-Tontine
        </Link>
        <nav className="flex items-center gap-2">
          {user ? (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              <Button asChild variant="ghost" size="sm">
                <Link href="/account">Compte</Link>
              </Button>
              <form action="/logout" method="post">
                <Button type="submit" variant="outline" size="sm">
                  Se deconnecter
                </Button>
              </form>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/auth/login">Se connecter</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/auth/register">Creer un compte</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
