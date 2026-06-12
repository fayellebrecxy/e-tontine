import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, Users, Landmark, Search } from "lucide-react";

import { JoinGroupDialog } from "@/components/invitations/join-group-dialog";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function GroupsIndexPage() {
  const supabase = await createSupabaseServerClient();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;

  if (!user) {
    redirect("/auth/login?next=/dashboard/groups");
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
                },
              },
            },
          },
        },
        orderBy: { date_adhesion: "desc" },
      },
    },
  });

  const memberships = dbUser?.memberships ?? [];

  return (
    <div className="flex flex-col font-sans gap-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl md:text-3xl text-slate-900 font-bold mb-2">Mes Groupes</h1>
          <p className="text-base text-slate-500">Gérez vos tontines et suivez les activités de vos groupes.</p>
        </div>
        <div className="flex items-center gap-3">
          <JoinGroupDialog variant="outline" className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm" />
          <Button asChild className="bg-green-600 text-white font-medium hover:bg-green-700 shadow-sm">
            <Link href="/dashboard/groups/new">
              <Plus className="mr-2 h-5 w-5" />
              Nouveau Groupe
            </Link>
          </Button>
        </div>
      </div>

      {/* Grid of groups */}
      {memberships.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {memberships.map((m) => (
            <div key={m.id_groupe} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition">
              <div className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-12 w-12 rounded-full bg-green-50 text-green-700 flex items-center justify-center font-heading text-xl font-bold uppercase">
                    {m.groupe.nom.substring(0, 2)}
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold text-lg text-slate-900">{m.groupe.nom}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{m.statut_adhesion}</span>
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-50 text-green-700">{m.role}</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="border border-slate-100 rounded-lg p-3 text-center bg-slate-50/50">
                    <p className="text-2xl font-semibold text-slate-800">{m.groupe._count.membres}</p>
                    <p className="text-xs font-medium text-slate-500 mt-1 uppercase tracking-wider">Membres</p>
                  </div>
                  <div className="border border-slate-100 rounded-lg p-3 text-center bg-slate-50/50">
                    <p className="text-2xl font-semibold text-slate-800">{m.groupe._count.cycles}</p>
                    <p className="text-xs font-medium text-slate-500 mt-1 uppercase tracking-wider">Cycles</p>
                  </div>
                </div>
              </div>
              <div className="border-t border-slate-100 p-4 bg-slate-50">
                <Button asChild className="w-full bg-white border border-slate-200 text-slate-700 hover:text-green-700 hover:bg-green-50 font-medium">
                  <Link href={`/dashboard/groups/${m.id_groupe}`}>
                    Accéder au groupe
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-md bg-slate-50 text-slate-400">
            <Landmark className="h-7 w-7" />
          </div>
          <h2 className="mt-5 text-xl font-heading font-semibold text-slate-900">Aucun groupe actif</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
            Vous n'êtes membre d'aucun groupe de tontine. Créez votre première tontine ou rejoignez un groupe existant à l'aide d'un code d'invitation.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild className="bg-green-600 hover:bg-green-700 font-medium">
              <Link href="/dashboard/groups/new">
                <Plus className="mr-2 h-4 w-4" />
                Créer un groupe
              </Link>
            </Button>
            <JoinGroupDialog variant="outline" />
          </div>
        </div>
      )}
    </div>
  );
}
