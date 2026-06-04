"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { createNotification } from "@/lib/notifications";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  computeStoredDateFin,
  getDefaultDureeJours,
  resolveFrequenceForType,
  type FrequenceRubrique,
  type TypeRubriqueCotisation,
} from "@/lib/rubrique-dates";

async function requireGroupAdmin(groupId: string) {
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

  const membership = await prisma.membreGroupe.findUnique({
    where: {
      id_user_id_groupe: {
        id_user: user.id,
        id_groupe: groupId,
      },
    },
    select: { role: true, statut_adhesion: true },
  });

  if (!membership || membership.statut_adhesion !== "ACTIF" || membership.role !== "ADMIN") {
    return { ok: false as const, error: "Action réservée aux administrateurs." };
  }

  return { ok: true as const };
}

function buildRubriqueDates(input: {
  typeRubrique: TypeRubriqueCotisation;
  frequence: FrequenceRubrique;
  dateDebut: string;
  dureeJours?: number;
}) {
  const dateDebut = new Date(input.dateDebut);
  if (Number.isNaN(dateDebut.getTime())) {
    return { ok: false as const, error: "Date de début invalide." };
  }

  const frequence = resolveFrequenceForType(input.typeRubrique, input.frequence);
  const dureeJours = input.dureeJours ?? getDefaultDureeJours(frequence);

  if (!Number.isInteger(dureeJours) || dureeJours <= 0) {
    return { ok: false as const, error: "La durée doit être un nombre de jours positif." };
  }

  const planning = {
    type_rubrique: input.typeRubrique,
    frequence,
    date_debut: dateDebut,
    duree_jours: dureeJours,
  };

  return {
    ok: true as const,
    dateDebut,
    dureeJours,
    frequence,
    dateFin: computeStoredDateFin(planning),
  };
}

export async function createRubrique(formData: {
  groupId: string;
  nom: string;
  montantFixe: number;
  typeRubrique: TypeRubriqueCotisation;
  frequence: FrequenceRubrique;
  dateDebut: string;
  dureeJours: number;
  estObligatoire: boolean;
  membresIds: string[];
}) {
  const auth = await requireGroupAdmin(formData.groupId);
  if (!auth.ok) return auth;

  if (!formData.nom.trim()) {
    return { ok: false as const, error: "Le nom de la rubrique est requis." };
  }

  if (!Number.isFinite(formData.montantFixe) || formData.montantFixe <= 0) {
    return { ok: false as const, error: "Le montant doit être supérieur à 0." };
  }

  if (formData.membresIds.length === 0) {
    return { ok: false as const, error: "Sélectionnez au moins un membre." };
  }

  const dates = buildRubriqueDates({
    typeRubrique: formData.typeRubrique,
    frequence: formData.frequence,
    dateDebut: formData.dateDebut,
    dureeJours: formData.dureeJours,
  });

  if (!dates.ok) return dates;

  const rubrique = await prisma.rubriqueCotisation.create({
    data: {
      id_groupe: formData.groupId,
      nom: formData.nom.trim(),
      montant_fixe: formData.montantFixe,
      type_rubrique: formData.typeRubrique,
      frequence: dates.frequence,
      duree_jours: dates.dureeJours,
      duree: `${dates.dureeJours} jour${dates.dureeJours > 1 ? "s" : ""}`,
      date_debut: dates.dateDebut,
      date_fin: dates.dateFin,
      date_limite: null,
      est_obligatoire: formData.estObligatoire,
      membres_concernes: {
        create: formData.membresIds.map((id) => ({
          id_membre_groupe: id,
        })),
      },
    },
    include: {
      membres_concernes: {
        include: {
          membre: true,
        },
      },
    },
  });

  await Promise.all(
    rubrique.membres_concernes.map((mc) =>
      createNotification({
        userId: mc.membre.id_user,
        groupId: formData.groupId,
        message: `Nouvelle rubrique de cotisation : ${formData.nom}`,
        type: "NOUVELLE_RUBRIQUE",
      }),
    ),
  );

  revalidatePath(`/dashboard/groups/${formData.groupId}/rubriques`);
  return { ok: true as const, rubrique };
}

