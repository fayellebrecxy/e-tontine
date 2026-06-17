import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getBanqueSummary } from "@/lib/pret-banque";
import { checkPretEligibility, ensureParametresPret } from "@/lib/pret-eligibility";
import { PretsDashboard } from "@/components/pret/prets-dashboard";

export const dynamic = "force-dynamic";

export default async function PretsPage({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params;

  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/auth/login");

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const membership = await prisma.membreGroupe.findFirst({
    where: { id_user: user.id, id_groupe: groupId, statut_adhesion: "ACTIF" },
    select: { id_membre_groupe: true, role: true, groupe: { select: { devise: true } } },
  });
  if (!membership) redirect(`/dashboard/groups/${groupId}`);

  const [prets, bank, garanties, eligibility, membersRaw, parametres] = await Promise.all([
    prisma.pret.findMany({
      where: { id_groupe: groupId },
      orderBy: { date_demande: "desc" },
      include: {
        emprunteur: { include: { user: { select: { nom: true, prenom: true } } } },
        avalistes: {
          include: { membre: { include: { user: { select: { nom: true, prenom: true } } } } },
        },
      },
    }),
    getBanqueSummary(groupId),
    prisma.avalistePret.findMany({
      where: {
        id_membre_groupe: membership.id_membre_groupe,
        pret: { id_groupe: groupId },
      },
      include: {
        pret: {
          include: { emprunteur: { include: { user: { select: { nom: true, prenom: true } } } } },
        },
      },
      orderBy: { date_proposition: "desc" },
    }),
    checkPretEligibility(groupId, membership.id_membre_groupe),
    prisma.membreGroupe.findMany({
      where: { id_groupe: groupId, statut_adhesion: "ACTIF" },
      include: { user: { select: { nom: true, prenom: true } } },
      orderBy: { user: { prenom: "asc" } },
    }),
    ensureParametresPret(groupId),
  ]);

  const members = membersRaw.map((m) => ({
    id_membre_groupe: m.id_membre_groupe,
    label: `${m.user.prenom} ${m.user.nom}`,
  }));

  const serializePret = (p: (typeof prets)[0]) => ({
    ...p,
    montant_demande: Number(p.montant_demande),
    montant_approuve: p.montant_approuve ? Number(p.montant_approuve) : null,
    montant_capital_restant: Number(p.montant_capital_restant),
    montant_interets_restant: Number(p.montant_interets_restant),
    date_demande: p.date_demande.toISOString(),
    date_fin: p.date_fin?.toISOString() ?? null,
    emprunteur: {
      id_membre_groupe: p.id_emprunteur,
      user: p.emprunteur.user,
    },
    avalistes: p.avalistes.map((a) => ({
      ...a,
      montant_engagement: Number(a.montant_engagement),
    })),
  });

  return (
    <PretsDashboard
      groupId={groupId}
      devise={membership.groupe.devise}
      isAdmin={membership.role === "ADMIN"}
      memberId={membership.id_membre_groupe}
      initialBank={bank}
      initialPrets={prets.map(serializePret)}
      initialGaranties={garanties.map((g) => ({
        ...g,
        montant_engagement: Number(g.montant_engagement),
        pret: serializePret(g.pret as (typeof prets)[0]),
      }))}
      initialEligibility={eligibility}
      initialParametres={{
        anciennete_min_jours: parametres.anciennete_min_jours,
        plafond_pct_banque: Number(parametres.plafond_pct_banque),
      }}
      members={members}
    />
  );
}
