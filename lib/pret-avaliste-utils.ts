import { formatPretMontant } from "@/lib/pret-utils";

/** Épargne avaliste entre 65 % et 135 % du montant demandé = « proche ». */
export const AVALISTE_EPARGNE_MIN_RATIO = 0.65;
export const AVALISTE_EPARGNE_MAX_RATIO = 1.35;

export function isAvalisteEpargneProche(soldeDisponible: number, montantDemande: number): boolean {
  if (!Number.isFinite(montantDemande) || montantDemande <= 0) return false;
  if (!Number.isFinite(soldeDisponible) || soldeDisponible <= 0) return false;
  const ratio = soldeDisponible / montantDemande;
  return ratio >= AVALISTE_EPARGNE_MIN_RATIO && ratio <= AVALISTE_EPARGNE_MAX_RATIO;
}

export function computeAvalisteEcart(soldeDisponible: number, montantDemande: number): number {
  if (!Number.isFinite(montantDemande) || montantDemande <= 0) return Number.POSITIVE_INFINITY;
  return Math.abs(soldeDisponible - montantDemande);
}

export function formatAvalisteEpargneFourchette(montantDemande: number, devise = "XAF"): string {
  const min = Math.ceil(montantDemande * AVALISTE_EPARGNE_MIN_RATIO);
  const max = Math.floor(montantDemande * AVALISTE_EPARGNE_MAX_RATIO);
  return `entre ${formatPretMontant(min, devise)} et ${formatPretMontant(max, devise)}`;
}

export type AvalistePoolMember = {
  id_membre_groupe: string;
  label: string;
  soldeDisponible: number;
};

export function rankAvalisteCandidates(
  pool: AvalistePoolMember[],
  montantDemande: number,
): Array<
  AvalistePoolMember & {
    ecartMontant: number;
    eligible: boolean;
  }
> {
  return [...pool]
    .map((member) => ({
      ...member,
      ecartMontant: computeAvalisteEcart(member.soldeDisponible, montantDemande),
      eligible: isAvalisteEpargneProche(member.soldeDisponible, montantDemande),
    }))
    .sort((a, b) => {
      if (a.eligible !== b.eligible) return a.eligible ? -1 : 1;
      return a.ecartMontant - b.ecartMontant;
    });
}
