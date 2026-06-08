import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, TrendingDown, TrendingUp, Wallet } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { RetraitAmendeForm } from "@/components/reunions/retrait-amende-form";
import { CaisseAmendesHistory } from "@/components/reunions/caisse-amendes-history";

export const dynamic = "force-dynamic";

export default async function CaisseAmendesPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;

  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/auth/login");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const membership = await prisma.membreGroupe.findFirst({
    where: { id_user: user.id, id_groupe: groupId, role: "ADMIN", statut_adhesion: "ACTIF" },
    select: { id_membre_groupe: true, groupe: { select: { devise: true, nom: true } } },
  });

  if (!membership) redirect(`/dashboard/groups/${groupId}/reunions`);

  const devise = membership.groupe.devise;

  // ─── Amendes collectées (présences payées) ───
  const presencesPaieees = await prisma.presenceReunion.findMany({
    where: {
      amende_payee: true,
      reunion: { id_groupe: groupId },
    },
    select: {
      id_presence: true,
      statut_presence: true,
      date_enregistrement: true,
      reunion: {
        select: {
          id_reunion: true,
          titre: true,
          date_reunion: true,
          montant_amende: true,
        },
      },
      membre_groupe: {
        select: {
          user: { select: { nom: true, prenom: true } },
        },
      },
    },
    orderBy: { date_enregistrement: "desc" },
  });

  // ─── Retraits effectués ───
  const retraits = await prisma.retraitAmendeReunion.findMany({
    where: { id_groupe: groupId },
    select: {
      id_retrait_amende: true,
      montant: true,
      motif: true,
      date_retrait: true,
      valideur: {
        select: {
          user: { select: { nom: true, prenom: true } },
        },
      },
    },
    orderBy: { date_retrait: "desc" },
  });

  // ─── Calcul du solde ───
  const totalCollecte = presencesPaieees.reduce(
    (acc, p) => acc + Number(p.reunion.montant_amende ?? 0),
    0,
  );
  const totalRetire = retraits.reduce((acc, r) => acc + Number(r.montant), 0);
  const solde = totalCollecte - totalRetire;

  return (
    <div className="space-y-6">
      {/* Navigation retour */}
      <div className="flex items-center gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href={`/dashboard/groups/${groupId}/reunions`}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            Retour aux réunions
          </Link>
        </Button>
      </div>

      {/* En-tête */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            💰 Caisse Amendes Réunions
          </h1>
          <p className="text-sm text-muted-foreground">
            Historique des amendes collectées et des retraits effectués.
          </p>
        </div>
        <RetraitAmendeForm groupId={groupId} solde={solde} devise={devise} />
      </div>

      {/* ─── Cartes de synthèse ─── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Solde */}
        <div className="space-y-1 rounded-xl border-2 border-amber-300 bg-amber-50 p-5 dark:bg-amber-900/20">
          <div className="flex items-center gap-2 text-amber-700">
            <Wallet className="h-5 w-5" />
            <span className="text-xs font-semibold uppercase tracking-wide">Solde actuel</span>
          </div>
          <p className={`text-2xl font-bold ${solde >= 0 ? "text-amber-800" : "text-rose-700"}`}>
            {solde.toLocaleString("fr-FR")} {devise}
          </p>
        </div>

        {/* Total collecté */}
        <div className="space-y-1 rounded-xl border border-emerald-200 bg-emerald-50 p-5 dark:bg-emerald-900/10">
          <div className="flex items-center gap-2 text-emerald-700">
            <TrendingUp className="h-5 w-5" />
            <span className="text-xs font-semibold uppercase tracking-wide">Total collecté</span>
          </div>
          <p className="text-2xl font-bold text-emerald-800">
            {totalCollecte.toLocaleString("fr-FR")} {devise}
          </p>
          <p className="text-xs text-emerald-600">{presencesPaieees.length} amende(s) payée(s)</p>
        </div>

        {/* Total retiré */}
        <div className="space-y-1 rounded-xl border border-gray-200 bg-gray-50 p-5 dark:bg-gray-800">
          <div className="flex items-center gap-2 text-gray-600">
            <TrendingDown className="h-5 w-5" />
            <span className="text-xs font-semibold uppercase tracking-wide">Total retiré</span>
          </div>
          <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">
            {totalRetire.toLocaleString("fr-FR")} {devise}
          </p>
          <p className="text-xs text-gray-500">{retraits.length} retrait(s) effectué(s)</p>
        </div>
      </div>

      <CaisseAmendesHistory
        groupId={groupId}
        devise={devise}
        amendes={presencesPaieees.map((presence) => ({
          ...presence,
          date_enregistrement: presence.date_enregistrement.toISOString(),
          reunion: {
            ...presence.reunion,
            date_reunion: presence.reunion.date_reunion.toISOString(),
            montant_amende: presence.reunion.montant_amende
              ? Number(presence.reunion.montant_amende)
              : null,
          },
        }))}
        retraits={retraits.map((retrait) => ({
          ...retrait,
          montant: Number(retrait.montant),
          date_retrait: retrait.date_retrait.toISOString(),
        }))}
      />
    </div>
  );
}
