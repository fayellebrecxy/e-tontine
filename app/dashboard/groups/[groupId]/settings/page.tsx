import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { UpdateGroupForm } from "@/components/groups/update-group-form";
import { ExportRapportIconButton } from "@/components/groups/export-rapport-button";

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
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Paramètres du groupe</h1>
          <p className="text-muted-foreground">Admin uniquement.</p>
        </div>
        <ExportRapportIconButton groupId={groupId} groupeNom={groupe.nom} />
      </div>

      {/* Section rapport financier */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="mb-1 text-base font-semibold text-gray-900 dark:text-white">
          Rapport financier du groupe
        </h2>
        <p className="mb-4 text-sm text-gray-500">
          Exportez le bilan complet du groupe : cotisations, distributions, pénalités, amendes
          réunions. Disponible en PDF (impression / partage) ou Excel (analyse de données).
        </p>
        <ExportRapportIconButton groupId={groupId} groupeNom={groupe.nom} />
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
