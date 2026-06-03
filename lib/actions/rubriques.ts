"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { createNotification } from "@/lib/notifications";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  computeStoredDateFin,
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
  dateLimite?: string;
}) {
  const dateDebut = new Date(input.dateDebut);
  if (Number.isNaN(dateDebut.getTime())) {
    return { ok: false as const, error: "Date de début invalide." };
  }

  const dateLimite = input.dateLimite ? new Date(input.dateLimite) : null;
  if (dateLimite && Number.isNaN(dateLimite.getTime())) {
    return { ok: false as const, error: "Date limite invalide." };
  }

  if (dateLimite && dateLimite < dateDebut) {
    return { ok: false as const, error: "La date limite doit être après la date de début." };
  }

  const frequence = resolveFrequenceForType(input.typeRubrique, input.frequence);
  const planning = {
    type_rubrique: input.typeRubrique,
    frequence,
    date_debut: dateDebut,
    date_limite: dateLimite,
  };

  return {
    ok: true as const,
    dateDebut,
    dateLimite,
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
  dateLimite?: string;
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
    dateLimite: formData.dateLimite,
  });

  if (!dates.ok) return dates;

  const rubrique = await prisma.rubriqueCotisation.create({
    data: {
      id_groupe: formData.groupId,
      nom: formData.nom.trim(),
      montant_fixe: formData.montantFixe,
      type_rubrique: formData.typeRubrique,
      frequence: dates.frequence,
      date_debut: dates.dateDebut,
      date_fin: dates.dateFin,
      date_limite: dates.dateLimite,
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
  return { ok: true, rubrique };
}

export async function updateRubrique(formData: {
  rubriqueId: string;
  groupId: string;
  nom: string;
  montantFixe: number;
  typeRubrique: TypeRubriqueCotisation;
  frequence: FrequenceRubrique;
  dateDebut: string;
  dateLimite?: string;
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
    dateLimite: formData.dateLimite,
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
      date_debut: dates.dateDebut,
      date_fin: dates.dateFin,
      date_limite: dates.dateLimite,
      est_obligatoire: formData.estObligatoire,
    },
  });

  revalidatePath(`/dashboard/groups/${formData.groupId}/rubriques`);
  return { ok: true, rubrique };
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
  return { ok: true };
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
  return { ok: true, paiement };
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
  return { ok: true, retrait };
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
  return { ok: true, versement };
}
