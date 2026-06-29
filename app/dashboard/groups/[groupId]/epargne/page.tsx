import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertTriangle, ArrowDownCircle, ArrowUpCircle, Banknote, Eye, Landmark } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatMontant } from "@/lib/epargne";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EpargneAccountAdminActions } from "@/components/epargne/account-admin-actions";
import { CreateAllEpargneAccountsButton, CreateEpargneAccountButton } from "@/components/epargne/create-account-actions";
import { EpargneMovementsHistory } from "@/components/epargne/epargne-movements-history";
import { EpargneMemberDepositButton } from "@/components/epargne/epargne-member-deposit-button";

export const dynamic = "force-dynamic";

function startOfMonth() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

export default async function EpargnePage({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params;

  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/auth/login");

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const membership = await prisma.membreGroupe.findFirst({
    where: { id_user: user.id, id_groupe: groupId, statut_adhesion: "ACTIF" },
    select: {
      id_membre_groupe: true,
      role: true,
      groupe: { select: { devise: true } },
      user: { select: { telephone: true } },
    },
  });
  if (!membership) redirect(`/dashboard/groups/${groupId}`);

  const devise = membership.groupe.devise;
  const monthStart = startOfMonth();

  if (membership.role !== "ADMIN") {
    const account = await prisma.compteEpargne.findUnique({
      where: { id_membre_groupe: membership.id_membre_groupe },
      select: {
        id_compte: true,
        numero_compte: true,
        solde_actuel: true,
        date_ouverture: true,
        statut: true,
        mouvements: {
          orderBy: { date_operation: "desc" },
          take: 80,
          select: {
            id_mouvement: true,
            type_operation: true,
            montant: true,
            motif: true,
            solde_apres: true,
            date_operation: true,
            operateur: {
              select: {
                role: true,
                user: { select: { nom: true, prenom: true } },
              },
            },
            signalements: {
              where: { id_membre_groupe: membership.id_membre_groupe },
              select: { id_signalement: true },
            },
          },
        },
      },
    });
    if (!account) {
      return (
        <div className="space-y-6">
          <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-950">
            <div className="border-b border-slate-200 px-5 py-4 dark:border-white/10">
              <h1 className="text-xl font-bold text-slate-950 dark:text-white">Ma banque</h1>
              <p className="text-sm text-slate-500">Compte épargne personnel.</p>
            </div>
            <div className="grid gap-4 p-5 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <p className="text-lg font-bold text-slate-950 dark:text-white">
                  Vous n'avez pas encore de compte épargne.
                </p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  Contactez votre administrateur si vous souhaitez en ouvrir un. Dès que l'admin l'ouvre,
                  il s'affichera ici automatiquement.
                </p>
              </div>
              <Badge variant="secondary" className="w-fit bg-slate-100 text-slate-700">
                Non ouvert
              </Badge>
            </div>
          </section>
        </div>
      );
    }

    const totals = await prisma.mouvementEpargne.groupBy({
      by: ["type_operation"],
      where: { id_compte: account.id_compte },
      _sum: { montant: true },
    });
    const totalDepot = totals.find((item) => item.type_operation === "DEPOT")?._sum.montant ?? 0;
    const totalRetrait = totals.find((item) => item.type_operation === "RETRAIT")?._sum.montant ?? 0;

    return (
      <div className="space-y-6">
        <section className="overflow-hidden rounded-lg border border-emerald-200 bg-white shadow-sm dark:border-emerald-900/60 dark:bg-slate-950">
          <div className="border-b border-emerald-100 bg-emerald-50 px-5 py-4 dark:border-emerald-900/60 dark:bg-emerald-950/30">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-xl font-bold text-slate-950 dark:text-white">Ma banque</h1>
                <p className="text-sm text-emerald-800 dark:text-emerald-200">
                  Consultez votre solde et déposez via Mobile Money.
                </p>
              </div>
              <Badge className="bg-emerald-600 text-white">Mon compte</Badge>
            </div>
          </div>
          <div className="grid gap-5 p-5 lg:grid-cols-[1.3fr_0.7fr]">
            <div>
              <p className="text-xs font-semibold uppercase text-slate-500">Solde disponible</p>
              <p className="mt-2 text-4xl font-black tracking-tight text-emerald-700 md:text-5xl">
                {formatMontant(account.solde_actuel, devise)}
              </p>
              <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-600 dark:text-slate-300">
                <span>Compte : <strong>{account.numero_compte}</strong></span>
                <span>Ouvert le : <strong>{account.date_ouverture.toLocaleDateString("fr-FR")}</strong></span>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-lg border border-slate-200 p-4 dark:border-white/10">
                <p className="text-xs text-slate-500">Total déposé</p>
                <p className="mt-1 text-xl font-bold text-emerald-700">{formatMontant(totalDepot, devise)}</p>
              </div>
              <div className="rounded-lg border border-slate-200 p-4 dark:border-white/10">
                <p className="text-xs text-slate-500">Total retiré</p>
                <p className="mt-1 text-xl font-bold text-rose-700">{formatMontant(totalRetrait, devise)}</p>
              </div>
            </div>
          </div>
        </section>

        <EpargneMemberDepositButton
          groupId={groupId}
          accountId={account.id_compte}
          devise={devise}
          defaultTelephone={membership.user.telephone}
        />

        <EpargneMovementsHistory
          groupId={groupId}
          accountId={account.id_compte}
          devise={devise}
          movements={account.mouvements.map((movement) => ({
            id_mouvement: movement.id_mouvement,
            type_operation: movement.type_operation,
            montant: Number(movement.montant),
            motif: movement.motif,
            solde_apres: Number(movement.solde_apres),
            date_operation: movement.date_operation.toISOString(),
            operatorName: movement.operateur
              ? `${movement.operateur.user.prenom} ${movement.operateur.user.nom}`
              : "Système",
            signalementsCount: movement.signalements.length,
          }))}
        />
      </div>
    );
  }

  const [accounts, membersWithoutAccount, ownAccount, totalSaved, totalDeposits, totalRetraits, monthCounts] = await Promise.all([
    prisma.compteEpargne.findMany({
      where: { id_groupe: groupId },
      orderBy: { membre: { user: { prenom: "asc" } } },
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
      },
    }),
    prisma.membreGroupe.findMany({
      where: {
        id_groupe: groupId,
        statut_adhesion: "ACTIF",
        compte_epargne: null,
      },
      orderBy: { user: { prenom: "asc" } },
      select: {
        id_membre_groupe: true,
        role: true,
        user: { select: { nom: true, prenom: true, email: true } },
      },
    }),
    prisma.compteEpargne.findUnique({
      where: { id_membre_groupe: membership.id_membre_groupe },
      select: {
        id_compte: true,
        numero_compte: true,
        solde_actuel: true,
      },
    }),
    prisma.compteEpargne.aggregate({
      where: { id_groupe: groupId },
      _sum: { solde_actuel: true },
    }),
    prisma.mouvementEpargne.aggregate({
      where: { id_groupe: groupId, type_operation: "DEPOT" },
      _sum: { montant: true },
    }),
    prisma.mouvementEpargne.aggregate({
      where: {
        id_groupe: groupId,
        type_operation: { in: ["RETRAIT", "PRET_DEBIT_BANQUE"] },
      },
      _sum: { montant: true },
    }),
    prisma.mouvementEpargne.groupBy({
      by: ["id_compte"],
      where: { id_groupe: groupId, date_operation: { gte: monthStart } },
      _count: { id_mouvement: true },
    }),
  ]);
  const countByAccount = new Map(monthCounts.map((item) => [item.id_compte, item._count.id_mouvement]));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-950 dark:text-white">Épargne</h1>
          <p className="text-sm text-slate-500">Comptes personnels des membres, séparés du pot tournant.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {ownAccount && (
            <Button asChild>
              <Link href={`/dashboard/groups/${groupId}/epargne/${ownAccount.id_compte}`}>
                <Banknote className="mr-2 h-4 w-4" />
                Mon compte épargne
              </Link>
            </Button>
          )}
          <Button asChild variant="outline">
            <Link href={`/dashboard/groups/${groupId}/epargne/audit`}>
              <Eye className="mr-2 h-4 w-4" />
              Journal d'audit
            </Link>
          </Button>
          <CreateAllEpargneAccountsButton
            groupId={groupId}
            membersWithoutAccountCount={membersWithoutAccount.length}
          />
        </div>
      </div>

      <section className="rounded-lg border border-emerald-200 bg-white p-4 shadow-sm dark:border-emerald-900/60 dark:bg-slate-950">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase text-emerald-700">Ouverture des comptes épargne</p>
            <h2 className="mt-1 text-lg font-bold text-slate-950 dark:text-white">
              {membersWithoutAccount.length} membre(s) sans compte épargne
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Ouvrez un compte individuellement dans la liste ci-dessous, ou créez les comptes pour tous si le groupe s'est mis d'accord.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {!ownAccount ? (
              <CreateEpargneAccountButton
                groupId={groupId}
                memberId={membership.id_membre_groupe}
                label="Ouvrir mon compte"
                size="default"
              />
            ) : null}
            <CreateAllEpargneAccountsButton
              groupId={groupId}
              membersWithoutAccountCount={membersWithoutAccount.length}
            />
          </div>
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100">
        <div>
          <p className="font-semibold">Enregistrer un dépôt ou un retrait</p>
          <p className="text-emerald-800 dark:text-emerald-200">
            Choisissez le compte du membre dans la liste, puis cliquez sur <strong>Dépôt / retrait</strong>.
          </p>
        </div>
        <Banknote className="h-5 w-5 text-emerald-700 dark:text-emerald-300" />
      </div>

      {ownAccount && (
        <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/30">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase text-emerald-800">Mon compte personnel</p>
              <p className="mt-1 text-sm text-emerald-900">
                Compte {ownAccount.numero_compte} · solde {formatMontant(ownAccount.solde_actuel, devise)}
              </p>
            </div>
            <Button asChild variant="outline" className="border-emerald-300 bg-white text-emerald-800 hover:bg-emerald-100">
              <Link href={`/dashboard/groups/${groupId}/epargne/${ownAccount.id_compte}`}>
                Dépôt / retrait sur mon compte
              </Link>
            </Button>
          </div>
        </section>
      )}
      {!ownAccount && (
        <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/30">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase text-emerald-800">Mon compte personnel</p>
              <p className="mt-1 text-sm text-emerald-900">
                Vous êtes admin, mais vous restez aussi membre. Ouvrez votre compte seulement si vous participez à l'épargne.
              </p>
            </div>
            <CreateEpargneAccountButton
              groupId={groupId}
              memberId={membership.id_membre_groupe}
              label="Ouvrir mon compte"
              size="default"
            />
          </div>
        </section>
      )}

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/30">
          <Landmark className="mb-3 h-5 w-5 text-emerald-700" />
          <p className="text-xs font-semibold uppercase text-emerald-800">Solde restant</p>
          <p className="mt-1 text-2xl font-black text-emerald-800">{formatMontant(totalSaved._sum.solde_actuel ?? 0, devise)}</p>
          <p className="mt-1 text-[11px] text-emerald-700 dark:text-emerald-300">Caisse épargne du groupe</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-950">
          <ArrowDownCircle className="mb-3 h-5 w-5 text-emerald-700" />
          <p className="text-xs font-semibold uppercase text-slate-500">Dépôts</p>
          <p className="mt-1 text-2xl font-black text-slate-950 dark:text-white">{formatMontant(totalDeposits._sum.montant ?? 0, devise)}</p>
          <p className="mt-1 text-[11px] text-slate-500">Cumul des versements sur la banque</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-950">
          <ArrowUpCircle className="mb-3 h-5 w-5 text-rose-700" />
          <p className="text-xs font-semibold uppercase text-slate-500">Retraits</p>
          <p className="mt-1 text-2xl font-black text-slate-950 dark:text-white">{formatMontant(totalRetraits._sum.montant ?? 0, devise)}</p>
          <p className="mt-1 text-[11px] text-slate-500">Membres + prêts (cumul)</p>
        </div>
      </div>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-950">
        <div className="border-b border-slate-200 px-5 py-4 dark:border-white/10">
          <h2 className="font-semibold">Liste des comptes</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500 dark:bg-white/5">
              <tr>
                <th className="px-4 py-3">Numéro</th>
                <th className="px-4 py-3">Membre</th>
                <th className="px-4 py-3">Solde actuel</th>
                <th className="px-4 py-3">Opérations du mois</th>
                <th className="px-4 py-3">Historique total</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3 text-right">Action admin</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((account) => (
                <tr key={account.id_compte} className="border-t border-slate-100 dark:border-white/10">
                  <td className="px-4 py-3 font-mono text-xs font-semibold">{account.numero_compte}</td>
                  <td className="px-4 py-3">
                    <p className="font-semibold">{account.membre.user.prenom} {account.membre.user.nom}</p>
                    <p className="text-xs text-slate-500">{account.membre.user.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-md bg-emerald-50 px-3 py-2 font-black text-emerald-800">
                      {formatMontant(account.solde_actuel, devise)}
                    </span>
                  </td>
                  <td className="px-4 py-3">{countByAccount.get(account.id_compte) ?? 0}</td>
                  <td className="px-4 py-3">{account._count.mouvements}</td>
                  <td className="px-4 py-3">
                    <Badge className={account.statut === "ACTIF" ? "bg-emerald-600 text-white" : "bg-slate-600 text-white"}>
                      {account.statut}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button asChild size="sm">
                        <Link href={`/dashboard/groups/${groupId}/epargne/${account.id_compte}`}>
                          <Banknote className="mr-2 h-4 w-4" />
                          Dépôt / retrait
                        </Link>
                      </Button>
                      <EpargneAccountAdminActions
                        groupId={groupId}
                        accountId={account.id_compte}
                        status={account.statut}
                        movementsCount={account._count.mouvements}
                        canDelete
                        compact
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-950">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4 dark:border-white/10">
          <div>
            <h2 className="font-semibold">Membres sans compte épargne</h2>
            <p className="text-xs text-slate-500">
              Ouvrez un compte seulement aux membres qui veulent utiliser l'épargne.
            </p>
          </div>
          <CreateAllEpargneAccountsButton
            groupId={groupId}
            membersWithoutAccountCount={membersWithoutAccount.length}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500 dark:bg-white/5">
              <tr>
                <th className="px-4 py-3">Membre</th>
                <th className="px-4 py-3">Rôle</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {membersWithoutAccount.map((member) => (
                <tr key={member.id_membre_groupe} className="border-t border-slate-100 dark:border-white/10">
                  <td className="px-4 py-3">
                    <p className="font-semibold">{member.user.prenom} {member.user.nom}</p>
                    <p className="text-xs text-slate-500">{member.user.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary">{member.role}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <CreateEpargneAccountButton groupId={groupId} memberId={member.id_membre_groupe} />
                  </td>
                </tr>
              ))}
              {!membersWithoutAccount.length && (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-slate-500">
                    Tous les membres actifs ont déjà un compte épargne.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <p>Chaque opération doit être enregistrée immédiatement après réception ou remise de l'argent.</p>
      </div>
    </div>
  );
}
