import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Calendar, Clock, Coins, FileText, MapPin, NotebookPen } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ReunionDetailAdmin } from "@/components/reunions/reunion-detail-admin";
import { ReunionDetailMembre } from "@/components/reunions/reunion-detail-membre";
import { DeleteReunionButton } from "@/components/reunions/delete-reunion-button";
import { EditReunionSheet } from "@/components/reunions/edit-reunion-sheet";

export const dynamic = "force-dynamic";

const TYPE_LABELS = {
  ORDINAIRE: { label: "Ordinaire", className: "bg-blue-100 text-blue-700" },
  EXTRAORDINAIRE: { label: "Extraordinaire", className: "bg-purple-100 text-purple-700" },
  URGENCE: { label: "Urgence", className: "bg-red-100 text-red-700" },
};
const STATUT_LABELS = {
  PLANIFIEE: { label: "Planifiée", className: "bg-emerald-100 text-emerald-700" },
  TERMINEE: { label: "Terminée", className: "bg-gray-100 text-gray-600" },
  ANNULEE: { label: "Annulée", className: "bg-rose-100 text-rose-700" },
};

export default async function ReunionDetailPage({
  params,
}: {
  params: Promise<{ groupId: string; reunionId: string }>;
}) {
  const { groupId, reunionId } = await params;

  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/auth/login");

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const membership = await prisma.membreGroupe.findFirst({
    where: { id_user: user.id, id_groupe: groupId, statut_adhesion: "ACTIF" },
    select: { id_membre_groupe: true, role: true, groupe: { select: { devise: true } } },
  });
  if (!membership) redirect(`/dashboard/groups/${groupId}`);

  const isAdmin = membership.role === "ADMIN";
  const devise = membership.groupe.devise;

  const reunion = await prisma.reunion.findFirst({
    where: { id_reunion: reunionId, id_groupe: groupId },
    select: {
      id_reunion: true,
      titre: true,
      description: true,
      date_reunion: true,
      lieu: true,
      type_reunion: true,
      statut: true,
      montant_amende: true,
      compte_rendu: true,
      presences: {
        select: {
          id_presence: true,
          id_membre_groupe: true,
          statut_presence: true,
          amende_payee: true,
          note_absence: true,
          membre_groupe: {
            select: {
              user: { select: { nom: true, prenom: true, email: true } },
            },
          },
        },
      },
    },
  });

  if (!reunion) redirect(`/dashboard/groups/${groupId}/reunions`);

  // Tous les membres actifs (pour l'admin)
  const membresActifs = isAdmin
    ? await prisma.membreGroupe.findMany({
        where: { id_groupe: groupId, statut_adhesion: "ACTIF" },
        select: {
          id_membre_groupe: true,
          user: { select: { nom: true, prenom: true, email: true } },
        },
        orderBy: { user: { prenom: "asc" } },
      })
    : [];

  const montantAmende = reunion.montant_amende ? Number(reunion.montant_amende) : 0;
  const typeInfo = TYPE_LABELS[reunion.type_reunion];
  const statutInfo = STATUT_LABELS[reunion.statut];
  const hasHistory = reunion.presences.length > 0 || !!reunion.compte_rendu;
  const hasPaidFine = reunion.presences.some((presence) => presence.amende_payee);
  const canDeleteReunion = reunion.statut === "PLANIFIEE" && !hasHistory && !hasPaidFine;
  const canCancelReunion = reunion.statut === "PLANIFIEE";

  // Ma présence (pour le membre)
  const myPresence = !isAdmin
    ? reunion.presences.find((p) => p.id_membre_groupe === membership.id_membre_groupe) ?? null
    : null;

  const dateLabel = reunion.date_reunion.toLocaleDateString("fr-FR", {
    weekday: "long", day: "2-digit", month: "long", year: "numeric",
  });
  const timeLabel = reunion.date_reunion.toLocaleTimeString("fr-FR", {
    hour: "2-digit", minute: "2-digit",
  });

  const infoTiles = [
    { icon: Calendar, label: "Date", value: dateLabel },
    { icon: Clock, label: "Heure", value: timeLabel },
    { icon: MapPin, label: "Lieu", value: reunion.lieu || "Non précisé" },
    {
      icon: Coins,
      label: "Amende d'absence",
      value: montantAmende > 0 ? `${montantAmende.toLocaleString("fr-FR")} ${devise}` : "Aucune",
    },
  ];

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

      {/* En-tête réunion */}
      <div className="overflow-hidden rounded-2xl border border-border-light bg-surface-container-lowest shadow-card">
        <div className="bg-gradient-to-br from-primary/10 via-surface-container-lowest to-surface-container-lowest p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className={typeInfo.className + " text-xs"}>
                  {typeInfo.label}
                </Badge>
                <Badge variant="secondary" className={statutInfo.className + " text-xs"}>
                  {statutInfo.label}
                </Badge>
              </div>
              <h1 className="font-heading text-2xl font-bold text-on-surface sm:text-3xl">
                {reunion.titre}
              </h1>
            </div>
            {isAdmin && (
              <div className="flex items-center gap-2">
                {reunion.statut === "PLANIFIEE" && (
                  <EditReunionSheet
                    groupId={groupId}
                    reunionId={reunionId}
                    devise={devise}
                    initial={{
                      titre: reunion.titre,
                      description: reunion.description,
                      date_reunion: reunion.date_reunion.toISOString(),
                      lieu: reunion.lieu,
                      type_reunion: reunion.type_reunion,
                      montant_amende: reunion.montant_amende ? Number(reunion.montant_amende) : null,
                    }}
                  />
                )}
                <DeleteReunionButton
                  groupId={groupId}
                  reunionId={reunionId}
                  titre={reunion.titre}
                  canDelete={canDeleteReunion}
                  canCancel={canCancelReunion}
                />
              </div>
            )}
          </div>
        </div>

        {/* Infos clés — tuiles bien visibles */}
        <div className="grid grid-cols-2 gap-px border-t border-border-light bg-border-light lg:grid-cols-4">
          {infoTiles.map(({ icon: Icon, label, value }) => (
            <div key={label} className="bg-surface-container-lowest p-4 sm:p-5">
              <div className="flex items-center gap-2 text-on-surface-variant">
                <Icon className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
              </div>
              <p className="mt-2 font-sans text-sm font-semibold capitalize text-on-surface sm:text-base">
                {value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Ordre du jour */}
      {reunion.description && (
        <div className="rounded-2xl border border-border-light bg-surface-container-lowest p-5 shadow-card sm:p-6">
          <div className="mb-3 flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <h2 className="font-heading text-lg font-semibold text-on-surface">Ordre du jour</h2>
          </div>
          <p className="whitespace-pre-wrap font-sans text-base leading-relaxed text-on-surface-variant">
            {reunion.description}
          </p>
        </div>
      )}

      {/* Compte-rendu (visible par tous si publié) */}
      {reunion.compte_rendu && (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 shadow-card sm:p-6">
          <div className="mb-3 flex items-center gap-2">
            <NotebookPen className="h-5 w-5 text-primary" />
            <h2 className="font-heading text-lg font-semibold text-on-surface">Compte-rendu</h2>
          </div>
          <p className="whitespace-pre-wrap font-sans text-base leading-relaxed text-on-surface-variant">
            {reunion.compte_rendu}
          </p>
        </div>
      )}

      {/* Vue admin */}
      {isAdmin && (
        <ReunionDetailAdmin
          groupId={groupId}
          reunionId={reunionId}
          membres={membresActifs.map((m) => ({
            id_membre_groupe: m.id_membre_groupe,
            name: `${m.user.prenom} ${m.user.nom}`,
            email: m.user.email,
          }))}
          presencesInitiales={reunion.presences.map((p) => ({
            id_presence: p.id_presence,
            id_membre_groupe: p.id_membre_groupe,
            statut_presence: p.statut_presence,
            amende_payee: p.amende_payee,
            note_absence: p.note_absence,
          }))}
          montantAmende={montantAmende}
          devise={devise}
          statut={reunion.statut}
          compteRenduInitial={reunion.compte_rendu}
          dateReunion={reunion.date_reunion.toISOString()}
        />
      )}

      {/* Vue membre */}
      {!isAdmin && (
        <ReunionDetailMembre
          groupId={groupId}
          reunionId={reunionId}
          statut={reunion.statut}
          myPresence={myPresence ? {
            statut_presence: myPresence.statut_presence,
            amende_payee: myPresence.amende_payee,
            note_absence: myPresence.note_absence,
          } : null}
          montantAmende={montantAmende}
          devise={devise}
          dateReunion={reunion.date_reunion.toISOString()}
        />
      )}
    </div>
  );
}
