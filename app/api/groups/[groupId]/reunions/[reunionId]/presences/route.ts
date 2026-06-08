import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createNotification } from "@/lib/notifications";
import { majStatutMembre } from "@/lib/membre-statut";

const presenceEntrySchema = z.object({
  id_membre_groupe: z.string().uuid(),
  statut_presence: z.enum(["PRESENT", "ABSENT", "EXCUSE", "EN_RETARD"]),
  note_absence: z.string().max(300).optional().nullable(),
});

const recordPresencesSchema = z.object({
  presences: z.array(presenceEntrySchema).min(1),
});

// Admin enregistre toutes les présences d'une réunion
export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ groupId: string; reunionId: string }> },
) {
  const { groupId, reunionId } = await ctx.params;

  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ ok: false, error: "Missing env." }, { status: 500 });

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });

  const membership = await prisma.membreGroupe.findFirst({
    where: { id_user: data.user.id, id_groupe: groupId, role: "ADMIN", statut_adhesion: "ACTIF" },
    select: { id_membre_groupe: true },
  });
  if (!membership) return NextResponse.json({ ok: false, error: "Admin only." }, { status: 403 });

  const reunion = await prisma.reunion.findFirst({
    where: { id_reunion: reunionId, id_groupe: groupId },
    select: {
      id_reunion: true,
      titre: true,
      date_reunion: true,
      statut: true,
      montant_amende: true,
    },
  });
  if (!reunion) return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });
  if (reunion.statut === "ANNULEE") {
    return NextResponse.json({ ok: false, error: "Cette réunion est annulée." }, { status: 409 });
  }
  if (reunion.statut === "TERMINEE") {
    return NextResponse.json(
      { ok: false, error: "Les présences de cette réunion sont déjà clôturées." },
      { status: 409 },
    );
  }
  if (reunion.date_reunion.getTime() > Date.now()) {
    return NextResponse.json(
      { ok: false, error: "Impossible d'enregistrer les présences avant que la réunion ait eu lieu." },
      { status: 409 },
    );
  }

  const body = recordPresencesSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ ok: false, error: "Invalid input." }, { status: 400 });

  const activeMembers = await prisma.membreGroupe.findMany({
    where: { id_groupe: groupId, statut_adhesion: "ACTIF" },
    select: { id_membre_groupe: true },
  });
  const activeMemberIds = new Set(activeMembers.map((member) => member.id_membre_groupe));
  const submittedMemberIds = body.data.presences.map((presence) => presence.id_membre_groupe);
  const uniqueSubmittedMemberIds = new Set(submittedMemberIds);

  if (uniqueSubmittedMemberIds.size !== submittedMemberIds.length) {
    return NextResponse.json(
      { ok: false, error: "Un membre est présent plusieurs fois dans la liste." },
      { status: 400 },
    );
  }

  const unknownMemberId = submittedMemberIds.find((memberId) => !activeMemberIds.has(memberId));
  if (unknownMemberId) {
    return NextResponse.json(
      { ok: false, error: "La liste contient un membre qui n'appartient pas au groupe actif." },
      { status: 403 },
    );
  }

  if (uniqueSubmittedMemberIds.size !== activeMemberIds.size) {
    return NextResponse.json(
      { ok: false, error: "Tous les membres actifs doivent avoir un statut de présence." },
      { status: 400 },
    );
  }

  const existingPresences = await prisma.presenceReunion.findMany({
    where: { id_reunion: reunionId },
    select: {
      id_membre_groupe: true,
      statut_presence: true,
      amende_payee: true,
    },
  });
  const existingByMember = new Map(
    existingPresences.map((presence) => [presence.id_membre_groupe, presence]),
  );
  const paidFineBeingRemoved = body.data.presences.some((entry) => {
    const existing = existingByMember.get(entry.id_membre_groupe);
    return !!existing?.amende_payee
      && (entry.statut_presence === "PRESENT" || entry.statut_presence === "EXCUSE");
  });
  if (paidFineBeingRemoved) {
    return NextResponse.json(
      { ok: false, error: "Une présence avec amende déjà payée ne peut pas être changée en présent ou excusé." },
      { status: 409 },
    );
  }

  const montantAmende = reunion.montant_amende ? Number(reunion.montant_amende) : 0;
  const dateStr = reunion.date_reunion.toLocaleDateString("fr-FR", {
    day: "2-digit", month: "long", year: "numeric",
  });

  await prisma.$transaction(async (tx) => {
    for (const entry of body.data.presences) {
      await tx.presenceReunion.upsert({
        where: {
          id_reunion_id_membre_groupe: {
            id_reunion: reunionId,
            id_membre_groupe: entry.id_membre_groupe,
          },
        },
        update: {
          statut_presence: entry.statut_presence,
          note_absence: entry.note_absence ?? null,
          date_enregistrement: new Date(),
        },
        create: {
          id_reunion: reunionId,
          id_membre_groupe: entry.id_membre_groupe,
          statut_presence: entry.statut_presence,
          note_absence: entry.note_absence ?? null,
          amende_payee: false,
        },
      });
    }

    // Marquer la réunion comme terminée
    await tx.reunion.update({
      where: { id_reunion: reunionId },
      data: { statut: "TERMINEE" },
    });
  });

  // Envoyer notifications personnalisées à chaque membre
  await Promise.all(
    body.data.presences.map(async (entry) => {
      const membre = await prisma.membreGroupe.findUnique({
        where: { id_membre_groupe: entry.id_membre_groupe },
        select: { id_user: true },
      });
      if (!membre) return;

      let message = "";
      if (entry.statut_presence === "PRESENT") {
        message = `✅ Ta présence à la réunion "${reunion.titre}" du ${dateStr} a été enregistrée.`;
      } else if (entry.statut_presence === "EXCUSE") {
        message = `🟡 Tu as été marqué(e) excusé(e) pour la réunion "${reunion.titre}" du ${dateStr}.`;
      } else if (entry.statut_presence === "EN_RETARD") {
        message = `⏰ Tu as été marqué(e) en retard pour la réunion "${reunion.titre}" du ${dateStr}.${montantAmende > 0 ? ` Une amende de ${montantAmende.toLocaleString("fr-FR")} a été appliquée.` : ""}`;
      } else {
        // ABSENT
        message = montantAmende > 0
          ? `❌ Tu as été marqué(e) absent(e) à la réunion "${reunion.titre}" du ${dateStr}. Une amende de ${montantAmende.toLocaleString("fr-FR")} t'a été appliquée.`
          : `❌ Tu as été marqué(e) absent(e) à la réunion "${reunion.titre}" du ${dateStr}.`;
      }

      await createNotification({
        userId: membre.id_user,
        groupId,
        type: "REUNION_PRESENCE",
        message,
      });

      // Recalcul statut visuel (amendes potentiellement appliquées)
      majStatutMembre(entry.id_membre_groupe).catch(() => null);
    }),
  );

  return NextResponse.json({ ok: true }, { status: 200 });
}