export async function updateRubrique(formData: {
  rubriqueId: string;
  groupId: string;
  nom: string;
  montantFixe: number;
  typeRubrique: TypeRubriqueCotisation;
  frequence: FrequenceRubrique;
  dateDebut: string;
  dureeJours: number;
  estObligatoire: boolean;
}) {
  const auth = await requireGroupAdmin(formData.groupId);
  if (!auth.ok) return auth;

  if (!formData.nom.trim()) {
    return { ok: false as const, error: "Le nom de la rubrique est requis." };
  }

  if (!Number.isFinite(formData.montantFixe) || formData.montantFixe <= 0) {
    return { ok: false as const, error: "Le montant doit être supérieur à 0." };
  }

  const dates = buildRubriqueDates({
    typeRubrique: formData.typeRubrique,
    frequence: formData.frequence,
    dateDebut: formData.dateDebut,
    dureeJours: formData.dureeJours,
  });

  if (!dates.ok) return dates;

  const existing = await prisma.rubriqueCotisation.findFirst({
    where: { id_rubrique: formData.rubriqueId, id_groupe: formData.groupId },
    select: { id_rubrique: true },
  });

  if (!existing) {
    return { ok: false as const, error: "Rubrique introuvable." };
  }

  const rubrique = await prisma.rubriqueCotisation.update({
    where: { id_rubrique: formData.rubriqueId },
    data: {
      nom: formData.nom.trim(),
      montant_fixe: formData.montantFixe,
      type_rubrique: formData.typeRubrique,
      frequence: dates.frequence,
      duree_jours: dates.dureeJours,
      duree: `${dates.dureeJours} jour${dates.dureeJours > 1 ? "s" : ""}`,
      date_debut: dates.dateDebut,
      date_fin: dates.dateFin,
      date_limite: null,
      est_obligatoire: formData.estObligatoire,
    },
  });

  revalidatePath(`/dashboard/groups/${formData.groupId}/rubriques`);
  return { ok: true as const, rubrique };
}

export async function relaunchRubrique(rubriqueId: string, groupId: string) {
  const auth = await requireGroupAdmin(groupId);
  if (!auth.ok) return auth;

  const existing = await prisma.rubriqueCotisation.findFirst({
    where: { id_rubrique: rubriqueId, id_groupe: groupId },
    include: {
      membres_concernes: {
        select: {
          id_membre_groupe: true,
          membre: { select: { id_user: true } },
        },
      },
    },
  });

  if (!existing) {
    return { ok: false as const, error: "Rubrique introuvable." };
  }

  if (!existing.date_fin || existing.date_fin >= new Date()) {
    return {
      ok: false as const,
      error: "Cette rubrique ne peut être relancée qu'après sa date de fin.",
    };
  }

  if (existing.membres_concernes.length === 0) {
    return { ok: false as const, error: "Aucun membre n'est associé à cette rubrique." };
  }

  const dateDebut = new Date();
  const dureeJours = existing.duree_jours || getDefaultDureeJours(existing.frequence);
  const dateFin = computeStoredDateFin({
    type_rubrique: existing.type_rubrique,
    frequence: existing.frequence,
    date_debut: dateDebut,
    duree_jours: dureeJours,
  });

  const rubrique = await prisma.rubriqueCotisation.create({
    data: {
      id_groupe: groupId,
      nom: `${existing.nom} - relance`,
      montant_fixe: existing.montant_fixe,
      type_rubrique: existing.type_rubrique,
      frequence: existing.frequence,
      duree_jours: dureeJours,
      duree: `${dureeJours} jour${dureeJours > 1 ? "s" : ""}`,
      date_debut: dateDebut,
      date_fin: dateFin,
      date_limite: null,
      est_obligatoire: existing.est_obligatoire,
      membres_concernes: {
        create: existing.membres_concernes.map((mc) => ({
          id_membre_groupe: mc.id_membre_groupe,
        })),
      },
    },
  });

  await Promise.all(
    existing.membres_concernes.map((mc) =>
      createNotification({
        userId: mc.membre.id_user,
        groupId,
        message: `Rubrique relancée : ${existing.nom}`,
        type: "NOUVELLE_RUBRIQUE",
      }),
    ),
  );

  revalidatePath(`/dashboard/groups/${groupId}/rubriques`);
  return { ok: true as const, rubrique };
}

