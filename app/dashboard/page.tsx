import Link from "next/link";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;

  if (!user) {
    redirect("/auth/login?next=/dashboard");
  }

  const dbUser = await prisma.user.findUnique({
    where: { id_user: user.id },
    include: {
      memberships: {
        include: { groupe: true },
        orderBy: { date_adhesion: "desc" },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Connecté en tant que {dbUser ? `${dbUser.prenom} ${dbUser.nom}` : user.email}.
        </p>
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-medium">Mes groupes</h2>
          <Button asChild size="sm">
            <Link href="/dashboard/groups/new">Créer un groupe</Link>
          </Button>
        </div>
        {dbUser?.memberships.length ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {dbUser.memberships.map((membership) => (
              <div
                key={membership.id_membre_groupe}
                className="rounded-md border bg-card p-4 text-card-foreground"
              >
                <p className="font-medium">{membership.groupe.nom}</p>
                <p className="text-sm text-muted-foreground">
                  {membership.role} · {membership.statut_adhesion} · {membership.statut_visuel}
                </p>

                <div className="mt-3">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/dashboard/groups/${membership.groupe.id_groupe}/members`}>
                      Membres
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">Aucun groupe pour le moment.</p>
        )}
      </section>

      <div className="flex gap-2">
        <Button asChild variant="outline">
          <Link href="/account">Voir le compte</Link>
        </Button>
      </div>
    </div>
  );
}
