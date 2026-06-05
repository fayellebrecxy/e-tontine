import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CyclesTable } from "@/components/groups/cycles-table";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function GroupCyclesPage({
  params,
  searchParams,
}: {
  params: Promise<{ groupId: string }>;
  searchParams?: Promise<{ status?: string }>;
}) {
  const { groupId } = await params;
  const { status } = (await searchParams) ?? {};

  const supabase = await createSupabaseServerClient();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;

  if (!user) {
    redirect(`/auth/login?next=${encodeURIComponent(`/dashboard/groups/${groupId}/cycles`)}`);
  }

  const membership = await prisma.membreGroupe.findFirst({
    where: { id_user: user.id, id_groupe: groupId, statut_adhesion: "ACTIF" },
    select: {
      id_membre_groupe: true,
      role: true,
      groupe: {
        select: {
          devise: true,
          cycles: {
            orderBy: { date_debut: "desc" },
            select: {
              id_cycle: true,
              nom_cycle: true,
              date_debut: true,
              date_fin: true,
              duree_tour_de_gain: true,
              montant_cotisation: true,
              participants: {
                orderBy: { ordre: "asc" },
                select: {
                  id_membre_groupe: true,
                  ordre: true,
                  membre_groupe: {
                    select: { user: { select: { nom: true, prenom: true } } },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!membership) {
    redirect("/dashboard");
  }

  const normalized =
    membership.role === "ADMIN"
      ? membership.groupe.cycles
      : membership.groupe.cycles.filter((c) =>
          c.participants.some((p) => p.id_membre_groupe === membership.id_membre_groupe),
        );

  const cycles = normalized.map((cycle) => ({
    ...cycle,
    date_debut: cycle.date_debut.toISOString(),
    date_fin: cycle.date_fin.toISOString(),
    montant_cotisation: Number(cycle.montant_cotisation),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Cycles de tontine</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {membership.role === "ADMIN"
            ? "Gérez les cycles de ce groupe : création, suivi des tours et enregistrement des versements."
            : "Consultez les cycles auxquels vous participez et suivez votre progression."
          }
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button asChild variant={status === "active" ? "default" : "outline"} size="sm">
          <Link href={`/dashboard/groups/${groupId}/cycles?status=active`}>En cours</Link>
        </Button>
        <Button asChild variant={status === "closed" ? "default" : "outline"} size="sm">
          <Link href={`/dashboard/groups/${groupId}/cycles?status=closed`}>Terminés</Link>
        </Button>
        <Button asChild variant={!status ? "default" : "outline"} size="sm">
          <Link href={`/dashboard/groups/${groupId}/cycles`}>Tous</Link>
        </Button>
      </div>

      <CyclesTable
        groupId={groupId}
        cycles={cycles}
        isAdmin={membership.role === "ADMIN"}
        devise={membership.groupe.devise}
        statusFilter={status}
      />
    </div>
  );
}
