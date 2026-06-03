import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { GenerateInvitationCard } from "@/components/groups/generate-invitation-card";
import { InvitationHistory } from "@/components/groups/invitation-history";

export default async function GroupInvitationsPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;

  const supabase = await createSupabaseServerClient();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;

  if (!user) {
    redirect(`/auth/login?next=${encodeURIComponent(`/dashboard/groups/${groupId}/invitations`)}`);
  }

  const membership = await prisma.membreGroupe.findFirst({
    where: { id_user: user.id, id_groupe: groupId, statut_adhesion: "ACTIF" },
    select: { role: true, groupe: { select: { nom: true } } },
  });

  if (!membership) {
    redirect("/dashboard");
  }

  const groupe =
    membership.role === "ADMIN"
      ? await prisma.groupes.findUnique({
          where: { id_groupe: groupId },
          select: { lien_invitation: true },
        })
      : null;

  const activeCode = groupe?.lien_invitation ?? null;

  const invitations =
    membership.role === "ADMIN"
      ? await prisma.invitationGroupe.findMany({
          where: { id_groupe: groupId },
          orderBy: { date_creation: "desc" },
          select: {
            id_invitation: true,
            code: true,
            date_creation: true,
            date_revocation: true,
          },
        })
      : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Invitations</h1>
        <p className="text-muted-foreground">Groupe: {membership.groupe.nom}</p>
      </div>

      {membership.role === "ADMIN" ? (
        <div className="space-y-6">
          <GenerateInvitationCard groupId={groupId} />
          <InvitationHistory
            groupId={groupId}
            items={invitations
              .filter(
                (invitation) =>
                  !(
                    activeCode &&
                    invitation.code === activeCode &&
                    !invitation.date_revocation
                  ),
              )
              .map((invitation) => ({
                id_invitation: invitation.id_invitation,
                code: invitation.code,
                date_creation: invitation.date_creation.toISOString(),
                date_revocation: invitation.date_revocation
                  ? invitation.date_revocation.toISOString()
                  : null,
              }))}
          />
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-6 text-sm text-gray-500 dark:border-gray-800 dark:bg-gray-900">
          Seuls les administrateurs peuvent generer un lien d'invitation.
        </div>
      )}
    </div>
  );
}
