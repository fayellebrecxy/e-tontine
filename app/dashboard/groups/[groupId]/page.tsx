import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function GroupOverviewPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;

  const supabase = await createSupabaseServerClient();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;

  if (!user) {
    redirect(`/auth/login?next=${encodeURIComponent(`/dashboard/groups/${groupId}`)}`);
  }

  const membership = await prisma.membreGroupe.findUnique({
    where: { id_user_id_groupe: { id_user: user.id, id_groupe: groupId } },
    select: {
      role: true,
      statut_adhesion: true,
      groupe: {
        select: {
          nom: true,
          description: true,
          devise: true,
          date_de_creation: true,
        },
      },
    },
  });

  if (!membership) {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Fiche du groupe</h2>
        <p className="text-sm text-muted-foreground">
          Statut: {membership.statut_adhesion}
        </p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-600 dark:border-gray-800 dark:bg-gray-900">
        <p className="text-sm font-semibold text-gray-900 dark:text-white">{membership.groupe.nom}</p>
        {membership.groupe.description ? (
          <p className="mt-2">{membership.groupe.description}</p>
        ) : null}
        {membership.groupe.devise ? (
          <p className="mt-2 text-xs text-gray-500">Devise: {membership.groupe.devise}</p>
        ) : null}
      </div>
    </div>
  );
}
