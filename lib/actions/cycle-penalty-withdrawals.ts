"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCycleTurnSnapshot } from "@/lib/cycle-turns";

export type PenaltyWithdrawalScope = "TOUR" | "CYCLE";

async function requireCycleAdmin(groupId: string) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { ok: false as const, error: "Non authentifié." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false as const, error: "Non authentifié." };
  }

  const membership = await prisma.membreGroupe.findFirst({
    where: { id_user: user.id, id_groupe: groupId, role: "ADMIN", statut_adhesion: "ACTIF" },
    select: { id_membre_groupe: true },
  });

  if (!membership) {
    return { ok: false as const, error: "Action réservée aux administrateurs." };
  }

  return { ok: true as const, adminId: membership.id_membre_groupe };
}

export async function enregistrerRetraitPenalite(data: {
  groupId: string;
  cycleId: string;
  scope: PenaltyWithdrawalScope;
  montant: number;
  motif: string;
}) {
  const auth = await requireCycleAdmin(data.groupId);
  if (!auth.ok) return auth;

  if (!Number.isFinite(data.montant) || data.montant <= 0) {
    return { ok: false as const, error: "Le montant doit être supérieur à 0." };
  }

  if (!data.motif.trim()) {
    return { ok: false as const, error: "Le motif du retrait est requis." };
  }

  const cycle = await prisma.cycleTontine.findFirst({
    where: { id_cycle: data.cycleId, id_groupe: data.groupId },
    select: { id_cycle: true },
  });

  if (!cycle) {
    return { ok: false as const, error: "Cycle introuvable." };
  }

  const snapshot = await getCycleTurnSnapshot(data.cycleId);
  const available =
    data.scope === "TOUR" ? snapshot.penaltyCashCurrentTurn : snapshot.penaltyCashCycle;

  if (data.scope === "TOUR" && !snapshot.activeTour) {
    return { ok: false as const, error: "Aucun tour actif disponible." };
  }

  if (data.montant > available) {
    return {
      ok: false as const,
      error: `Montant trop élevé. Caisse disponible : ${available.toLocaleString("fr-FR")}.`,
    };
  }

  const retrait = await prisma.retraitPenalite.create({
    data: {
      id_cycle: data.cycleId,
      id_admin_valideur: auth.adminId,
      montant: data.montant,
      motif: data.motif.trim(),
      numero_tour: data.scope === "TOUR" ? snapshot.activeTour : null,
    },
  });

  revalidatePath(`/dashboard/groups/${data.groupId}/cycles/${data.cycleId}`);
  return { ok: true as const, retrait };
}
