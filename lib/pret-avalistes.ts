import { prisma } from "@/lib/prisma";
import {
  formatAvalisteEpargneFourchette,
  isAvalisteEpargneProche,
  type AvalistePoolMember,
} from "@/lib/pret-avaliste-utils";
import { formatPretMontant, roundCurrency } from "@/lib/pret-utils";

export async function getAvalistePoolForGroup(
  groupId: string,
  excludeMemberId?: string,
): Promise<AvalistePoolMember[]> {
  const members = await prisma.membreGroupe.findMany({
    where: {
      id_groupe: groupId,
      statut_adhesion: "ACTIF",
      ...(excludeMemberId ? { id_membre_groupe: { not: excludeMemberId } } : {}),
    },
    include: {
      user: { select: { prenom: true, nom: true } },
      compte_epargne: { select: { id_compte: true, solde_actuel: true, statut: true } },
    },
    orderBy: { user: { prenom: "asc" } },
  });

  const compteIds = members
    .map((m) => m.compte_epargne?.id_compte)
    .filter((id): id is string => Boolean(id));

  const engagements =
    compteIds.length > 0
      ? await prisma.engagementEpargne.groupBy({
          by: ["id_compte"],
          where: { id_compte: { in: compteIds }, actif: true },
          _sum: { montant_engage: true },
        })
      : [];

  const engagedByCompte = new Map(
    engagements.map((row) => [row.id_compte, Number(row._sum.montant_engage ?? 0)]),
  );

  return members.map((member) => {
    const compte = member.compte_epargne;
    let soldeDisponible = 0;
    if (compte?.statut === "ACTIF") {
      const engaged = engagedByCompte.get(compte.id_compte) ?? 0;
      soldeDisponible = Math.max(
        0,
        roundCurrency(Number(compte.solde_actuel) - engaged),
      );
    }

    return {
      id_membre_groupe: member.id_membre_groupe,
      label: `${member.user.prenom} ${member.user.nom}`,
      soldeDisponible,
    };
  });
}

export async function validateAvalistesForMontant({
  groupId,
  montantDemande,
  avalisteIds,
  emprunteurId,
  devise = "XAF",
}: {
  groupId: string;
  montantDemande: number;
  avalisteIds: string[];
  emprunteurId: string;
  devise?: string;
}): Promise<{ ok: boolean; errors: string[] }> {
  const pool = await getAvalistePoolForGroup(groupId, emprunteurId);
  const poolById = new Map(pool.map((m) => [m.id_membre_groupe, m]));
  const errors: string[] = [];
  const fourchette = formatAvalisteEpargneFourchette(montantDemande, devise);

  for (const avalisteId of avalisteIds) {
    const candidate = poolById.get(avalisteId);
    if (!candidate) {
      errors.push("Un avaliste sélectionné est introuvable ou inactif.");
      continue;
    }
    if (!isAvalisteEpargneProche(candidate.soldeDisponible, montantDemande)) {
      errors.push(
        `${candidate.label} : épargne disponible ${formatPretMontant(candidate.soldeDisponible, devise)} trop éloignée du montant ${formatPretMontant(montantDemande, devise)} (fourchette ${fourchette}).`,
      );
    }
  }

  return { ok: errors.length === 0, errors };
}
