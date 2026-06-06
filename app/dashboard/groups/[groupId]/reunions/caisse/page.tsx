import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, TrendingDown, TrendingUp, Wallet } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { RetraitAmendeForm } from "@/components/reunions/retrait-amende-form";

export const dynamic = "force-dynamic";

export default async function CaisseAmendesPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;

  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/auth/login");

  const { data: { user } } = await supabase.auth.getUser();
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
            <ArrowLeft className="h-4 w-4 mr-1" />
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
        <div className="rounded-xl border-2 border-amber-300 bg-amber-50 p-5 dark:bg-amber-900/20 space-y-1">
          <div className="flex items-center gap-2 text-amber-700">
            <Wallet className="h-5 w-5" />
            <span className="text-xs font-semibold uppercase tracking-wide">Solde actuel</span>
          </div>
          <p className={`text-2xl font-bold ${solde >= 0 ? "text-amber-800" : "text-rose-700"}`}>
            {solde.toLocaleString("fr-FR")} {devise}
          </p>
        </div>

        {/* Total collecté */}
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 dark:bg-emerald-900/10 space-y-1">
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
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 dark:bg-gray-800 space-y-1">
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

      {/* ─── Historique des amendes collectées ─── */}
      <section className="space-y-3">
        <h2 className="font-semibold text-gray-900 dark:text-white">
          📥 Amendes collectées ({presencesPaieees.length})
        </h2>

        {presencesPaieees.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 py-10 text-center text-sm text-muted-foreground">
            Aucune amende collectée pour l'instant.
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800 text-xs text-gray-500 uppercase">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Membre</th>
                  <th className="px-4 py-3 text-left font-medium">Réunion</th>
                  <th className="px-4 py-3 text-left font-medium">Statut</th>
                  <th className="px-4 py-3 text-right font-medium">Montant</th>
                  <th className="px-4 py-3 text-right font-medium">Date paiement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
                {presencesPaieees.map((p) => (
                  <tr key={p.id_presence} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                      {p.membre_groupe.user.prenom} {p.membre_groupe.user.nom}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      <Link
                        href={`/dashboard/groups/${groupId}/reunions/${p.reunion.id_reunion}`}
                        className="hover:text-amber-700 hover:underline"
                      >
                        {p.reunion.titre}
                      </Link>
                      <p className="text-xs text-gray-400">
                        {new Date(p.reunion.date_reunion).toLocaleDateString("fr-FR", {
                          day: "2-digit", month: "short", year: "numeric",
                        })}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-rose-100 text-rose-700 px-2 py-0.5 text-xs font-medium">
                        {p.statut_presence === "EN_RETARD" ? "⏰ En retard" : "❌ Absent"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-emerald-700">
                      +{Number(p.reunion.montant_amende ?? 0).toLocaleString("fr-FR")} {devise}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-500 text-xs">
                      {new Date(p.date_enregistrement).toLocaleDateString("fr-FR", {
                        day: "2-digit", month: "short", year: "numeric",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ─── Historique des retraits ─── */}
      <section className="space-y-3">
        <h2 className="font-semibold text-gray-900 dark:text-white">
          📤 Retraits effectués ({retraits.length})
        </h2>

        {retraits.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 py-10 text-center text-sm text-muted-foreground">
            Aucun retrait effectué pour l'instant.
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800 text-xs text-gray-500 uppercase">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Date</th>
                  <th className="px-4 py-3 text-left font-medium">Motif</th>
                  <th className="px-4 py-3 text-left font-medium">Admin</th>
                  <th className="px-4 py-3 text-right font-medium">Montant</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
                {retraits.map((r) => (
                  <tr key={r.id_retrait_amende} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {new Date(r.date_retrait).toLocaleDateString("fr-FR", {
                        day: "2-digit", month: "short", year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{r.motif}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-xs">
                      {r.valideur.user.prenom} {r.valideur.user.nom}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-rose-600">
                      -{Number(r.montant).toLocaleString("fr-FR")} {devise}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
