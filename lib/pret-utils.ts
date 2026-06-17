import { Prisma } from "@/lib/generated/prisma";

export function roundCurrency(value: number) {
  return Math.round(value);
}

export function formatPretMontant(montant: number | Prisma.Decimal, devise = "XAF") {
  const value = typeof montant === "number" ? montant : Number(montant);
  return `${value.toLocaleString("fr-FR")} ${devise}`;
}

export type RepartitionBanqueEntry = {
  id_compte: string;
  id_membre_groupe: string;
  part_pct: number;
  montant: number;
};

/** Répartition proportionnelle avec arrondi entier (FCFA). */
export function allocateProportional(
  total: number,
  accounts: { id_compte: string; id_membre_groupe: string; solde: number }[],
): RepartitionBanqueEntry[] {
  const bank = accounts.reduce((sum, account) => sum + account.solde, 0);
  if (total <= 0 || bank <= 0) return [];

  const raw = accounts.map((account) => {
    const exact = (account.solde / bank) * total;
    return {
      id_compte: account.id_compte,
      id_membre_groupe: account.id_membre_groupe,
      part_pct: account.solde / bank,
      exact,
      amount: Math.floor(exact),
    };
  });

  let assigned = raw.reduce((sum, row) => sum + row.amount, 0);
  const remainder = roundCurrency(total - assigned);

  const order = raw
    .map((row, index) => ({ index, frac: row.exact - row.amount }))
    .sort((a, b) => b.frac - a.frac);

  for (let i = 0; i < remainder && i < order.length; i += 1) {
    raw[order[i].index].amount += 1;
    assigned += 1;
  }

  return raw.map((row) => ({
    id_compte: row.id_compte,
    id_membre_groupe: row.id_membre_groupe,
    part_pct: row.part_pct,
    montant: row.amount,
  }));
}

export function computeInterestForMonths(
  principal: number,
  rateMonthlyPct: number,
  months: number,
): number {
  if (principal <= 0 || rateMonthlyPct <= 0 || months <= 0) return 0;
  return roundCurrency(principal * (rateMonthlyPct / 100) * months);
}

export function monthsBetween(start: Date, end: Date): number {
  const ms = Math.max(0, end.getTime() - start.getTime());
  return ms / (30 * 24 * 60 * 60 * 1000);
}

export function computeElapsedInterest(
  principal: number,
  rateMonthlyPct: number,
  start: Date,
  end: Date,
): number {
  return computeInterestForMonths(principal, rateMonthlyPct, monthsBetween(start, end));
}

export function buildContratAvalisteFromForm(vars: {
  avaliste_nom: string;
  emprunteur_nom: string;
  montant: string;
  duree: string;
  date_contrat: string;
  signature_nom: string;
}) {
  return [
    `CONTRAT DE GARANTIE (AVALISTE)`,
    ``,
    `Je soussigné(e) ${vars.avaliste_nom}, en date du ${vars.date_contrat},`,
    `accepte de me porter garant pour ${vars.emprunteur_nom}`,
    `concernant un prêt de ${vars.montant} sur ${vars.duree} mois.`,
    ``,
    `J'autorise expressément la saisie de mes fonds d'épargne`,
    `en cas de défaut de remboursement de l'emprunteur.`,
    ``,
    `Signature : ${vars.signature_nom}`,
  ].join("\n");
}

export const ACTIVE_LOAN_STATUSES = [
  "EN_ATTENTE_ANALYSE",
  "EN_ATTENTE_AVALISTES",
  "EN_ATTENTE_CONFIRMATION_AVALISTES",
  "APPROUVE",
  "EN_COURS",
  "EN_RETARD",
] as const;

export const OPEN_LOAN_STATUSES = ["EN_COURS", "EN_RETARD"] as const;
