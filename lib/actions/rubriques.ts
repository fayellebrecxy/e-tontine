"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { createNotification } from "@/lib/notifications";

export async function createRubrique(formData: {
  groupId: string;
  nom: string;
  montantFixe: number;
  duree?: string;
  dateLimite?: string;
  estObligatoire: boolean;
  membresIds: string[];
}) {
  const rubrique = await prisma.rubriqueCotisation.create({
    data: {
      id_groupe: formData.groupId,
      nom: formData.nom,
      montant_fixe: formData.montantFixe,
      duree: formData.duree,
      date_limite: formData.dateLimite ? new Date(formData.dateLimite) : undefined,
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

  // Notifier les membres concernés
  await Promise.all(
    rubrique.membres_concernes.map((mc) =>
      createNotification({
        userId: mc.membre.id_user,
        groupId: formData.groupId,
        message: `Nouvelle rubrique de cotisation : ${formData.nom}`,
        type: "NOUVELLE_RUBRIQUE",
      })
    )
  );

  revalidatePath(`/dashboard/groups/${formData.groupId}/rubriques`);
  return { ok: true, rubrique };
}

export async function deleteRubrique(rubriqueId: string, groupId: string) {
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
    0
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

  // Notifier le membre
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

  revalidatePath(`/dashboard/groups/${data.groupId}/rubriques`);
  revalidatePath(`/dashboard/groups/${data.groupId}/cycles/${data.cycleId}`);
  return { ok: true, versement };
}
