import type {
  Prisma,
  SourceMouvementFinancier,
  TypeCaisseFinanciere,
  TypeMouvementFinancier,
} from "@/lib/generated/prisma";

type JournalTx = Prisma.TransactionClient;

type CaisseInput = {
  type: TypeCaisseFinanciere;
  referenceKey: string;
  nom: string;
  cycleId?: string | null;
  rubriqueId?: string | null;
};

type RecordMouvementInput = {
  groupId: string;
  caisse: CaisseInput;
  type: TypeMouvementFinancier;
  source: SourceMouvementFinancier;
  montant: number;
  motif: string;
  adminId?: string | null;
  membreId?: string | null;
  referenceType?: string | null;
  referenceId?: string | null;
  dateMouvement?: Date | null;
};

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

export async function recordMouvementFinancier(tx: JournalTx, input: RecordMouvementInput) {
  const montant = roundCurrency(input.montant);
  if (!Number.isFinite(montant) || montant <= 0) return null;

  const caisse = await tx.caisseFinanciere.upsert({
    where: {
      id_groupe_type_caisse_reference_key: {
        id_groupe: input.groupId,
        type_caisse: input.caisse.type,
        reference_key: input.caisse.referenceKey,
      },
    },
    update: {
      nom: input.caisse.nom,
      id_cycle: input.caisse.cycleId ?? null,
      id_rubrique: input.caisse.rubriqueId ?? null,
    },
    create: {
      id_groupe: input.groupId,
      type_caisse: input.caisse.type,
      reference_key: input.caisse.referenceKey,
      nom: input.caisse.nom,
      id_cycle: input.caisse.cycleId ?? null,
      id_rubrique: input.caisse.rubriqueId ?? null,
    },
    select: {
      id_caisse: true,
    },
  });

  const increment = input.type === "SORTIE" ? -montant : montant;
  const updatedCaisse = await tx.caisseFinanciere.update({
    where: { id_caisse: caisse.id_caisse },
    data: { solde_actuel: { increment } },
    select: { solde_actuel: true },
  });

  const soldeApres = roundCurrency(Number(updatedCaisse.solde_actuel));
  const soldeAvant = roundCurrency(soldeApres - increment);

  return tx.mouvementFinancier.create({
    data: {
      id_groupe: input.groupId,
      id_caisse: caisse.id_caisse,
      type_mouvement: input.type,
      source: input.source,
      montant,
      motif: input.motif,
      solde_avant: soldeAvant,
      solde_apres: soldeApres,
      id_admin_createur: input.adminId ?? null,
      id_membre_concerne: input.membreId ?? null,
      reference_type: input.referenceType ?? null,
      reference_id: input.referenceId ?? null,
      date_mouvement: input.dateMouvement ?? new Date(),
    },
  });
}

export function caisseCycle(cycleId: string, nomCycle: string): CaisseInput {
  return {
    type: "CYCLE",
    referenceKey: cycleId,
    nom: `Cycle ${nomCycle}`,
    cycleId,
  };
}

export function caissePenalitesCycle(cycleId: string, nomCycle: string): CaisseInput {
  return {
    type: "PENALITES_CYCLE",
    referenceKey: cycleId,
    nom: `Pénalités ${nomCycle}`,
    cycleId,
  };
}

export function caisseRubrique(rubriqueId: string, nomRubrique: string): CaisseInput {
  return {
    type: "RUBRIQUE",
    referenceKey: rubriqueId,
    nom: `Rubrique ${nomRubrique}`,
    rubriqueId,
  };
}

export function caisseAmendesReunion(): CaisseInput {
  return {
    type: "AMENDES_REUNION",
    referenceKey: "AMENDES_REUNION",
    nom: "Caisse amendes réunions",
  };
}

export function caisseGenerale(groupId: string): CaisseInput {
  return {
    type: "GENERALE",
    referenceKey: groupId,
    nom: "Caisse générale",
  };
}
