"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { createNotification } from "@/lib/notifications";

export async function createRubrique(formData: {
  groupId: string;
  nom: string;
  typeMontant: "FIXE" | "VARIABLE";
  montantFixe?: number;
  duree?: string;
  dateLimite?: string;
  estObligatoire: boolean;
  membresIds: string[];
}) {
  const rubrique = await prisma.rubriqueCotisation.create({
    data: {
      id_groupe: formData.groupId,
      nom: formData.nom,
      type_montant: formData.typeMontant,
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
