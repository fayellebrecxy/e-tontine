import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { UpdateGroupForm } from "@/components/groups/update-group-form";

export default async function GroupSettingsPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;

  const supabase = await createSupabaseServerClient();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;

  if (!user) {
    redirect(`/auth/login?next=${encodeURIComponent(`/dashboard/groups/${groupId}/settings`)}`);
  }

  const membership = await prisma.membreGroupe.findFirst({
    where: { id_user: user.id, id_groupe: groupId, statut_adhesion: "ACTIF" },
    select: { role: true },
  });

  if (!membership || membership.role !== "ADMIN") {
    redirect(`/dashboard/groups/${groupId}`);
  }

  const groupe = await prisma.groupes.findUnique({
    where: { id_groupe: groupId },
    select: { id_groupe: true, nom: true, description: true, devise: true },
  });

  if (!groupe) {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Parametres du groupe</h1>
        <p className="text-muted-foreground">Admin uniquement.</p>
      </div>

      <UpdateGroupForm
        groupId={groupe.id_groupe}
        initial={{
          nom: groupe.nom,
          description: groupe.description,
          devise: groupe.devise,
        }}
      />
    </div>
  );
}
