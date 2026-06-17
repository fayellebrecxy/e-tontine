import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ensureParametresPret } from "@/lib/pret-eligibility";
import { PretParametresForm } from "@/components/pret/pret-parametres-form";

export const dynamic = "force-dynamic";

export default async function PretParametresPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;

  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/auth/login");

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const membership = await prisma.membreGroupe.findFirst({
    where: { id_user: user.id, id_groupe: groupId, statut_adhesion: "ACTIF", role: "ADMIN" },
  });
  if (!membership) redirect(`/dashboard/groups/${groupId}/prets`);

  const parametres = await ensureParametresPret(groupId);

  return (
    <PretParametresForm
      groupId={groupId}
      initial={{
        anciennete_min_jours: parametres.anciennete_min_jours,
        plafond_pct_banque: Number(parametres.plafond_pct_banque),
        modele_contrat_avaliste: parametres.modele_contrat_avaliste,
        refus_sans_epargne: parametres.refus_sans_epargne,
      }}
    />
  );
}
