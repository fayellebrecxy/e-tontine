import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

export type RubriqueCaisseStats = {
  totalCollecte: number;
  totalRetraits: number;
  solde: number;
};

export async function getRubriqueCaisseStatsMap(
  rubriqueIds: string[],
): Promise<Record<string, RubriqueCaisseStats>> {
  if (rubriqueIds.length === 0) return {};

  const [paiementAgg, retraitAgg] = await Promise.all([
    prisma.paiementRubrique.groupBy({
      by: ["id_rubrique"],
      where: { id_rubrique: { in: rubriqueIds } },
      _sum: { montant_paye: true },
    }),
    prisma.retrait.groupBy({
      by: ["id_rubrique"],
      where: { id_rubrique: { in: rubriqueIds } },
      _sum: { montant: true },
    }),
  ]);

  const map: Record<string, RubriqueCaisseStats> = {};
  for (const id of rubriqueIds) {
    map[id] = { totalCollecte: 0, totalRetraits: 0, solde: 0 };
  }

  for (const row of paiementAgg) {
    if (row.id_rubrique) {
      map[row.id_rubrique].totalCollecte = Number(row._sum.montant_paye ?? 0);
    }
  }

  for (const row of retraitAgg) {
    if (row.id_rubrique) {
      map[row.id_rubrique].totalRetraits = Number(row._sum.montant ?? 0);
    }
  }

  for (const id of rubriqueIds) {
    const { totalCollecte, totalRetraits } = map[id];
    map[id].solde = Math.round((totalCollecte - totalRetraits) * 100) / 100;
  }

  return map;
}

export async function getRubriqueSolde(rubriqueId: string): Promise<number> {
  const stats = await getRubriqueCaisseStatsMap([rubriqueId]);
  return stats[rubriqueId]?.solde ?? 0;
}

export async function notifyGroupMembersRubriqueRetrait({
  groupId,
  rubriqueNom,
  montant,
  motif,
  soldeRestant,
  devise = "XAF",
}: {
  groupId: string;
  rubriqueNom: string;
  montant: number;
  motif: string;
  soldeRestant: number;
  devise?: string;
}) {
  const [membres, groupe] = await Promise.all([
    prisma.membreGroupe.findMany({
      where: { id_groupe: groupId, statut_adhesion: "ACTIF" },
      select: { id_user: true },
    }),
    prisma.groupes.findUnique({
      where: { id_groupe: groupId },
      select: { devise: true },
    }),
  ]);

  const currency = groupe?.devise ?? devise;
  const message = `Retrait de ${montant.toLocaleString("fr-FR")} ${currency} sur la rubrique « ${rubriqueNom} » (${motif}). Solde restant : ${soldeRestant.toLocaleString("fr-FR")} ${currency}.`;

  await Promise.all(
    membres.map((membre) =>
      createNotification({
        userId: membre.id_user,
        groupId,
        type: "RETRAIT_RUBRIQUE",
        message,
      }),
    ),
  );
}
