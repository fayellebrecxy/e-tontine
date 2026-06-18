import { redirect, notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getPretWithRelations } from "@/lib/pret";
import { PretDetailClient } from "@/components/pret/pret-detail-client";

export const dynamic = "force-dynamic";

export default async function PretDetailPage({
  params,
}: {
  params: Promise<{ groupId: string; pretId: string }>;
}) {
  const { groupId, pretId } = await params;

  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/auth/login");

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const membership = await prisma.membreGroupe.findFirst({
    where: { id_user: user.id, id_groupe: groupId, statut_adhesion: "ACTIF" },
    select: { id_membre_groupe: true, role: true, groupe: { select: { devise: true } }, user: { select: { telephone: true } } },
  });
  if (!membership) redirect(`/dashboard/groups/${groupId}`);

  const pret = await getPretWithRelations(pretId, groupId);
  if (!pret) notFound();

  const members = await prisma.membreGroupe.findMany({
    where: { id_groupe: groupId, statut_adhesion: "ACTIF" },
    include: { user: { select: { nom: true, prenom: true } } },
    orderBy: { user: { prenom: "asc" } },
  });

  const serialized = {
    id_pret: pret.id_pret,
    statut: pret.statut,
    montant_demande: Number(pret.montant_demande),
    montant_approuve: pret.montant_approuve ? Number(pret.montant_approuve) : null,
    duree_valeur_demandee: pret.duree_valeur_demandee,
    duree_unite_demandee: pret.duree_unite_demandee,
    duree_valeur_approuvee: pret.duree_valeur_approuvee,
    duree_unite_approuvee: pret.duree_unite_approuvee,
    taux_interet_mensuel: pret.taux_interet_mensuel ? Number(pret.taux_interet_mensuel) : null,
    montant_capital_restant: Number(pret.montant_capital_restant),
    montant_interets_restant: Number(pret.montant_interets_restant),
    montant_interets_total: Number(pret.montant_interets_total),
    montant_garantie_emprunteur: Number(pret.montant_garantie_emprunteur),
    motif: pret.motif,
    motif_refus: pret.motif_refus,
    notes_admin: pret.notes_admin,
    date_demande: pret.date_demande.toISOString(),
    date_approbation: pret.date_approbation?.toISOString() ?? null,
    date_decaissement: pret.date_decaissement?.toISOString() ?? null,
    date_fin: pret.date_fin?.toISOString() ?? null,
    emprunteur: {
      id_membre_groupe: pret.emprunteur.id_membre_groupe,
      user: pret.emprunteur.user,
    },
    avalistes: pret.avalistes.map((a) => ({
      id_avaliste_pret: a.id_avaliste_pret,
      statut: a.statut,
      montant_engagement: Number(a.montant_engagement),
      contrat_texte: a.contrat_texte,
      motif_refus: a.motif_refus,
      date_reponse: a.date_reponse?.toISOString() ?? null,
      date_contrat: a.date_contrat?.toISOString() ?? null,
      date_confirmation_admin: a.date_confirmation_admin?.toISOString() ?? null,
      signature_nom: a.signature_nom,
      acceptation_saisie: a.acceptation_saisie,
      membre: {
        id_membre_groupe: a.membre.id_membre_groupe,
        user: a.membre.user,
      },
    })),
    mouvements: pret.mouvements.map((m) => ({
      id_mouvement: m.id_mouvement,
      type_mouvement: m.type_mouvement,
      montant: Number(m.montant),
      details: m.details,
      date_operation: m.date_operation.toISOString(),
      operateur: m.operateur,
    })),
  };

  return (
    <PretDetailClient
      groupId={groupId}
      devise={membership.groupe.devise}
      isAdmin={membership.role === "ADMIN"}
      currentMemberId={membership.id_membre_groupe}
      currentMemberTelephone={membership.user.telephone}
      pret={serialized}
      members={members.map((m) => ({
        id_membre_groupe: m.id_membre_groupe,
        label: `${m.user.prenom} ${m.user.nom}`,
      }))}
    />
  );
}
