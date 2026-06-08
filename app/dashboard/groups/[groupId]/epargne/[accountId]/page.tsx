import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ArrowDownCircle, ArrowUpCircle, ListChecks } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatMontant } from "@/lib/epargne";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { OperationEpargneForm } from "@/components/epargne/operation-form";
import { EpargneAccountAdminActions } from "@/components/epargne/account-admin-actions";

export const dynamic = "force-dynamic";

function fmtDate(date: Date) {
  return date.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function EpargneAccountPage({
  params,
}: {
  params: Promise<{ groupId: string; accountId: string }>;
}) {
  const { groupId, accountId } = await params;

  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/auth/login");

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const membership = await prisma.membreGroupe.findFirst({
    where: { id_user: user.id, id_groupe: groupId, role: "ADMIN", statut_adhesion: "ACTIF" },
    select: { id_membre_groupe: true, groupe: { select: { devise: true } } },
  });
  if (!membership) redirect(`/dashboard/groups/${groupId}/epargne`);

  const devise = membership.groupe.devise;
  const account = await prisma.compteEpargne.findFirst({
    where: { id_compte: accountId, id_groupe: groupId },
    select: {
      id_compte: true,
      numero_compte: true,
      solde_actuel: true,
      statut: true,
      _count: { select: { mouvements: true } },
      membre: {
        select: {
          user: { select: { nom: true, prenom: true, email: true } },
        },
      },
      mouvements: {
        orderBy: { date_operation: "desc" },
        take: 200,
        select: {
          id_mouvement: true,
          type_operation: true,
          montant: true,
          motif: true,
          solde_avant: true,
          solde_apres: true,
          date_operation: true,
          role_acteur: true,
          operateur: {
            select: {
              role: true,
              user: { select: { nom: true, prenom: true } },
            },
          },
        },
      },
    },
  });

  if (!account) redirect(`/dashboard/groups/${groupId}/epargne`);

  const totals = await prisma.mouvementEpargne.groupBy({
    by: ["type_operation"],
    where: { id_compte: account.id_compte },
    _sum: { montant: true },
    _count: { id_mouvement: true },
  });
  const totalDepot = totals.find((item) => item.type_operation === "DEPOT")?._sum.montant ?? 0;
  const totalRetrait = totals.find((item) => item.type_operation === "RETRAIT")?._sum.montant ?? 0;
  const operationsCount = totals.reduce((sum, item) => sum + item._count.id_mouvement, 0);

  return (
    <div className="space-y-6">
      <Button asChild variant="outline" size="sm">
        <Link href={`/dashboard/groups/${groupId}/epargne`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour aux comptes
        </Link>
      </Button>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-950">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4 dark:border-white/10">
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">Gestion du compte</p>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Les mouvements ne sont jamais supprimés. Un compte avec historique doit être clôturé.
            </p>
          </div>
          <EpargneAccountAdminActions
            groupId={groupId}
            accountId={account.id_compte}
            status={account.statut}
            movementsCount={account._count.mouvements}
            canDelete
          />
        </div>
        <div className="grid gap-5 p-5 lg:grid-cols-[1.25fr_0.75fr]">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-slate-950 text-white dark:bg-white dark:text-slate-950">{account.numero_compte}</Badge>
              <Badge className={account.statut === "ACTIF" ? "bg-emerald-600 text-white" : "bg-slate-600 text-white"}>
                {account.statut}
              </Badge>
            </div>
            <h1 className="mt-3 text-2xl font-black text-slate-950 dark:text-white">
              {account.membre.user.prenom} {account.membre.user.nom}
            </h1>
            <p className="text-sm text-slate-500">{account.membre.user.email}</p>
            <p className="mt-5 text-xs font-semibold uppercase text-slate-500">Solde disponible</p>
            <p className="mt-2 text-5xl font-black tracking-tight text-emerald-700">
              {formatMontant(account.solde_actuel, devise)}
            </p>
          </div>
          <div className="grid gap-3">
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/30">
              <ArrowDownCircle className="mb-2 h-5 w-5 text-emerald-700" />
              <p className="text-xs text-emerald-800">Total déposé cumulé</p>
              <p className="text-xl font-black text-emerald-800">{formatMontant(totalDepot, devise)}</p>
            </div>
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 dark:border-rose-900 dark:bg-rose-950/30">
              <ArrowUpCircle className="mb-2 h-5 w-5 text-rose-700" />
              <p className="text-xs text-rose-800">Total retiré cumulé</p>
              <p className="text-xl font-black text-rose-800">{formatMontant(totalRetrait, devise)}</p>
            </div>
            <div className="rounded-lg border border-slate-200 p-4 dark:border-white/10">
              <ListChecks className="mb-2 h-5 w-5 text-slate-700 dark:text-slate-200" />
              <p className="text-xs text-slate-500">Nombre d'opérations</p>
              <p className="text-xl font-black">{operationsCount}</p>
            </div>
          </div>
        </div>
      </section>

      {account.statut === "ACTIF" ? (
        <OperationEpargneForm groupId={groupId} accountId={account.id_compte} devise={devise} />
      ) : (
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-5 py-4 text-sm text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
          Ce compte est {account.statut.toLowerCase()}. Aucun dépôt ni retrait ne peut être enregistré tant
          qu'il n'est pas actif.
        </div>
      )}

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-950">
        <div className="border-b border-slate-200 px-5 py-4 dark:border-white/10">
          <h2 className="font-semibold">Mouvements du compte</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500 dark:bg-white/5">
              <tr>
                <th className="px-4 py-3">Date/heure</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Montant</th>
                <th className="px-4 py-3">Solde avant</th>
                <th className="px-4 py-3">Solde après</th>
                <th className="px-4 py-3">Opérateur</th>
                <th className="px-4 py-3">Motif</th>
              </tr>
            </thead>
            <tbody>
              {account.mouvements.map((movement) => {
                const isDepot = movement.type_operation === "DEPOT";
                const operatorName = movement.operateur
                  ? `${movement.operateur.user.prenom} ${movement.operateur.user.nom}`
                  : "Système";
                return (
                  <tr key={movement.id_mouvement} className="border-t border-slate-100 dark:border-white/10">
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{fmtDate(movement.date_operation)}</td>
                    <td className="px-4 py-3 font-semibold">{isDepot ? "Dépôt" : "Retrait"}</td>
                    <td className={`px-4 py-3 font-black ${isDepot ? "text-emerald-700" : "text-rose-700"}`}>
                      {isDepot ? "+" : "-"}{formatMontant(movement.montant, devise)}
                    </td>
                    <td className="px-4 py-3">{formatMontant(movement.solde_avant, devise)}</td>
                    <td className="px-4 py-3 font-semibold">{formatMontant(movement.solde_apres, devise)}</td>
                    <td className="px-4 py-3">
                      <span className="font-semibold">{operatorName}</span>{" "}
                      <Badge variant="secondary" className="ml-1 bg-slate-100 text-slate-700">
                        {movement.role_acteur === "ADMIN" ? "Admin" : "Système"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">{movement.motif}</td>
                  </tr>
                );
              })}
              {!account.mouvements.length && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                    Aucun mouvement enregistré.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
