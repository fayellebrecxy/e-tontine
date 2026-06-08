import Link from "next/link";
import { redirect } from "next/navigation";
import { Wallet } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { CreateReunionSheet } from "@/components/reunions/create-reunion-sheet";
import { ReunionCard } from "@/components/reunions/reunion-card";
import { ReunionsHistory } from "@/components/reunions/reunions-history";

export const dynamic = "force-dynamic";

export default async function ReunionsPage({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params;

  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/auth/login");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const membership = await prisma.membreGroupe.findFirst({
    where: { id_user: user.id, id_groupe: groupId, statut_adhesion: "ACTIF" },
    select: { id_membre_groupe: true, role: true, groupe: { select: { devise: true } } },
  });

  if (!membership) redirect(`/dashboard/groups/${groupId}`);

  const isAdmin = membership.role === "ADMIN";
  const devise = membership.groupe.devise;

  const reunions = await prisma.reunion.findMany({
    where: { id_groupe: groupId },
    orderBy: { date_reunion: "desc" },
    select: {
      id_reunion: true,
      titre: true,
      date_reunion: true,
      lieu: true,
      type_reunion: true,
      statut: true,
      montant_amende: true,
      presences: isAdmin
        ? {
            select: {
              id_presence: true,
              id_membre_groupe: true,
              statut_presence: true,
              amende_payee: true,
            },
          }
        : {
            where: { id_membre_groupe: membership.id_membre_groupe },
            select: {
              id_presence: true,
              statut_presence: true,
              amende_payee: true,
            },
          },
    },
  });

  const now = new Date();
  const upcoming = reunions.filter(
    (r) => new Date(r.date_reunion) >= now && r.statut === "PLANIFIEE",
  );
  const past = reunions.filter((r) => new Date(r.date_reunion) < now || r.statut !== "PLANIFIEE");

  // Stats amendes (membres seulement)
  const myPendingAmendes = !isAdmin
    ? reunions.filter((r) => {
        const p = r.presences[0];
        return p?.statut_presence === "ABSENT" && !p.amende_payee && r.montant_amende;
      })
    : [];

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Réunions</h1>
          <p className="text-sm text-muted-foreground">
            {isAdmin
              ? "Planifiez et gérez les réunions du groupe."
              : "Consultez les réunions et votre historique de présence."}
          </p>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-2">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="gap-1.5 border-amber-300 text-amber-800 hover:bg-amber-50"
            >
              <Link href={`/dashboard/groups/${groupId}/reunions/caisse`}>
                <Wallet className="h-4 w-4" />
                Caisse amendes
              </Link>
            </Button>
            <CreateReunionSheet groupId={groupId} devise={devise} />
          </div>
        )}
      </div>

      {/* Alerte amendes impayées (membres) */}
      {!isAdmin && myPendingAmendes.length > 0 && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          <p className="font-medium">
            ⚠️ Vous avez {myPendingAmendes.length} amende(s) de réunion non payée(s).
          </p>
          <p className="mt-1 text-xs text-rose-600">
            Contactez votre administrateur pour régulariser.
          </p>
        </div>
      )}

      {/* Prochaines réunions */}
      {upcoming.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            📅 Prochaines réunions ({upcoming.length})
          </h2>
          <div className="space-y-3">
            {upcoming.map((reunion) => (
              <ReunionCard
                key={reunion.id_reunion}
                reunion={{
                  ...reunion,
                  montant_amende: reunion.montant_amende ? Number(reunion.montant_amende) : null,
                }}
                groupId={groupId}
                isAdmin={isAdmin}
                devise={devise}
              />
            ))}
          </div>
        </section>
      )}

      {/* Réunions passées */}
      <ReunionsHistory
        groupId={groupId}
        reunions={past.map((reunion) => ({
          ...reunion,
          date_reunion: reunion.date_reunion.toISOString(),
          montant_amende: reunion.montant_amende ? Number(reunion.montant_amende) : null,
        }))}
        isAdmin={isAdmin}
        devise={devise}
      />

      {/* Aucune réunion */}
      {reunions.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-300 py-16 text-center">
          <p className="mb-2 text-2xl">📅</p>
          <p className="font-medium text-gray-700">Aucune réunion planifiée</p>
          {isAdmin && (
            <p className="mt-1 text-sm text-muted-foreground">
              Cliquez sur "Planifier une réunion" pour commencer.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
