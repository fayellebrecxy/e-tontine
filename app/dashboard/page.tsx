import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  Bell,
  CheckCircle2,
  CircleDollarSign,
  FileText,
  Landmark,
  PlusCircle,
  Users,
} from "lucide-react";

import { JoinGroupDialog } from "@/components/invitations/join-group-dialog";
import { DashboardNotifications } from "@/components/notifications/dashboard-notifications";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;

  if (!user) {
    redirect("/auth/login?next=/dashboard");
  }

  const dbUser = await prisma.user.findUnique({
    where: { id_user: user.id },
    include: {
      memberships: {
        include: {
          groupe: {
            include: {
              _count: {
                select: {
                  membres: true,
                  cycles: true,
                  reunions: true,
                  rubriques_cotisation: true,
                },
              },
            },
          },
        },
        orderBy: { date_adhesion: "desc" },
      },
    },
  });

  const notifications = dbUser
    ? await prisma.notificationGroupe.findMany({
        where: { id_user: dbUser.id_user },
        orderBy: { date_creation: "desc" },
        take: 5,
      })
    : [];

  const memberships = dbUser?.memberships ?? [];
  const activeMemberships = memberships.filter(
    (membership) => membership.statut_adhesion === "ACTIF",
  );
  const adminMemberships = memberships.filter((membership) => membership.role === "ADMIN");
  const totalCycles = activeMemberships.reduce(
    (total, membership) => total + membership.groupe._count.cycles,
    0,
  );
  const totalMembers = activeMemberships.reduce(
    (total, membership) => total + membership.groupe._count.membres,
    0,
  );
  const pendingNotifications = notifications.filter(
    (notification) => !notification.date_lecture,
  ).length;
  const userName = dbUser ? `${dbUser.prenom} ${dbUser.nom}` : (user.email ?? "membre");
  const dashboardNotifications = notifications.map((notification) => ({
    id_notification: notification.id_notification,
    type_notification: notification.type_notification,
    message: notification.message,
    date_creation: notification.date_creation.toISOString(),
    date_lecture: notification.date_lecture?.toISOString() ?? null,
  }));

  const quickActions = [
    {
      title: "Créer un groupe",
      text: "Lancez une nouvelle tontine et invitez vos participants.",
      href: "/dashboard/groups/new",
      icon: PlusCircle,
      primary: true,
    },
    {
      title: "Rejoindre une tontine",
      text: "Utilisez un lien ou un code d’invitation reçu.",
      icon: Users,
      dialog: true,
    },
    {
      title: "Voir mon compte",
      text: "Mettez à jour vos informations personnelles.",
      href: "/account",
      icon: FileText,
    },
  ];

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-slate-950 text-white shadow-sm dark:border-white/10">
        <div className="grid gap-8 p-6 md:grid-cols-[1fr_auto] md:p-8">
          <div className="max-w-3xl">
            <Badge className="border-white/10 bg-white/10 text-white hover:bg-white/10">
              Espace personnel
            </Badge>
            <h1 className="mt-4 text-3xl font-semibold tracking-normal sm:text-4xl">
              Bonjour {userName}, gardez vos tontines sous contrôle.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
              Retrouvez vos groupes, les cycles à suivre, les notifications récentes et les
              prochaines actions utiles depuis un seul point d’entrée.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button asChild className="bg-white text-slate-950 hover:bg-slate-100">
                <Link href="/dashboard/groups/new">
                  <PlusCircle className="h-4 w-4" />
                  Nouveau groupe
                </Link>
              </Button>
              <JoinGroupDialog
                variant="outline"
                className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
              />
            </div>
          </div>
          <div className="grid min-w-64 gap-3 sm:grid-cols-2 md:grid-cols-1">
            <div className="rounded-lg border border-white/10 bg-white/10 p-4">
              <p className="text-xs text-slate-300">Groupes actifs</p>
              <p className="mt-2 text-3xl font-semibold">{activeMemberships.length}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/10 p-4">
              <p className="text-xs text-slate-300">Notifications non lues</p>
              <p className="mt-2 text-3xl font-semibold">{pendingNotifications}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Groupes",
            value: memberships.length,
            helper: "créés ou rejoints",
            icon: Landmark,
          },
          {
            label: "Cycles",
            value: totalCycles,
            helper: "dans vos groupes actifs",
            icon: CircleDollarSign,
          },
          {
            label: "Membres suivis",
            value: totalMembers,
            helper: "tous groupes actifs",
            icon: Users,
          },
          {
            label: "Rôle admin",
            value: adminMemberships.length,
            helper: "groupe(s) à piloter",
            icon: CheckCircle2,
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#f6f4ef] text-slate-700 dark:bg-white/10 dark:text-white">
                <stat.icon className="h-5 w-5" />
              </div>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {stat.label}
              </span>
            </div>
            <p className="mt-5 text-3xl font-semibold text-slate-950 dark:text-white">
              {stat.value}
            </p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{stat.helper}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold tracking-normal text-slate-950 dark:text-white">
                Mes groupes
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Ouvrez un groupe pour gérer ses cycles, membres, réunions et rapports.
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href="/dashboard/groups">
                Tout voir
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          {memberships.length ? (
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {memberships.map((membership) => {
                const isActive = membership.statut_adhesion === "ACTIF";

                return (
                  <div
                    key={membership.id_membre_groupe}
                    className="rounded-lg border border-slate-200 bg-[#fbfaf7] p-4 transition hover:border-slate-300 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-950 dark:text-white">
                          {membership.groupe.nom}
                        </p>
                        <p className="mt-1 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">
                          {membership.groupe.description || "Groupe de tontine"}
                        </p>
                      </div>
                      <Badge
                        className={
                          isActive
                            ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                            : "bg-amber-100 text-amber-700 hover:bg-amber-100"
                        }
                      >
                        {isActive ? "Actif" : "Limité"}
                      </Badge>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="rounded-md bg-white p-2 dark:bg-slate-950/40">
                        <p className="font-semibold text-slate-950 dark:text-white">
                          {membership.groupe._count.membres}
                        </p>
                        <p className="text-slate-500">Membres</p>
                      </div>
                      <div className="rounded-md bg-white p-2 dark:bg-slate-950/40">
                        <p className="font-semibold text-slate-950 dark:text-white">
                          {membership.groupe._count.cycles}
                        </p>
                        <p className="text-slate-500">Cycles</p>
                      </div>
                      <div className="rounded-md bg-white p-2 dark:bg-slate-950/40">
                        <p className="font-semibold text-slate-950 dark:text-white">
                          {membership.groupe._count.reunions}
                        </p>
                        <p className="text-slate-500">Réunions</p>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button asChild size="sm">
                        <Link href={`/dashboard/groups/${membership.groupe.id_groupe}`}>
                          Ouvrir
                        </Link>
                      </Button>
                      {membership.role === "ADMIN" ? (
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/dashboard/groups/${membership.groupe.id_groupe}/settings`}>
                            Paramètres
                          </Link>
                        </Button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="mt-5 rounded-lg border border-dashed border-slate-300 bg-[#fbfaf7] px-6 py-12 text-center dark:border-white/15 dark:bg-white/5">
              <Landmark className="mx-auto h-10 w-10 text-slate-400" />
              <h3 className="mt-4 font-semibold text-slate-950 dark:text-white">
                Aucun groupe pour le moment
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
                Créez votre première tontine ou rejoignez un groupe existant avec un code
                d’invitation.
              </p>
              <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
                <Button asChild>
                  <Link href="/dashboard/groups/new">Créer un groupe</Link>
                </Button>
                <JoinGroupDialog variant="outline" />
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
            <h2 className="text-lg font-semibold tracking-normal text-slate-950 dark:text-white">
              Actions rapides
            </h2>
            <div className="mt-4 space-y-3">
              {quickActions.map((action) => (
                <div
                  key={action.title}
                  className="rounded-lg border border-slate-200 p-4 dark:border-white/10"
                >
                  <div className="flex gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#f6f4ef] text-slate-700 dark:bg-white/10 dark:text-white">
                      <action.icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-slate-950 dark:text-white">{action.title}</p>
                      <p className="mt-1 text-sm leading-5 text-slate-500 dark:text-slate-400">
                        {action.text}
                      </p>
                      <div className="mt-3">
                        {action.dialog ? (
                          <JoinGroupDialog variant="sm" />
                        ) : (
                          <Button
                            asChild
                            size="sm"
                            variant={action.primary ? "default" : "outline"}
                          >
                            <Link href={action.href ?? "/dashboard"}>
                              Ouvrir
                              <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-slate-500" />
              <h2 className="text-lg font-semibold tracking-normal text-slate-950 dark:text-white">
                Notifications
              </h2>
            </div>
            <DashboardNotifications initialNotifications={dashboardNotifications} />
          </div>
        </div>
      </section>
    </div>
  );
}
