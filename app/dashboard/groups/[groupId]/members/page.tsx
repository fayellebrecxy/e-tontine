import Link from "next/link";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { MembersTable } from "@/components/groups/members-table";
import { Button } from "@/components/ui/button";

export default async function GroupMembersPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;

  const supabase = await createSupabaseServerClient();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;

  if (!user) {
    redirect(`/auth/login?next=${encodeURIComponent(`/dashboard/groups/${groupId}/members`)}`);
  }

  const viewerMembership = await prisma.membreGroupe.findFirst({
    where: { id_user: user.id, id_groupe: groupId, statut_adhesion: "ACTIF" },
    select: { id_membre_groupe: true, role: true, groupe: { select: { nom: true } } },
  });

  if (!viewerMembership) {
    redirect("/dashboard");
  }

  const members = await prisma.membreGroupe.findMany({
    where: {
      id_groupe: groupId,
      statut_adhesion: { in: ["ACTIF", "EN_ATTENTE"] },
    },
    include: {
      user: {
        select: {
          id_user: true,
          nom: true,
          prenom: true,
          email: true,
          telephone: true,
          photo_de_profil: true,
        },
      },
    },
    orderBy: [{ role: "asc" }, { date_adhesion: "asc" }],
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Membres</h1>
          <p className="text-muted-foreground">Groupe: {viewerMembership.groupe.nom}</p>
        </div>
        <div className="flex gap-2">
          {viewerMembership.role === "ADMIN" ? (
            <Button asChild variant="outline">
              <Link href={`/dashboard/groups/${groupId}/settings`}>Parametres</Link>
            </Button>
          ) : null}
          <Button asChild variant="outline">
            <Link href="/dashboard">Retour</Link>
          </Button>
        </div>
      </div>

      <MembersTable
        groupId={groupId}
        currentUserId={user.id}
        canManage={viewerMembership.role === "ADMIN"}
        members={members}
      />
    </div>
  );
}
