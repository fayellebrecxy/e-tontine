import { GroupShell } from "@/components/groups/group-shell";
import type { GroupShellMembership } from "@/components/groups/group-shell";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function GroupLayout({
  children,
  params,
}: {
  children: React.ReactNode;
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
      id_membre_groupe: true,
      role: true,
      statut_adhesion: true,
      statut_visuel: true,
      date_adhesion: true,
      date_depart: true,
      groupe: {
        select: {
          id_groupe: true,
          nom: true,
          description: true,
          devise: true,
        },
      },
    },
  });

  if (!membership) {
    redirect("/dashboard");
  }

  const { groupe, ...membershipFields } = membership;

  const initialMembership: GroupShellMembership = {
    id_membre_groupe: membershipFields.id_membre_groupe,
    role: membershipFields.role,
    statut_adhesion: membershipFields.statut_adhesion,
    statut_visuel: membershipFields.statut_visuel,
    date_adhesion: membershipFields.date_adhesion.toISOString(),
    date_depart: membershipFields.date_depart?.toISOString() ?? null,
  };

  return (
    <GroupShell
      groupId={groupId}
      initialGroup={groupe}
      initialMembership={initialMembership}
    >
      {children}
    </GroupShell>
  );
}
