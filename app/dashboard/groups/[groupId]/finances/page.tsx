import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowDownLeft, ArrowUpRight, Wallet } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function formatMoney(value: unknown, devise: string) {
  return `${Number(value ?? 0).toLocaleString("fr-FR")} ${devise}`;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function caisseLabel(type: string) {
  const labels: Record<string, string> = {
    GENERALE: "Générale",
    CYCLE: "Cycle",
    RUBRIQUE: "Rubrique",
    AMENDES_REUNION: "Amendes",
    PENALITES_CYCLE: "Pénalités",
  };
  return labels[type] ?? type;
}

function sourceLabel(source: string) {
  const labels: Record<string, string> = {
    COTISATION_CYCLE: "Cotisations",
    VERSEMENT_BENEFICIAIRE: "Versement bénéficiaire",
    PAIEMENT_RUBRIQUE: "Paiements rubrique",
    RETRAIT_RUBRIQUE: "Retrait rubrique",
    AMENDE_REUNION: "Amendes réunion",
    RETRAIT_AMENDES_REUNION: "Retrait amendes",
    PENALITE_CYCLE: "Pénalités",
    RETRAIT_PENALITE_CYCLE: "Retrait pénalités",
    RETRAIT_GENERAL: "Retrait général",
    VERSEMENT_POT: "Versement pot",
  };
  return labels[source] ?? source;
}

export default async function FinancesPage({
  params,
  searchParams,
}: {
  params: Promise<{ groupId: string }>;
  searchParams?: Promise<{ vue?: string; limit?: string }>;
}) {
  const { groupId } = await params;
  const query = searchParams ? await searchParams : {};
  const showDetailedJournal = query.vue === "detail";
  const requestedLimit = Number(query.limit ?? (showDetailedJournal ? 100 : 50));
  const limit = Number.isFinite(requestedLimit)
    ? Math.min(Math.max(Math.trunc(requestedLimit), 25), 200)
    : 50;

  const supabase = await createSupabaseServerClient();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;

  if (!user) {
    redirect(`/auth/login?next=${encodeURIComponent(`/dashboard/groups/${groupId}/finances`)}`);
  }

  const membership = await prisma.membreGroupe.findUnique({
    where: { id_user_id_groupe: { id_user: user.id, id_groupe: groupId } },
    select: {
      id_membre_groupe: true,
      role: true,
      statut_adhesion: true,
      groupe: { select: { nom: true, devise: true } },
    },
  });

  if (!membership || membership.statut_adhesion !== "ACTIF") {
    redirect("/dashboard");
  }

  const [
    caisses,
    totals,
    entreesParCaisse,
    retraitsParCaisse,
    derniersRetraitsParCaisse,
    sorties,
    mouvementsDetailles,
  ] = await Promise.all([
    prisma.caisseFinanciere.findMany({
      where: {
        id_groupe: groupId,
      },
      orderBy: [{ type_caisse: "asc" }, { nom: "asc" }],
    }),
    prisma.mouvementFinancier.groupBy({
      by: ["type_mouvement"],
      where: { id_groupe: groupId, statut: "VALIDE" },
      _sum: { montant: true },
    }),
    prisma.mouvementFinancier.groupBy({
      by: ["id_caisse"],
      where: { id_groupe: groupId, statut: "VALIDE", type_mouvement: "ENTREE" },
      _sum: { montant: true },
      _count: { id_mouvement: true },
      _max: { date_mouvement: true },
    }),
    prisma.mouvementFinancier.groupBy({
      by: ["id_caisse"],
      where: { id_groupe: groupId, statut: "VALIDE", type_mouvement: "SORTIE" },
      _sum: { montant: true },
      _count: { id_mouvement: true },
      _max: { date_mouvement: true },
    }),
    prisma.mouvementFinancier.findMany({
      where: { id_groupe: groupId, statut: "VALIDE", type_mouvement: "SORTIE" },
      distinct: ["id_caisse"],
      orderBy: [{ id_caisse: "asc" }, { date_mouvement: "desc" }],
      include: {
        admin_createur: {
          select: { user: { select: { nom: true, prenom: true } } },
        },
      },
    }),
    prisma.mouvementFinancier.findMany({
      where: {
        id_groupe: groupId,
        type_mouvement: "SORTIE",
      },
      orderBy: { date_mouvement: "desc" },
      take: limit,
      include: {
        caisse: { select: { nom: true, type_caisse: true } },
        admin_createur: {
          select: { user: { select: { nom: true, prenom: true } } },
        },
        membre_concerne: {
          select: { user: { select: { nom: true, prenom: true } } },
        },
      },
    }),
    showDetailedJournal
      ? prisma.mouvementFinancier.findMany({
          where: { id_groupe: groupId },
          orderBy: { date_mouvement: "desc" },
          take: limit,
          include: {
            caisse: { select: { nom: true, type_caisse: true } },
            admin_createur: {
              select: { user: { select: { nom: true, prenom: true } } },
            },
            membre_concerne: {
              select: { user: { select: { nom: true, prenom: true } } },
            },
          },
        })
      : Promise.resolve([]),
  ]);

  const devise = membership.groupe.devise;
  const totalEntrees = totals
    .filter((total) => total.type_mouvement === "ENTREE")
    .reduce((sum, total) => sum + Number(total._sum.montant ?? 0), 0);
  const totalSorties = totals
    .filter((total) => total.type_mouvement === "SORTIE")
    .reduce((sum, total) => sum + Number(total._sum.montant ?? 0), 0);
  const soldeRestant = caisses.reduce((sum, caisse) => sum + Number(caisse.solde_actuel), 0);
  const caisseById = new Map(caisses.map((caisse) => [caisse.id_caisse, caisse]));
  const dernierRetraitByCaisse = new Map(
    derniersRetraitsParCaisse.map((retrait) => [retrait.id_caisse, retrait]),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-brand-700 dark:text-brand-300">
            Journal financier
          </p>
          <h1 className="text-2xl font-semibold text-slate-950 dark:text-white">
            {membership.groupe.nom}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
            Vue simple des caisses, des entrées résumées et des retraits effectués. Les écritures
            détaillées restent conservées pour la traçabilité.
          </p>
        </div>
        <Link
          href={`/dashboard/groups/${groupId}`}
          className="inline-flex items-center justify-center rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10"
        >
          Retour au groupe
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-950">
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <Wallet className="h-4 w-4" />
            Caisses visibles
          </div>
          <p className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">
            {caisses.length}
          </p>
        </div>
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/60 dark:bg-emerald-950/30">
          <div className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-300">
            <ArrowDownLeft className="h-4 w-4" />
            Entrées
          </div>
          <p className="mt-2 text-2xl font-semibold text-emerald-900 dark:text-emerald-100">
            {formatMoney(totalEntrees, devise)}
          </p>
        </div>
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 dark:border-rose-900/60 dark:bg-rose-950/30">
          <div className="flex items-center gap-2 text-sm text-rose-700 dark:text-rose-300">
            <ArrowUpRight className="h-4 w-4" />
            Sorties
          </div>
          <p className="mt-2 text-2xl font-semibold text-rose-900 dark:text-rose-100">
            {formatMoney(totalSorties, devise)}
          </p>
        </div>
        <div className="rounded-lg border border-brand-200 bg-brand-50 p-4 dark:border-brand-900/60 dark:bg-brand-950/30">
          <div className="flex items-center gap-2 text-sm text-brand-700 dark:text-brand-300">
            <Wallet className="h-4 w-4" />
            Solde restant
          </div>
          <p className="mt-2 text-2xl font-semibold text-brand-900 dark:text-brand-100">
            {formatMoney(soldeRestant, devise)}
          </p>
        </div>
      </div>

      {caisses.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-slate-950 dark:text-white">
            Soldes des caisses
          </h2>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {caisses.map((caisse) => (
              <div
                key={caisse.id_caisse}
                className="rounded-lg border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-950"
              >
                <p className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
                  {caisseLabel(caisse.type_caisse)}
                </p>
                <p className="mt-1 font-semibold text-slate-950 dark:text-white">{caisse.nom}</p>
                <p className="mt-3 text-xl font-semibold text-brand-700 dark:text-brand-300">
                  {formatMoney(caisse.solde_actuel, devise)}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-slate-950 dark:text-white">
          Entrées résumées par caisse
        </h2>
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-950">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-white/10">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500 dark:bg-white/5 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3">Caisse</th>
                  <th className="px-4 py-3 text-right">Total reçu</th>
                  <th className="px-4 py-3 text-right">Nombre d'entrées</th>
                  <th className="px-4 py-3">Dernière entrée</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                {entreesParCaisse.map((resume) => {
                  const caisse = caisseById.get(resume.id_caisse);
                  return (
                    <tr key={resume.id_caisse}>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900 dark:text-white">
                          {caisse?.nom ?? "Caisse"}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {caisse ? caisseLabel(caisse.type_caisse) : "-"}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-emerald-700 dark:text-emerald-300">
                        {formatMoney(resume._sum.montant, devise)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-slate-600 dark:text-slate-300">
                        {resume._count.id_mouvement.toLocaleString("fr-FR")}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600 dark:text-slate-300">
                        {resume._max.date_mouvement ? formatDate(resume._max.date_mouvement) : "-"}
                      </td>
                    </tr>
                  );
                })}
                {entreesParCaisse.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400"
                    >
                      Aucune entrée enregistrée pour le moment.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-base font-semibold text-slate-950 dark:text-white">
          Retraits résumés par caisse
        </h2>
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-950">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-white/10">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500 dark:bg-white/5 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3">Caisse</th>
                  <th className="px-4 py-3 text-right">Total retiré</th>
                  <th className="px-4 py-3 text-right">Solde restant</th>
                  <th className="px-4 py-3 text-right">Nombre de retraits</th>
                  <th className="px-4 py-3">Dernier retrait</th>
                  <th className="px-4 py-3">Dernier admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                {retraitsParCaisse.map((resume) => {
                  const caisse = caisseById.get(resume.id_caisse);
                  const dernierRetrait = dernierRetraitByCaisse.get(resume.id_caisse);
                  const admin = dernierRetrait?.admin_createur?.user;
                  return (
                    <tr key={resume.id_caisse}>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900 dark:text-white">
                          {caisse?.nom ?? "Caisse"}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {caisse ? caisseLabel(caisse.type_caisse) : "-"}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-rose-700 dark:text-rose-300">
                        {formatMoney(resume._sum.montant, devise)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-slate-950 dark:text-white">
                        {formatMoney(caisse?.solde_actuel ?? 0, devise)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right text-slate-600 dark:text-slate-300">
                        {resume._count.id_mouvement.toLocaleString("fr-FR")}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600 dark:text-slate-300">
                        {resume._max.date_mouvement ? formatDate(resume._max.date_mouvement) : "-"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600 dark:text-slate-300">
                        {admin ? `${admin.prenom} ${admin.nom}` : "-"}
                      </td>
                    </tr>
                  );
                })}
                {retraitsParCaisse.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400"
                    >
                      Aucun retrait enregistré par caisse.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-base font-semibold text-slate-950 dark:text-white">
            Retraits et sorties à surveiller
          </h2>
          <div className="flex flex-wrap gap-2 text-sm">
            <Link
              href={`/dashboard/groups/${groupId}/finances?limit=50`}
              className="rounded-md border border-slate-200 px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10"
            >
              50 derniers
            </Link>
            <Link
              href={`/dashboard/groups/${groupId}/finances?limit=100`}
              className="rounded-md border border-slate-200 px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10"
            >
              100 derniers
            </Link>
          </div>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Chaque sortie garde sa date, le motif, la caisse débitée, le montant retiré et le nom de
          l'admin qui l'a enregistrée.
        </p>
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-950">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-white/10">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500 dark:bg-white/5 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Caisse</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Motif</th>
                  <th className="px-4 py-3 text-right">Montant retiré</th>
                  <th className="px-4 py-3 text-right">Solde après</th>
                  <th className="px-4 py-3">Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                {sorties.map((sortie) => {
                  const admin = sortie.admin_createur?.user;
                  return (
                    <tr key={sortie.id_mouvement}>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600 dark:text-slate-300">
                        {formatDate(sortie.date_mouvement)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900 dark:text-white">
                          {sortie.caisse.nom}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {caisseLabel(sortie.caisse.type_caisse)}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600 dark:text-slate-300">
                        {sourceLabel(sortie.source)}
                      </td>
                      <td className="min-w-[220px] px-4 py-3 text-slate-700 dark:text-slate-200">
                        {sortie.motif}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-rose-700 dark:text-rose-300">
                        {formatMoney(sortie.montant, devise)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-slate-950 dark:text-white">
                        {formatMoney(sortie.solde_apres, devise)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-600 dark:text-slate-300">
                        {admin ? `${admin.prenom} ${admin.nom}` : "-"}
                      </td>
                    </tr>
                  );
                })}
                {sorties.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400"
                    >
                      Aucun retrait ni sortie d'argent enregistré.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-950 dark:text-white">
              Journal détaillé
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Les paiements individuels sont résumés pour garder la page lisible. La liste complète
              reste disponible en cas de vérification.
            </p>
          </div>
          <Link
            href={
              showDetailedJournal
                ? `/dashboard/groups/${groupId}/finances`
                : `/dashboard/groups/${groupId}/finances?vue=detail&limit=${limit}`
            }
            className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-white/10"
          >
            {showDetailedJournal ? "Masquer le détail" : "Voir le détail"}
          </Link>
        </div>

        {showDetailedJournal ? (
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-950">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-white/10">
                <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500 dark:bg-white/5 dark:text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Caisse</th>
                    <th className="px-4 py-3">Mouvement</th>
                    <th className="px-4 py-3">Motif</th>
                    <th className="px-4 py-3 text-right">Entrée</th>
                    <th className="px-4 py-3 text-right">Sortie</th>
                    <th className="px-4 py-3 text-right">Solde après</th>
                    <th className="px-4 py-3">Membre</th>
                    <th className="px-4 py-3">Enregistré par</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/10">
                  {mouvementsDetailles.map((mouvement) => {
                    const admin = mouvement.admin_createur?.user;
                    const membre = mouvement.membre_concerne?.user;
                    return (
                      <tr key={mouvement.id_mouvement}>
                        <td className="whitespace-nowrap px-4 py-3 text-slate-600 dark:text-slate-300">
                          {formatDate(mouvement.date_mouvement)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-900 dark:text-white">
                            {mouvement.caisse.nom}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {caisseLabel(mouvement.caisse.type_caisse)}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                              mouvement.type_mouvement === "ENTREE"
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                                : "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                            }`}
                          >
                            {mouvement.type_mouvement === "ENTREE" ? "Entrée" : "Sortie"}
                          </span>
                        </td>
                        <td className="min-w-[220px] px-4 py-3 text-slate-700 dark:text-slate-200">
                          {mouvement.motif}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-emerald-700 dark:text-emerald-300">
                          {mouvement.type_mouvement === "ENTREE"
                            ? formatMoney(mouvement.montant, devise)
                            : "-"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-rose-700 dark:text-rose-300">
                          {mouvement.type_mouvement === "SORTIE"
                            ? formatMoney(mouvement.montant, devise)
                            : "-"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-slate-950 dark:text-white">
                          {formatMoney(mouvement.solde_apres, devise)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-slate-600 dark:text-slate-300">
                          {membre ? `${membre.prenom} ${membre.nom}` : "-"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-slate-600 dark:text-slate-300">
                          {admin ? `${admin.prenom} ${admin.nom}` : "-"}
                        </td>
                      </tr>
                    );
                  })}
                  {mouvementsDetailles.length === 0 && (
                    <tr>
                      <td
                        colSpan={9}
                        className="px-4 py-10 text-center text-sm text-slate-500 dark:text-slate-400"
                      >
                        Aucun mouvement financier enregistré pour le moment.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
