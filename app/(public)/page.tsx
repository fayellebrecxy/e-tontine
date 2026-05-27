import Link from "next/link";
import { redirect } from "next/navigation";

import InteractiveGridPattern from "@/components/ui/interactive-grid-pattern";
import TypingAnimation from "@/components/ui/typing-animation";
import { Button } from "@/components/ui/button";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { JoinGroupDialog } from "@/components/invitations/join-group-dialog";

export default async function HomePage() {
  const supabase = await createSupabaseServerClient();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <InteractiveGridPattern interactive className="opacity-100" />
      <div className="relative space-y-6">
        <div>
          <p className="text-sm font-medium text-brand-600">E-Tontine</p>
          <h1 className="mt-2 text-balance text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">
            Gerez vos tontines en toute simplicite
          </h1>
          <div className="mt-3 text-muted-foreground">
            <TypingAnimation
              text="Cycles, cotisations, penalites et invitations — tout au meme endroit."
              loop={false}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/auth/register">Creer un compte</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/auth/login">Se connecter</Link>
          </Button>
          <JoinGroupDialog variant="outline" />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-950">
            <p className="text-sm text-muted-foreground">Groupes</p>
            <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
              Creez et administrez
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-950">
            <p className="text-sm text-muted-foreground">Cycles</p>
            <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
              Suivez les tours de gain
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-950">
            <p className="text-sm text-muted-foreground">Invitations</p>
            <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
              Rejoignez via un lien
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
