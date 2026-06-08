import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Calendar, MapPin } from "lucide-react";

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
      <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex flex-wrap gap-2 mb-2">
              <Badge variant="secondary" className={typeInfo.className + " text-xs"}>
                {typeInfo.label}
              </Badge>
              <Badge variant="secondary" className={statutInfo.className + " text-xs"}>
                {statutInfo.label}
              </Badge>
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">{reunion.titre}</h1>
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

        <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            {reunion.date_reunion.toLocaleDateString("fr-FR", {
              weekday: "long", day: "2-digit", month: "long", year: "numeric",
            })}{" "}
            à{" "}
            {reunion.date_reunion.toLocaleTimeString("fr-FR", {
              hour: "2-digit", minute: "2-digit",
            })}
          </span>
          {reunion.lieu && (
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4" />
              {reunion.lieu}
            </span>
          )}
        </div>

        {reunion.description && (
          <div className="rounded-lg bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-700 dark:text-gray-300">
            <p className="font-medium text-xs uppercase text-gray-400 mb-1">Ordre du jour</p>
            <p className="whitespace-pre-wrap">{reunion.description}</p>
          </div>
        )}

        {montantAmende > 0 && (
          <p className="text-sm text-amber-700">
            💰 Amende d'absence : <strong>{montantAmende.toLocaleString("fr-FR")} {devise}</strong>
          </p>
        )}
      </div>

      {/* Compte-rendu (visible par tous si publié) */}
      {reunion.compte_rendu && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 dark:bg-blue-900/10 p-4 space-y-2">
          <h2 className="font-semibold text-blue-800 dark:text-blue-300">📝 Compte-rendu</h2>
          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
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
