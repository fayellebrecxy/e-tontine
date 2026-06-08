import { redirect } from "next/navigation";
import { Landmark } from "lucide-react";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CreateGroupForm } from "@/components/groups/create-group-form";

export default async function NewGroupPage() {
  const supabase = await createSupabaseServerClient();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;

  if (!user) {
    redirect("/auth/login?next=/dashboard/groups/new");
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
        <div className="flex gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-slate-950 text-white dark:bg-white dark:text-slate-950">
            <Landmark className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-normal text-slate-950 dark:text-white">
              Nouveau groupe
            </h1>
            <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
              Créez l’espace de gestion de votre tontine. Vous pourrez ensuite inviter les
              participants et organiser les cycles.
            </p>
          </div>
        </div>
      </div>

      <CreateGroupForm />
    </div>
  );
}
