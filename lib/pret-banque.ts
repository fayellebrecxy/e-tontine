import { Prisma } from "@/lib/generated/prisma";
import type { Prisma as PrismaNamespace } from "@/lib/generated/prisma";

import { prisma } from "@/lib/prisma";
import { allocateProportional, roundCurrency, type RepartitionBanqueEntry } from "@/lib/pret-utils";

type Tx = PrismaNamespace.TransactionClient;

const BANK_TX_OPTIONS = { maxWait: 15_000, timeout: 30_000 } as const;

export type BanqueSummary = {
  total: number;
  disponible: number;
  pretsEnCours: number;
  caisseInterets: number;
  nbComptesActifs: number;
};

export async function getActiveEpargneAccounts(groupId: string, tx: Tx = prisma) {
  return tx.compteEpargne.findMany({
    where: { id_groupe: groupId, statut: "ACTIF" },
    select: {
      id_compte: true,
      id_membre_groupe: true,
      solde_actuel: true,
      numero_compte: true,
      membre: {
        select: {
          user: { select: { nom: true, prenom: true } },
        },
      },
    },
    orderBy: { numero_compte: "asc" },
  });
}

export async function getEngagementsTotal(compteId: string, tx: Tx = prisma) {
  const agg = await tx.engagementEpargne.aggregate({
    where: { id_compte: compteId, actif: true },
    _sum: { montant_engage: true },
  });
  return Number(agg._sum.montant_engage ?? 0);
}

export async function getEpargneDisponible(compteId: string, tx: Tx = prisma) {
  const account = await tx.compteEpargne.findUnique({
    where: { id_compte: compteId },
    select: { solde_actuel: true, statut: true },
  });
  if (!account || account.statut !== "ACTIF") return 0;

  const engaged = await getEngagementsTotal(compteId, tx);
  return Math.max(0, roundCurrency(Number(account.solde_actuel) - engaged));
}

async function ensureCaisseInterets(groupId: string, tx: Tx = prisma) {
  const existing = await tx.caisseFinanciere.findFirst({
    where: {
      id_groupe: groupId,
      type_caisse: "PRETS_INTERETS",
      reference_key: "prets_interets",
    },
  });

  if (existing) return existing;

  return tx.caisseFinanciere.create({
    data: {
      id_groupe: groupId,
      type_caisse: "PRETS_INTERETS",
      reference_key: "prets_interets",
      nom: "Caisse intérêts prêts",
    },
  });
}

export async function getBanqueSummary(groupId: string): Promise<BanqueSummary> {
  const [accounts, pretsEnCours, caisse] = await Promise.all([
    getActiveEpargneAccounts(groupId),
    prisma.pret.aggregate({
      where: { id_groupe: groupId, statut: { in: ["EN_COURS", "EN_RETARD"] } },
      _sum: { montant_capital_restant: true },
    }),
    prisma.caisseFinanciere.findFirst({
      where: {
        id_groupe: groupId,
        type_caisse: "PRETS_INTERETS",
        reference_key: "prets_interets",
      },
      select: { solde_actuel: true },
    }),
  ]);

  const total = accounts.reduce((sum, account) => sum + Number(account.solde_actuel), 0);

  return {
    total: roundCurrency(total),
    disponible: roundCurrency(total),
    pretsEnCours: roundCurrency(Number(pretsEnCours._sum.montant_capital_restant ?? 0)),
    caisseInterets: roundCurrency(Number(caisse?.solde_actuel ?? 0)),
    nbComptesActifs: accounts.length,
  };
}