// Membre signale son absence à l'avance
export async function PATCH(
  request: NextRequest,
  ctx: { params: Promise<{ groupId: string; reunionId: string }> },
) {
  const { groupId, reunionId } = await ctx.params;

  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ ok: false, error: "Missing env." }, { status: 500 });

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });

  const membership = await prisma.membreGroupe.findFirst({
    where: { id_user: data.user.id, id_groupe: groupId, statut_adhesion: "ACTIF" },
    select: { id_membre_groupe: true },
  });
  if (!membership) return NextResponse.json({ ok: false, error: "Forbidden." }, { status: 403 });

  const reunion = await prisma.reunion.findFirst({
    where: { id_reunion: reunionId, id_groupe: groupId },
    select: { id_reunion: true, titre: true, date_reunion: true, statut: true, id_groupe: true },
  });
  if (!reunion) return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });

  if (reunion.statut !== "PLANIFIEE") {
    return NextResponse.json(
      { ok: false, error: "Vous ne pouvez signaler votre absence qu'avant la réunion." },
      { status: 409 },
    );
  }
  if (reunion.date_reunion.getTime() <= Date.now()) {
    return NextResponse.json(
      { ok: false, error: "La réunion a déjà commencé ou est passée." },
      { status: 409 },
    );
  }

  const body = z
    .object({ note_absence: z.string().min(5).max(300) })
    .safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ ok: false, error: "Invalid input." }, { status: 400 });

  await prisma.presenceReunion.upsert({
    where: {
      id_reunion_id_membre_groupe: {
        id_reunion: reunionId,
        id_membre_groupe: membership.id_membre_groupe,
      },
    },
    update: {
      statut_presence: "DEMANDE_EXCUSE",
      note_absence: body.data.note_absence,
    },
    create: {
      id_reunion: reunionId,
      id_membre_groupe: membership.id_membre_groupe,
      statut_presence: "DEMANDE_EXCUSE",
      note_absence: body.data.note_absence,
      amende_payee: false,
    },
  });

  // Notifier les admins
  const admins = await prisma.membreGroupe.findMany({
    where: { id_groupe: groupId, role: "ADMIN", statut_adhesion: "ACTIF" },
    select: { id_user: true },
  });
  const currentUser = await prisma.user.findUnique({
    where: { id_user: data.user.id },
    select: { nom: true, prenom: true },
  });
  const dateStr = reunion.date_reunion.toLocaleDateString("fr-FR", {
    day: "2-digit", month: "long", year: "numeric",
  });

  await Promise.all(
    admins.map((a) =>
      createNotification({
        userId: a.id_user,
        groupId,
        type: "REUNION_EXCUSE",
        message: `🟡 ${currentUser?.prenom} ${currentUser?.nom} a signalé son absence pour la réunion "${reunion.titre}" du ${dateStr} : "${body.data.note_absence}"`,
      }),
    ),
  );

  return NextResponse.json({ ok: true }, { status: 200 });
}
