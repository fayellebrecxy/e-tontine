import type { Prisma, ModePenalite } from "@/lib/generated/prisma";

import { getTourWindow } from "@/lib/cycle-turns";
import type { PaymentAllocation } from "@/lib/cycle-member-debts";
import {
  caisseCycle,
  caissePenalitesCycle,
  recordMouvementFinancier,
} from "@/lib/financial-journal";

type JournalTx = Prisma.TransactionClient;

type PaymentProcessorInput = {
  groupId: string;
  cycle: {
    id_cycle: string;
    nom_cycle: string;
    date_debut: Date;
    duree_tour_de_gain: number;
    mode_penalite: ModePenalite | null;
    valeur_penalite: number | null;
  };
  versements: { numero_tour: number; date_versement: Date }[];
  memberId: string;
  adminId: string;
  datePaiement: Date;
  allocations: PaymentAllocation[];
};

export async function applyPaymentAllocations(
  tx: JournalTx,
  input: PaymentProcessorInput,
) {
  const valeurPenalite = input.cycle.valeur_penalite ?? 0;
  const tourWindowCtx = {
    date_debut: input.cycle.date_debut,
    duree_tour_de_gain: input.cycle.duree_tour_de_gain,
    versements: input.versements,
  };

  const createdIds: string[] = [];

  for (const allocation of input.allocations) {
    const { tourEnd } = getTourWindow(tourWindowCtx, allocation.numeroTour);

    if (allocation.type === "COTISATION") {
      const created = await tx.cotisations.create({
        data: {
          id_cycle: input.cycle.id_cycle,
          id_membre_groupe: input.memberId,
          date_debut: input.cycle.date_debut,
          date_de_paiement: input.datePaiement,
          numero_tour: allocation.numeroTour,
          date_echeance: tourEnd,
          montant: allocation.amount,
          penalite_appliquee: false,
          montant_penalite: null,
          penalite_collectee: false,
        },
        select: { id_cotisation: true },
      });

      createdIds.push(created.id_cotisation);

      await recordMouvementFinancier(tx, {
        groupId: input.groupId,
        caisse: caisseCycle(input.cycle.id_cycle, input.cycle.nom_cycle),
        type: "ENTREE",
        source: "COTISATION_CYCLE",
        montant: allocation.amount,
        motif: `Cotisation tour ${allocation.numeroTour} - ${input.cycle.nom_cycle}`,
        adminId: input.adminId,
        membreId: input.memberId,
        referenceType: "cotisations",
        referenceId: created.id_cotisation,
        dateMouvement: input.datePaiement,
      });
      continue;
    }

    if (allocation.pendingPenaltyCotisationId) {
      await tx.penalite.deleteMany({
        where: { id_cotisation: allocation.pendingPenaltyCotisationId },
      });
      await tx.cotisations.delete({
        where: { id_cotisation: allocation.pendingPenaltyCotisationId },
      });
    }

    const created = await tx.cotisations.create({
      data: {
        id_cycle: input.cycle.id_cycle,
        id_membre_groupe: input.memberId,
        date_debut: input.cycle.date_debut,
        date_de_paiement: input.datePaiement,
        numero_tour: allocation.numeroTour,
        date_echeance: tourEnd,
        montant: 0,
        penalite_appliquee: true,
        montant_penalite: allocation.amount,
        penalite_collectee: true,
      },
      select: { id_cotisation: true },
    });

    createdIds.push(created.id_cotisation);

    const joursRetard = Math.max(
      1,
      Math.ceil((input.datePaiement.getTime() - tourEnd.getTime()) / (24 * 60 * 60 * 1000)),
    );

    await tx.penalite.create({
      data: {
        id_cotisation: created.id_cotisation,
        id_membre_groupe: input.memberId,
        montant_base: valeurPenalite,
        motif: allocation.pendingPenaltyCotisationId
          ? "Pénalité collectée (enregistrée automatiquement)"
          : "Pénalité de retard collectée",
        taux_augmentation_heure: 0,
        seuil_heure_augmentation: 24,
        date_application: input.datePaiement,
        montant_final: allocation.amount,
        mode_penalite: input.cycle.mode_penalite,
        valeur_configuree: valeurPenalite,
        jours_retard: joursRetard,
        date_echeance: tourEnd,
      },
    });

    await recordMouvementFinancier(tx, {
      groupId: input.groupId,
      caisse: caissePenalitesCycle(input.cycle.id_cycle, input.cycle.nom_cycle),
      type: "ENTREE",
      source: "PENALITE_CYCLE",
      montant: allocation.amount,
      motif: `Pénalité tour ${allocation.numeroTour} - ${input.cycle.nom_cycle}`,
      adminId: input.adminId,
      membreId: input.memberId,
      referenceType: "cotisations",
      referenceId: created.id_cotisation,
      dateMouvement: input.datePaiement,
    });
  }

  return createdIds;
}
