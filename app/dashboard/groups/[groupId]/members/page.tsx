import Link from "next/link";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
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

  const viewerMembership = await prisma.membreGroupe.findUnique({
    where: { id_user_id_groupe: { id_user: user.id, id_groupe: groupId } },
    select: { id_membre_groupe: true, groupe: { select: { nom: true } } },
  });

  if (!viewerMembership) {
    redirect("/dashboard");
  }

  const members = await prisma.membreGroupe.findMany({
    where: { id_groupe: groupId },
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
        <Button asChild variant="outline">
          <Link href="/dashboard">Retour</Link>
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {members.map((m) => (
          <div key={m.id_membre_groupe} className="rounded-md border bg-card p-4 text-card-foreground">
            <p className="font-medium">
              {m.user.prenom} {m.user.nom}
            </p>
            <p className="text-sm text-muted-foreground">
              {m.role} · {m.statut_adhesion} · {m.statut_visuel}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">{m.user.email}</p>
            <p className="text-sm text-muted-foreground">{m.user.telephone}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