export async function applyBankMovement({
  tx,
  groupId,
  pretId,
  mouvementPretId,
  entries,
  direction,
  motif,
  operatorMemberId,
  epargneType,
}: {
  tx: Tx;
  groupId: string;
  pretId: string;
  mouvementPretId: string;
  entries: RepartitionBanqueEntry[];
  direction: "DEBIT" | "CREDIT";
  motif: string;
  operatorMemberId?: string;
  epargneType: "PRET_DEBIT_BANQUE" | "PRET_CREDIT_BANQUE";
}) {
  const activeEntries = entries.filter((entry) => entry.montant > 0);
  if (activeEntries.length === 0) return [];

  const accounts = await tx.compteEpargne.findMany({
    where: { id_compte: { in: activeEntries.map((entry) => entry.id_compte) } },
    select: {
      id_compte: true,
      id_membre_groupe: true,
      solde_actuel: true,
      statut: true,
    },
  });
  const accountById = new Map(accounts.map((account) => [account.id_compte, account]));

  const impacts = [];

  for (const entry of activeEntries) {
    const account = accountById.get(entry.id_compte);

    if (!account || account.statut !== "ACTIF") continue;

    const soldeAvant = Number(account.solde_actuel);
    const delta = direction === "DEBIT" ? -entry.montant : entry.montant;

    if (direction === "DEBIT" && soldeAvant + delta < -0.001) {
      throw new Error(`Solde insuffisant sur le compte ${entry.id_compte}.`);
    }

    const soldeApres = roundCurrency(soldeAvant + delta);

    await tx.compteEpargne.update({
      where: { id_compte: account.id_compte },
      data: { solde_actuel: new Prisma.Decimal(soldeApres) },
    });

    await tx.mouvementEpargne.create({
      data: {
        id_compte: account.id_compte,
        id_groupe: groupId,
        id_membre_groupe: account.id_membre_groupe,
        id_operateur: operatorMemberId ?? null,
        role_acteur: operatorMemberId ? "ADMIN" : "SYSTEME",
        type_operation: epargneType,
        montant: new Prisma.Decimal(entry.montant),
        motif,
        solde_avant: new Prisma.Decimal(soldeAvant),
        solde_apres: new Prisma.Decimal(soldeApres),
      },
    });

    const impact = await tx.mouvementBanquePret.create({
      data: {
        id_mouvement_pret: mouvementPretId,
        id_pret: pretId,
        id_compte: account.id_compte,
        id_membre_groupe: entry.id_membre_groupe,
        montant: new Prisma.Decimal(delta),
        solde_avant: new Prisma.Decimal(soldeAvant),
        solde_apres: new Prisma.Decimal(soldeApres),
      },
    });

    impacts.push(impact);
  }

  return impacts;
}

export async function creditInterestCaisse({
  tx,
  groupId,
  montant,
  pretId,
  operatorMemberId,
}: {
  tx: Tx;
  groupId: string;
  montant: number;
  pretId: string;
  operatorMemberId: string;
}) {
  const caisse = await ensureCaisseInterets(groupId, tx);
  const soldeAvant = Number(caisse.solde_actuel);
  const soldeApres = roundCurrency(soldeAvant + montant);

  await tx.caisseFinanciere.update({
    where: { id_caisse: caisse.id_caisse },
    data: { solde_actuel: new Prisma.Decimal(soldeApres) },
  });

  await tx.mouvementFinancier.create({
    data: {
      id_groupe: groupId,
      id_caisse: caisse.id_caisse,
      type_mouvement: "ENTREE",
      source: "RETRAIT_GENERAL",
      montant: new Prisma.Decimal(montant),
      motif: `Intérêts remboursés — prêt ${pretId.slice(0, 8)}`,
      solde_avant: new Prisma.Decimal(soldeAvant),
      solde_apres: new Prisma.Decimal(soldeApres),
      id_admin_createur: operatorMemberId,
      reference_type: "PRET",
      reference_id: pretId,
    },
  });

  return { soldeApres };
}

export function buildRepartitionFromStored(
  stored: RepartitionBanqueEntry[] | null | undefined,
  amount: number,
): RepartitionBanqueEntry[] {
  if (!stored?.length) return [];
  return stored.map((entry) => ({
    ...entry,
    montant: roundCurrency(entry.part_pct * amount),
  }));
}

export function computeRepartitionForAmount(
  accounts: { id_compte: string; id_membre_groupe: string; solde: number }[],
  amount: number,
) {
  return allocateProportional(amount, accounts);
}

export { ensureCaisseInterets, BANK_TX_OPTIONS };
