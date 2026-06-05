import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CyclesTable } from "@/components/groups/cycles-table";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const dynamic = "force-dynamic";

const CYCLE_SELECT = {
  id_cycle: true,
  nom_cycle: true,
  date_debut: true,
  date_fin: true,
  duree_tour_de_gain: true,
  montant_cotisation: true,
  participants: {
    orderBy: { ordre: "asc" as const },
    select: {
      id_membre_groupe: true,
      ordre: true,
      membre_groupe: {
        select: { user: { select: { nom: true, prenom: true } } },
      },
    },
  },
  versements: {
    select: { id_versement: true },
  },
} as const;

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
      groupe: { select: { devise: true } },
    },
  });

  if (!membership) {
    redirect("/dashboard");
  }

  // Requête directe selon le rôle pour ne jamais rater un cycle
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let rawCycles: any[];

  if (membership.role === "ADMIN") {
    // L'admin voit tous les cycles du groupe
    rawCycles = await prisma.cycleTontine.findMany({
      where: { id_groupe: groupId },
      orderBy: { date_debut: "desc" },
      select: CYCLE_SELECT,
    });
  } else {
    // Le membre ne voit que les cycles où il est participant
    // Requête directe sur CycleParticipant pour ne pas rater de cycle
    const participations = await prisma.cycleParticipant.findMany({
      where: { id_membre_groupe: membership.id_membre_groupe },
      orderBy: { cycle: { date_debut: "desc" } },
      select: {
        cycle: { select: CYCLE_SELECT },
      },
    });
    rawCycles = participations.map((p) => p.cycle);
  }

  const cycles = rawCycles.map((cycle) => ({
    ...cycle,
    date_debut: cycle.date_debut.toISOString(),
    date_fin: cycle.date_fin.toISOString(),
    montant_cotisation: Number(cycle.montant_cotisation),
    versements: cycle.versements ?? [],
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Cycles de tontine</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {membership.role === "ADMIN"
            ? "Gérez les cycles de ce groupe : création, suivi des tours et enregistrement des versements."
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
