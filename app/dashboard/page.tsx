import Link from "next/link";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

  const notifications = dbUser
    ? await prisma.notificationGroupe.findMany({
        where: { id_user: dbUser.id_user },
        orderBy: { date_creation: "desc" },
        take: 5,
      })
    : [];

  const notificationLabel = (type: string) => {
    switch (type) {
      case "GROUP_UPDATED":
        return "Mise a jour du groupe";
      case "GROUP_DELETED":
        return "Suppression du groupe";
      default:
        return "Notification";
    }
  };

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
                  {membership.statut_adhesion === "ACTIF" ? (
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/dashboard/groups/${membership.groupe.id_groupe}/members`}>
                        Membres
                      </Link>
                    </Button>
                  ) : (
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/dashboard/groups/${membership.groupe.id_groupe}`}>
                        Voir la fiche
                      </Link>
                    </Button>
                  )}
                  {membership.role === "ADMIN" ? (
                    <Button asChild size="sm" variant="ghost" className="ml-2">
                      <Link href={`/dashboard/groups/${membership.groupe.id_groupe}/settings`}>
                        Parametres
                      </Link>
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">Aucun groupe pour le moment.</p>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Notifications</h2>
        {notifications.length ? (
          <div className="grid gap-3">
            {notifications.map((notification) => (
              <Card key={notification.id_notification}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    {notificationLabel(notification.type_notification)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{notification.message}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {notification.date_creation.toLocaleString("fr-FR")}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">Aucune notification pour le moment.</p>
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
