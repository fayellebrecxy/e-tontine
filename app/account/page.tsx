import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Account</h1>
      <p className="text-muted-foreground">Email: {user.email}</p>
      <p className="text-muted-foreground">
        Nom: {[dbUser?.prenom, dbUser?.nom].filter(Boolean).join(" ") || "—"}
      </p>
      <p className="text-muted-foreground">Téléphone: {dbUser?.telephone ?? "—"}</p>
      <div className="space-y-2">
        <h2 className="text-lg font-medium">Groupes</h2>
        {dbUser?.memberships.length ? (
          <ul className="space-y-1 text-muted-foreground">
            {dbUser.memberships.map((membership) => (
              <li key={membership.id_membre_groupe}>
                {membership.groupe.nom} · {membership.role}
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
