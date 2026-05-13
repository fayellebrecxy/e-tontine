import { redirect } from "next/navigation";

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
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Nouveau groupe</h1>
        <p className="text-muted-foreground">Créez un groupe de tontine.</p>
      </div>

      <CreateGroupForm />
    </div>
  );
}
