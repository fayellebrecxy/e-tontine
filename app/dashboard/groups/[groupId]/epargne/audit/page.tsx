import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Filter } from "lucide-react";

import { Prisma, RoleActeurEpargne, TypeOperationEpargne } from "@/lib/generated/prisma";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatMontant } from "@/lib/epargne";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

type SearchParams = {
  type?: string;
  membre?: string;
  role?: string;
  debut?: string;
  fin?: string;
};

function valueOf(param: string | string[] | undefined) {
  return Array.isArray(param) ? param[0] : param;
}

function fmtDate(date: Date) {
  return date.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function EpargneAuditPage({
  params,
  searchParams,
}: {
  params: Promise<{ groupId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { groupId } = await params;
  const query = await searchParams;

  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/auth/login");

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const membership = await prisma.membreGroupe.findFirst({
    where: { id_user: user.id, id_groupe: groupId, role: "ADMIN", statut_adhesion: "ACTIF" },
    select: { id_membre_groupe: true, groupe: { select: { devise: true } } },
  });
  if (!membership) redirect(`/dashboard/groups/${groupId}/epargne`);

  const filters: SearchParams = {
    type: valueOf(query.type),
    membre: valueOf(query.membre),
    role: valueOf(query.role),
    debut: valueOf(query.debut),
    fin: valueOf(query.fin),
  };

  const where: Prisma.MouvementEpargneWhereInput = {
    id_groupe: groupId,
    ...(filters.type === "DEPOT" || filters.type === "RETRAIT"
      ? { type_operation: filters.type as TypeOperationEpargne }
      : {}),
    ...(filters.role === "ADMIN" || filters.role === "SYSTEME"
      ? { role_acteur: filters.role as RoleActeurEpargne }
      : {}),
    ...(filters.membre ? { id_membre_groupe: filters.membre } : {}),
    ...((filters.debut || filters.fin)
      ? {
          date_operation: {
            ...(filters.debut ? { gte: new Date(`${filters.debut}T00:00:00`) } : {}),
            ...(filters.fin ? { lte: new Date(`${filters.fin}T23:59:59`) } : {}),
          },
        }
      : {}),
  };

  const [mouvements, membres] = await Promise.all([
    prisma.mouvementEpargne.findMany({
      where,
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
        membre: { select: { user: { select: { nom: true, prenom: true } } } },
        operateur: { select: { user: { select: { nom: true, prenom: true } } } },
      },
    }),
    prisma.membreGroupe.findMany({
      where: { id_groupe: groupId, statut_adhesion: "ACTIF" },
      orderBy: { user: { prenom: "asc" } },
      select: { id_membre_groupe: true, user: { select: { nom: true, prenom: true } } },
    }),
  ]);

  const devise = membership.groupe.devise;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="outline" size="sm">
          <Link href={`/dashboard/groups/${groupId}/epargne`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour à l'épargne
          </Link>
        </Button>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-950">
        <div className="mb-4 flex items-center gap-2">
          <Filter className="h-5 w-5 text-slate-500" />
          <h1 className="text-xl font-bold text-slate-950 dark:text-white">Journal d'audit épargne</h1>
        </div>
        <form className="grid gap-3 md:grid-cols-5">
          <select name="type" defaultValue={filters.type ?? ""} className="rounded-md border border-input bg-background px-3 py-2 text-sm">
            <option value="">Tous les types</option>
            <option value="DEPOT">Dépôts</option>
            <option value="RETRAIT">Retraits</option>
          </select>
          <select name="membre" defaultValue={filters.membre ?? ""} className="rounded-md border border-input bg-background px-3 py-2 text-sm">
            <option value="">Tous les membres</option>
            {membres.map((member) => (
              <option key={member.id_membre_groupe} value={member.id_membre_groupe}>
                {member.user.prenom} {member.user.nom}
              </option>
            ))}
          </select>
          <select name="role" defaultValue={filters.role ?? ""} className="rounded-md border border-input bg-background px-3 py-2 text-sm">
            <option value="">Tous les rôles</option>
            <option value="ADMIN">Admin</option>
            <option value="SYSTEME">Système</option>
          </select>
          <input name="debut" defaultValue={filters.debut ?? ""} type="date" className="rounded-md border border-input bg-background px-3 py-2 text-sm" />
          <div className="flex gap-2">
            <input name="fin" defaultValue={filters.fin ?? ""} type="date" className="min-w-0 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm" />
            <Button type="submit">Filtrer</Button>
          </div>
        </form>
      </section>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-950">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1040px] text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500 dark:bg-white/5">
              <tr>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Membre concerné</th>
                <th className="px-4 py-3">Opérateur</th>
                <th className="px-4 py-3">Date et heure</th>
                <th className="px-4 py-3">Solde avant</th>
                <th className="px-4 py-3">Solde après</th>
                <th className="px-4 py-3">Motif</th>
              </tr>
            </thead>
            <tbody>
              {mouvements.map((movement) => {
                const isDepot = movement.type_operation === "DEPOT";
                const operatorName = movement.operateur
                  ? `${movement.operateur.user.prenom} ${movement.operateur.user.nom}`
                  : "Système";
                return (
                  <tr key={movement.id_mouvement} className="border-t border-slate-100 dark:border-white/10">
                    <td className={`px-4 py-3 font-black ${isDepot ? "text-emerald-700" : "text-rose-700"}`}>
                      {isDepot ? "Dépôt" : "Retrait"} {isDepot ? "+" : "-"}{formatMontant(movement.montant, devise)}
                    </td>
                    <td className="px-4 py-3 font-semibold">
                      {movement.membre.user.prenom} {movement.membre.user.nom}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold">{operatorName}</span>
                      <Badge className={`ml-2 ${movement.role_acteur === "ADMIN" ? "bg-slate-950 text-white" : "bg-blue-600 text-white"}`}>
                        {movement.role_acteur === "ADMIN" ? "Admin" : "Système"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{fmtDate(movement.date_operation)}</td>
                    <td className="px-4 py-3">{formatMontant(movement.solde_avant, devise)}</td>
                    <td className="px-4 py-3 font-semibold">{formatMontant(movement.solde_apres, devise)}</td>
                    <td className="px-4 py-3">{movement.motif}</td>
                  </tr>
                );
              })}
              {!mouvements.length && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                    Aucun mouvement ne correspond aux filtres.
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
