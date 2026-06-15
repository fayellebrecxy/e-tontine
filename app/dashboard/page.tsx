import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Bell,
  CalendarDays,
  Gavel,
  Plus,
  Repeat,
  Users
} from "lucide-react";

import { JoinGroupDialog } from "@/components/invitations/join-group-dialog";
import { DashboardNotifications } from "@/components/notifications/dashboard-notifications";
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
  
  // Quick count for active cycles among memberships
  const totalCycles = activeMemberships.reduce(
    (total, membership) => total + membership.groupe._count.cycles,
    0,
  );

  const pendingNotifications = notifications.filter(
    (notification) => !notification.date_lecture,
  ).length;

  const userName = dbUser ? dbUser.prenom : (user.email ?? "membre");

  return (
    <div className="flex flex-col gap-6 font-sans">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl md:text-4xl text-slate-900 font-bold">Bonjour, {userName}</h1>
          <p className="text-base text-slate-500 mt-1">Voici le résumé de vos activités financières communautaires.</p>
        </div>
        <div className="flex gap-3">
          <JoinGroupDialog variant="outline" className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50" />
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mt-2">
        {/* KPI 1 */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="h-5 w-5" />
            </div>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs">Actifs</span>
          </div>
          <div>
            <div className="text-3xl font-heading font-semibold text-slate-900">{activeMemberships.length}</div>
            <div className="text-sm text-slate-500 mt-1">Groupes rejoints</div>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center">
              <Repeat className="h-5 w-5" />
            </div>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs">En cours</span>
          </div>
          <div>
            <div className="text-3xl font-heading font-semibold text-slate-900">{totalCycles}</div>
            <div className="text-sm text-slate-500 mt-1">Cycles actifs</div>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-4 relative overflow-hidden">
          <div className="flex justify-between items-start relative z-10">
            <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center">
              <CalendarDays className="h-5 w-5" />
            </div>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 text-xs">Voir plus</span>
          </div>
          <div className="relative z-10">
            <div className="text-3xl font-heading font-semibold text-slate-900">
              {pendingNotifications}
            </div>
            <div className="text-sm text-slate-500 mt-1">Notifications non lues</div>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center">
              <Gavel className="h-5 w-5" />
            </div>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs">Ce mois</span>
          </div>
          <div>
            <div className="text-3xl font-heading font-semibold text-slate-900">0<span className="text-lg text-slate-400 ml-1">FCFA</span></div>
            <div className="text-sm text-slate-500 mt-1">Pénalités estimées</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
        {/* Chart Area / Dashboard main section */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-heading text-xl font-semibold text-slate-900">Mes Groupes</h3>
            <Button asChild variant="outline" size="sm" className="hidden border-green-200 text-green-700 bg-green-50 hover:bg-green-100 md:flex">
              <Link href="/dashboard/groups/new">
                <Plus className="mr-2 h-4 w-4" />
                Créer un groupe
              </Link>
            </Button>
          </div>
          {activeMemberships.length > 0 ? (
            <div className="space-y-4">
              {activeMemberships.map((m) => (
                <div key={m.id_groupe} className="flex items-center justify-between p-4 border border-slate-100 rounded-lg hover:bg-slate-50 transition">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 font-bold uppercase">
                      {m.groupe.nom.substring(0, 2)}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{m.groupe.nom}</p>
                      <p className="text-xs text-slate-500">{m.groupe._count.membres} membres</p>
                    </div>
                  </div>
                  <Button asChild variant="ghost" size="sm" className="text-slate-500 hover:text-green-600">
                    <Link href={`/dashboard/groups/${m.id_groupe}`}>
                      Voir
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center text-center p-8">
              <div className="bg-slate-50 rounded-full p-4 mb-4">
                <Users className="h-8 w-8 text-slate-400" />
              </div>
              <h4 className="font-heading font-medium text-slate-900 mb-1">Aucun groupe actif</h4>
              <p className="text-sm text-slate-500 mb-4 max-w-sm">Vous n'êtes membre d'aucun groupe de tontine pour le moment. Créez-en un ou rejoignez un groupe existant.</p>
              <Button asChild className="bg-green-600 hover:bg-green-700 text-white">
                <Link href="/dashboard/groups/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Nouveau groupe
                </Link>
              </Button>
            </div>
          )}
        </div>

        {/* Notifications Aside */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-heading text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Bell className="h-4 w-4 text-orange-500" /> Notifications
            </h3>
          </div>
          <div className="flex-1">
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
              <div className="flex h-full flex-col items-center justify-center text-slate-400 p-8">
                <Bell className="h-8 w-8 mb-2 opacity-50" />
                <p className="text-sm">Aucune notification</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
