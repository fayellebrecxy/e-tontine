import Link from "next/link";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { UpdateProfileForm } from "@/components/account/update-profile-form";
import { Button } from "@/components/ui/button";

export default async function AccountPage() {
  const supabase = await createSupabaseServerClient();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;

  if (!user) {
    redirect("/auth/login?next=/account");
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

  if (!dbUser) {
    redirect("/auth/login?next=/account");
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Mon compte</h1>

      <UpdateProfileForm
        initial={{
          email: user.email ?? dbUser.email,
          nom: dbUser.nom,
          prenom: dbUser.prenom,
          telephone: dbUser.telephone,
          photo_de_profil: dbUser.photo_de_profil,
        }}
      />

      <div className="space-y-2">
        <h2 className="text-lg font-medium">Groupes</h2>
        {dbUser.memberships.length ? (
          <ul className="space-y-2">
            {dbUser.memberships.map((membership) => (
              <li
                key={membership.id_membre_groupe}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 dark:border-gray-800 dark:bg-gray-900"
              >
                <span className="text-sm text-gray-700 dark:text-gray-200">
                  {membership.groupe.nom} · {membership.role}
                </span>
                <Button asChild size="sm" variant="outline">
                  <Link href={`/dashboard/groups/${membership.groupe.id_groupe}`}>Ouvrir</Link>
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground">Aucun groupe pour le moment.</p>
        )}
      </div>
    </div>
  );
}