export async function deleteRubrique(rubriqueId: string, groupId: string) {
  const auth = await requireGroupAdmin(groupId);
  if (!auth.ok) {
    return auth;
  }

  await prisma.rubriqueCotisation.delete({
    where: { id_rubrique: rubriqueId },
  });

  revalidatePath(`/dashboard/groups/${groupId}/rubriques`);
  return { ok: true as const };
}

export async function enregistrerPaiement(data: {
  rubriqueId: string;
  membreId: string;
  montant: number;
  note?: string;
  groupId: string;
}) {
  const auth = await requireGroupAdmin(data.groupId);
  if (!auth.ok) {
    return auth;
  }

  if (!Number.isFinite(data.montant) || data.montant <= 0) {
    return { ok: false as const, error: "Le montant doit être supérieur à 0." };
  }

  const rubrique = await prisma.rubriqueCotisation.findUnique({
    where: { id_rubrique: data.rubriqueId },
    select: {
      montant_fixe: true,
      nom: true,
      membres_concernes: {
        where: { id_membre_groupe: data.membreId },
        select: { id_membre_rubrique: true },
      },
      paiements: {
        where: { id_membre_groupe: data.membreId },
        select: { montant_paye: true },
      },
    },
  });

  if (!rubrique) {
    return { ok: false as const, error: "Rubrique introuvable." };
  }

  if (rubrique.membres_concernes.length === 0) {
    return { ok: false as const, error: "Ce membre n'est pas concerné par cette rubrique." };
  }

  const due = Number(rubrique.montant_fixe);
  const alreadyPaid = rubrique.paiements.reduce(
    (acc, p) => acc + Number(p.montant_paye),
    0,
  );
  const remaining = Math.round((due - alreadyPaid) * 100) / 100;

  if (remaining <= 0) {
    return {
      ok: false as const,
      error: "Ce membre a déjà soldé sa cotisation pour cette rubrique.",
    };
  }

  if (Math.round(data.montant * 100) / 100 > remaining) {
    return {
      ok: false as const,
      error: `Le montant ne peut pas dépasser le reste à payer (${remaining.toLocaleString("fr-FR")} XAF).`,
    };
  }

  const paiement = await prisma.paiementRubrique.create({
    data: {
      id_rubrique: data.rubriqueId,
      id_membre_groupe: data.membreId,
      montant_paye: data.montant,
      note: data.note,
    },
    include: {
      membre: true,
      rubrique: true,
    },
  });

  await createNotification({
    userId: paiement.membre.id_user,
    groupId: data.groupId,
    message: `Votre paiement de ${data.montant} XAF pour la rubrique ${paiement.rubrique.nom} a été enregistré.`,
    type: "PAIEMENT_RECU",
  });

  revalidatePath(`/dashboard/groups/${data.groupId}/rubriques`);
  return { ok: true as const, paiement };
}

export async function enregistrerRetrait(data: {
  groupId: string;
  adminId: string;
  montant: number;
  motif: string;
  rubriqueId?: string;
}) {
  const auth = await requireGroupAdmin(data.groupId);
  if (!auth.ok) {
    return auth;
  }

  const retrait = await prisma.retrait.create({
    data: {
      id_groupe: data.groupId,
      id_admin_valideur: data.adminId,
      montant: data.montant,
      motif: data.motif,
      id_rubrique: data.rubriqueId,
    },
  });

  revalidatePath(`/dashboard/groups/${data.groupId}/rubriques`);
  return { ok: true as const, retrait };
}

export async function enregistrerVersementPot(data: {
  cycleId: string;
  beneficiaireId: string;
  adminId: string;
  montant: number;
  tour: number;
  mode?: "VIREMENT" | "ESPECES" | "MOBILE_MONEY" | "CHEQUE";
  reference?: string;
  groupId: string;
}) {
  const auth = await requireGroupAdmin(data.groupId);
  if (!auth.ok) {
    return auth;
  }

  const versement = await prisma.versement.create({
    data: {
      id_cycle: data.cycleId,
      id_beneficiaire: data.beneficiaireId,
      id_admin_valideur: data.adminId,
      montant_verse: data.montant,
      numero_tour: data.tour,
      mode_versement: data.mode,
      reference_externe: data.reference,
    },
  });

  revalidatePath(`/dashboard/groups/${data.groupId}/cycles/${data.cycleId}`);
  return { ok: true as const, versement };
}
