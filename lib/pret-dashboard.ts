import { prisma } from "@/lib/prisma";
import { markStalePretApprovalNotificationsRead } from "@/lib/notifications";
import { formatDureePret, type UniteDureePret } from "@/lib/pret-utils";

export const BORROWER_DASHBOARD_PRET_STATUTS = ["APPROUVE", "EN_COURS", "EN_RETARD"] as const;

export type BorrowerPretDisplayStatut = "APPROUVE" | "EN_COURS" | "EN_RETARD";

export function resolveBorrowerPretDisplayStatut(pret: {
  statut: string;
  date_decaissement: Date | string | null;
}): BorrowerPretDisplayStatut {
  if (pret.date_decaissement) {
    return pret.statut === "EN_RETARD" ? "EN_RETARD" : "EN_COURS";
  }
  if (pret.statut === "EN_RETARD") return "EN_RETARD";
  if (pret.statut === "EN_COURS") return "EN_COURS";
  return "APPROUVE";
}

export const BORROWER_PRET_STATUT_LABELS: Record<BorrowerPretDisplayStatut, string> = {
  APPROUVE: "En attente de versement",
  EN_COURS: "Prêt versé",
  EN_RETARD: "Prêt en retard",
};

export type MesPretDashboardItem = {
  id_pret: string;
  id_groupe: string;
  groupeNom: string;
  devise: string;
  statut: string;
  displayStatut: BorrowerPretDisplayStatut;
  montant_approuve: number | null;
  montant_demande: number;
  montant_capital_restant: number;
  montant_interets_restant: number;
  dureeLabel: string;
  date_decaissement: string | null;
  date_fin: string | null;
};

export async function getMesPretsForEmprunteur(
  memberIds: string[],
  groupId?: string,
): Promise<MesPretDashboardItem[]> {
  if (memberIds.length === 0) return [];

  const prets = await prisma.pret.findMany({
    where: {
      id_emprunteur: { in: memberIds },
      ...(groupId ? { id_groupe: groupId } : {}),
      OR: [
        { statut: { in: ["EN_COURS", "EN_RETARD"] } },
        { statut: "APPROUVE", date_decaissement: null },
      ],
    },
    orderBy: [{ date_decaissement: "desc" }, { date_demande: "desc" }],
    include: {
      groupe: { select: { nom: true, devise: true } },
    },
  });

  return prets.map((pret) => ({
    id_pret: pret.id_pret,
    id_groupe: pret.id_groupe,
    groupeNom: pret.groupe.nom,
    devise: pret.groupe.devise,
    statut: pret.statut,
    displayStatut: resolveBorrowerPretDisplayStatut(pret),
    montant_approuve: pret.montant_approuve ? Number(pret.montant_approuve) : null,
    montant_demande: Number(pret.montant_demande),
    montant_capital_restant: Number(pret.montant_capital_restant),
    montant_interets_restant: Number(pret.montant_interets_restant),
    dureeLabel:
      pret.duree_valeur_approuvee != null && pret.duree_unite_approuvee
        ? formatDureePret(pret.duree_valeur_approuvee, pret.duree_unite_approuvee as UniteDureePret)
        : formatDureePret(pret.duree_valeur_demandee, pret.duree_unite_demandee as UniteDureePret),
    date_decaissement: pret.date_decaissement?.toISOString() ?? null,
    date_fin: pret.date_fin?.toISOString() ?? null,
  }));
}

/** Corrige les notifications « en attente de décaissement » déjà dépassées. */
export async function syncBorrowerPretNotifications(
  userId: string,
  prets: MesPretDashboardItem[],
) {
  const disbursedGroupIds = [
    ...new Set(
      prets.filter((p) => p.displayStatut !== "APPROUVE").map((p) => p.id_groupe),
    ),
  ];
  await Promise.all(
    disbursedGroupIds.map((groupId) =>
      markStalePretApprovalNotificationsRead({ userId, groupId }),
    ),
  );
}
