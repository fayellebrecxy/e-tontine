import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, Users, ArrowRight } from "lucide-react";

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
  const activeMemberships = memberships.filter((m) => m.statut_adhesion === "ACTIF");
  const adminMemberships = memberships.filter((m) => m.role === "ADMIN");

  return (
    <div className="flex flex-col font-sans gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-text-main">Mes Groupes</h1>
          <p className="font-sans text-sm text-text-muted mt-1">
            Gérez vos tontines et suivez les contributions de vos groupes.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <JoinGroupDialog
            variant="outline"
            className="bg-surface-container-lowest border border-border-light text-on-surface-variant hover:bg-surface-container-low font-sans text-sm rounded-lg h-9"
          />
          <Button
            asChild
            className="bg-primary text-on-primary hover:bg-primary/90 font-sans font-medium text-sm rounded-lg h-9 shadow-card active:scale-95 transition-all"
          >
            <Link href="/dashboard/groups/new">
              <Plus className="mr-1.5 h-4 w-4" />
              Nouveau Groupe
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats bar */}
      {memberships.length > 0 && (
        <div className="flex gap-3 bg-surface-container-lowest p-2 rounded-xl border border-border-light">
          <div className="flex bg-surface-container p-1 rounded-lg gap-1">
            <span className="px-4 py-1.5 rounded-md bg-surface-container-lowest shadow-card text-primary font-sans text-sm font-medium">
              Tous ({memberships.length})
            </span>
            <span className="px-4 py-1.5 rounded-md text-text-muted hover:text-text-main font-sans text-sm font-medium cursor-default">
              Admin ({adminMemberships.length})
            </span>
            <span className="px-4 py-1.5 rounded-md text-text-muted hover:text-text-main font-sans text-sm font-medium cursor-default">
              Membre ({memberships.length - adminMemberships.length})
            </span>
          </div>
        </div>
      )}

      {/* Groups grid */}
      {memberships.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {memberships.map((m) => {
            const isAdmin = m.role === "ADMIN";
            const isActive = m.statut_adhesion === "ACTIF";
            return (
              <div
                key={m.id_groupe}
                className="group-card hover:shadow-md transition-all duration-200"
              >
                {/* Top color bar */}
                <div
                  className="absolute top-0 left-0 w-full h-1 rounded-t-xl"
                  style={{ backgroundColor: isAdmin ? "#006b2c" : isActive ? "#4059aa" : "#F97316" }}
                />

                <div className="flex justify-between items-start mb-4 pt-1">
                  <div>
                    <span className="inline-flex items-center gap-1 bg-surface-container-low px-2 py-1 rounded-full font-sans text-xs font-medium mb-2"                     style={{ color: isAdmin ? "#006b2c" : "#64748B" }}>
                      {isAdmin ? "Admin" : "Membre"}
                    </span>
                    <h3 className="font-heading text-base font-semibold text-text-main">{m.groupe.nom}</h3>
                  </div>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      isActive
                        ? "bg-[#DCFCE7] text-[#166534]"
                        : "bg-[#FFEDD5] text-[#9A3412]"
                    }`}
                  >
                    {isActive ? "Actif" : m.statut_adhesion}
                  </span>
                </div>

                <div className="flex items-center gap-3 mb-5">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-heading font-bold text-sm">
                    {m.groupe.nom.substring(0, 2).toUpperCase()}
                  </div>
                  <span className="font-sans text-sm text-text-muted">
                    {m.groupe._count.membres} membre{m.groupe._count.membres > 1 ? "s" : ""}
                  </span>
                </div>

                <div className="bg-surface-light p-3 rounded-lg mb-5 border border-border-light flex justify-between items-center">
                  <div>
                    <p className="font-sans text-xs text-text-muted mb-0.5">Cycles</p>
                    <p className="font-sans text-sm font-semibold text-text-main">
                      {m.groupe._count.cycles}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-sans text-xs text-text-muted mb-0.5">Rôle</p>
                    <p className="font-sans text-sm font-medium text-text-main">{m.role}</p>
                  </div>
                </div>

                <Button
                  asChild
                  variant="outline"
                  className="w-full mt-auto border-border-light text-text-main hover:border-primary hover:text-primary font-sans text-sm rounded-lg h-9 transition-colors group-hover:border-primary group-hover:text-primary"
                >
                  <Link href={`/dashboard/groups/${m.id_groupe}`} className="flex items-center justify-center gap-2">
                    Ouvrir le groupe
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-outline-variant bg-surface-container-lowest px-6 py-16 text-center">
          <div className="mx-auto w-14 h-14 bg-surface-container rounded-full flex items-center justify-center mb-4">
            <Users className="h-7 w-7 text-outline" />
          </div>
          <h2 className="font-heading text-xl font-semibold text-text-main mb-2">Aucun groupe actif</h2>
          <p className="mx-auto max-w-md font-sans text-sm text-text-muted mb-6">
            Vous n&apos;êtes membre d&apos;aucun groupe de tontine. Créez votre première tontine ou rejoignez un groupe existant.
          </p>
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Button
              asChild
              className="bg-primary text-on-primary hover:bg-primary/90 font-sans font-medium text-sm rounded-lg h-9 shadow-card active:scale-95 transition-all"
            >
              <Link href="/dashboard/groups/new">
                <Plus className="mr-1.5 h-4 w-4" />
                Créer un groupe
              </Link>
            </Button>
            <JoinGroupDialog variant="outline" className="border-border-light text-on-surface-variant hover:bg-surface-container-low font-sans text-sm rounded-lg h-9" />
          </div>
        </div>
      )}
    </div>
  );
}
