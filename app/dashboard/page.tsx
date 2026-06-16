import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  ArrowUpRight,
  Bell,
  CalendarClock,
  Plus,
  Repeat,
  Users,
} from "lucide-react";

import { getTranslations } from "next-intl/server";

import { JoinGroupDialog } from "@/components/invitations/join-group-dialog";
import { DashboardNotifications } from "@/components/notifications/dashboard-notifications";
import { DashboardCharts } from "@/components/dashboard/dashboard-charts";
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
  const activeMemberships = memberships.filter((m) => m.statut_adhesion === "ACTIF");
  const totalCycles = activeMemberships.reduce((t, m) => t + m.groupe._count.cycles, 0);
  const totalReunions = activeMemberships.reduce((t, m) => t + m.groupe._count.reunions, 0);
  const pendingNotifications = notifications.filter((n) => !n.date_lecture).length;
  const userName = dbUser ? dbUser.prenom : (user.email ?? "membre");
  const t = await getTranslations("dashboard");

  const kpis = [
    {
      label: t("kpiGroups"),
      value: activeMemberships.length,
      hint: t("kpiGroupsHint"),
      icon: Users,
      href: "/dashboard/groups",
      highlight: true,
    },
    {
      label: t("kpiCycles"),
      value: totalCycles,
      hint: t("kpiCyclesHint"),
      icon: Repeat,
      href: "/dashboard/groups",
      highlight: false,
    },
    {
      label: t("kpiMeetings"),
      value: totalReunions,
      hint: t("kpiMeetingsHint"),
      icon: CalendarClock,
      href: "/dashboard/groups",
      highlight: false,
    },
    {
      label: t("kpiAlerts"),
      value: pendingNotifications,
      hint: t("kpiAlertsHint"),
      icon: Bell,
      href: "/dashboard",
      highlight: false,
    },
  ];

  return (
    <div className="flex flex-col gap-6 font-sans">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-text-main sm:text-3xl">
            {t("greeting", { name: userName })}
          </h1>
          <p className="mt-1 font-sans text-sm text-text-muted">{t("subtitle")}</p>
        </div>
        <div className="flex gap-2">
          <JoinGroupDialog
            variant="outline"
            className="h-10 flex-1 rounded-full border border-border-light bg-surface-container-lowest px-5 text-sm text-on-surface-variant hover:bg-surface-container-low sm:flex-none"
          />
          <Button
            asChild
            size="sm"
            className="h-10 flex-1 rounded-full bg-primary px-5 text-sm font-medium text-on-primary shadow-card transition-all hover:bg-primary/90 active:scale-95 sm:flex-none"
          >
            <Link href="/dashboard/groups/new">
              <Plus className="mr-1.5 h-4 w-4" />
              {t("new")}
            </Link>
          </Button>
        </div>
      </div>

      {/* KPIs : 1 colonne mobile, 2 tablette, 4 desktop */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className={`flex flex-col justify-between rounded-2xl p-5 transition-shadow ${
              kpi.highlight
                ? "bg-primary text-on-primary shadow-lg"
                : "border border-border-light bg-surface-container-lowest text-text-main shadow-card hover:shadow-md"
            }`}
          >
            <div className="flex items-start justify-between">
              <span
                className={`font-sans text-sm font-medium ${
                  kpi.highlight ? "text-on-primary/90" : "text-text-muted"
                }`}
              >
                {kpi.label}
              </span>
              <Link
                href={kpi.href}
                aria-label={kpi.label}
                className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                  kpi.highlight
                    ? "bg-white/15 text-on-primary hover:bg-white/25"
                    : "border border-border-light text-text-muted hover:border-primary hover:text-primary"
                }`}
              >
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-8">
              <div
                className={`font-heading text-4xl font-bold leading-none ${
                  kpi.highlight ? "text-on-primary" : "text-text-main"
                }`}
              >
                {kpi.value}
              </div>
              <div
                className={`mt-2.5 flex items-center gap-1.5 font-sans text-xs ${
                  kpi.highlight ? "text-on-primary/80" : "text-text-muted"
                }`}
              >
                <kpi.icon className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{kpi.hint}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Contenu principal */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Groupes */}
        <section className="rounded-2xl border border-border-light bg-surface-container-lowest shadow-card lg:col-span-2">
          <header className="flex items-center justify-between px-6 pt-5 pb-4">
            <h2 className="font-heading text-lg font-semibold text-text-main">{t("myGroups")}</h2>
            {activeMemberships.length > 0 && (
              <Link
                href="/dashboard/groups"
                className="rounded-full border border-border-light px-4 py-1.5 font-sans text-xs font-medium text-on-surface-variant transition-colors hover:border-primary hover:text-primary"
              >
                {t("seeAll")}
              </Link>
            )}
          </header>

          {activeMemberships.length > 0 ? (
            <ul className="px-3 pb-3">
              {activeMemberships.slice(0, 5).map((m) => (
                <li key={m.id_groupe}>
                  <Link
                    href={`/dashboard/groups/${m.id_groupe}`}
                    className="flex items-center gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-surface-container-low"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 font-heading text-sm font-bold uppercase text-primary">
                      {m.groupe.nom.substring(0, 2)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-sans text-sm font-semibold text-text-main">
                        {m.groupe.nom}
                      </p>
                      <p className="mt-0.5 font-sans text-xs text-text-muted">
                        {m.groupe._count.membres} membre{m.groupe._count.membres > 1 ? "s" : ""}
                        {" · "}
                        {m.groupe._count.cycles} cycle{m.groupe._count.cycles > 1 ? "s" : ""}
                      </p>
                    </div>
                    <span className="flex h-8 w-8 items-center justify-center rounded-full border border-border-light text-text-muted">
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-surface-container">
                <Users className="h-6 w-6 text-outline" />
              </div>
              <h3 className="font-heading text-sm font-semibold text-text-main">{t("noGroupsTitle")}</h3>
              <p className="mx-auto mt-1 max-w-xs font-sans text-sm text-text-muted">{t("noGroupsText")}</p>
              <Button
                asChild
                size="sm"
                className="mt-4 h-10 rounded-full bg-primary px-5 text-sm font-medium text-on-primary shadow-card hover:bg-primary/90 active:scale-95"
              >
                <Link href="/dashboard/groups/new">
                  <Plus className="mr-1.5 h-4 w-4" />
                  {t("createGroup")}
                </Link>
              </Button>
            </div>
          )}
        </section>

        {/* Activité récente */}
        <section className="flex flex-col rounded-2xl border border-border-light bg-surface-container-lowest shadow-card">
          <header className="flex items-center justify-between px-6 pt-5 pb-4">
            <h2 className="flex items-center gap-2 font-heading text-lg font-semibold text-text-main">
              <Bell className="h-4 w-4 text-warning" />
              {t("activity")}
            </h2>
            {pendingNotifications > 0 && (
              <span className="badge-warning text-xs">{pendingNotifications}</span>
            )}
          </header>

          <div className="flex-1 px-6 pb-5">
            {notifications.length > 0 ? (
              <DashboardNotifications
                initialNotifications={notifications.map((n) => ({
                  id_notification: n.id_notification,
                  type_notification: n.type_notification,
                  message: n.message,
                  date_creation: n.date_creation.toISOString(),
                  date_lecture: n.date_lecture?.toISOString() ?? null,
                }))}
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-surface-container">
                  <Bell className="h-5 w-5 text-outline" />
                </div>
                <p className="font-sans text-sm text-text-muted">{t("noNotifications")}</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
