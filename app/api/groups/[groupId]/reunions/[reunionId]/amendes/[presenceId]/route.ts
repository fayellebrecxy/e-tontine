import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createNotification } from "@/lib/notifications";
import { majStatutMembre } from "@/lib/membre-statut";
import { caisseAmendesReunion, recordMouvementFinancier } from "@/lib/financial-journal";

// Admin marque une amende comme payée
export async function PATCH(
  _request: NextRequest,
  ctx: { params: Promise<{ groupId: string; reunionId: string; presenceId: string }> },
) {
  const { groupId, reunionId, presenceId } = await ctx.params;

  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ ok: false, error: "Missing env." }, { status: 500 });

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });

  const membership = await prisma.membreGroupe.findFirst({
    where: { id_user: data.user.id, id_groupe: groupId, role: "ADMIN", statut_adhesion: "ACTIF" },
    select: { id_membre_groupe: true },
  });
  if (!membership) return NextResponse.json({ ok: false, error: "Admin only." }, { status: 403 });

  const presence = await prisma.presenceReunion.findFirst({
    where: {
      id_presence: presenceId,
      reunion: { id_groupe: groupId, id_reunion: reunionId },
    },
    select: {
      id_presence: true,
      amende_payee: true,
      id_membre_groupe: true,
      reunion: {
        select: {
          titre: true,
          date_reunion: true,
          montant_amende: true,
          id_groupe: true,
        },
      },
      membre_groupe: { select: { id_user: true } },
    },
  });
  if (!presence) return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });
  if (presence.amende_payee) return NextResponse.json({ ok: false, error: "Déjà marquée payée." }, { status: 409 });

  const montantAmende = Number(presence.reunion.montant_amende ?? 0);

  await prisma.$transaction(async (tx) => {
    const updated = await tx.presenceReunion.update({
      where: { id_presence: presenceId },
      data: { amende_payee: true },
    });

    await recordMouvementFinancier(tx, {
      groupId,
      caisse: caisseAmendesReunion(),
      type: "ENTREE",
      source: "AMENDE_REUNION",
      montant: montantAmende,
      motif: `Amende payée - ${presence.reunion.titre}`,
      adminId: membership.id_membre_groupe,
      membreId: presence.id_membre_groupe,
      referenceType: "presences_reunion",
      referenceId: updated.id_presence,
      dateMouvement: new Date(),
    });
  });

  // Notifier le membre
  const montant = presence.reunion.montant_amende
    ? Number(presence.reunion.montant_amende).toLocaleString("fr-FR")
    : "—";
  const dateStr = presence.reunion.date_reunion.toLocaleDateString("fr-FR", {
    day: "2-digit", month: "long", year: "numeric",
  });

  await createNotification({
    userId: presence.membre_groupe.id_user,
    groupId: presence.reunion.id_groupe,
    type: "AMENDE_PAYEE",
    message: `✅ Ton amende de ${montant} pour la réunion "${presence.reunion.titre}" du ${dateStr} a été enregistrée comme payée.`,
  });

  // Recalcul statut visuel du membre
  majStatutMembre(presence.id_membre_groupe).catch(() => null);

  return NextResponse.json({ ok: true }, { status: 200 });
}
