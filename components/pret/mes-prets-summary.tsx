import Link from "next/link";
import { ArrowRight, Banknote } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  BORROWER_PRET_STATUT_LABELS,
  type BorrowerPretDisplayStatut,
  type MesPretDashboardItem,
} from "@/lib/pret-dashboard";
import { computePretCapitalSummary } from "@/lib/pret-utils";

const STATUT_CONFIG: Record<
  BorrowerPretDisplayStatut,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  APPROUVE: { label: BORROWER_PRET_STATUT_LABELS.APPROUVE, variant: "secondary" },
  EN_COURS: { label: BORROWER_PRET_STATUT_LABELS.EN_COURS, variant: "default" },
  EN_RETARD: { label: BORROWER_PRET_STATUT_LABELS.EN_RETARD, variant: "destructive" },
};

function fmt(n: number, devise: string) {
  return `${n.toLocaleString("fr-FR")} ${devise}`;
}

export function MesPretsSummary({
  prets,
  showGroupName = true,
  compact = false,
}: {
  prets: MesPretDashboardItem[];
  showGroupName?: boolean;
  compact?: boolean;
}) {
  if (prets.length === 0) return null;

  return (
    <section
      className={
        compact
          ? "space-y-3"
          : "rounded-2xl border border-amber-200 bg-amber-50/40 shadow-card dark:border-amber-900/40 dark:bg-amber-950/20"
      }
    >
      {!compact && (
        <header className="flex items-center gap-2 border-b border-amber-200/80 px-5 py-4 dark:border-amber-900/40">
          <Banknote className="size-5 text-amber-700" />
          <h2 className="font-heading text-lg font-semibold text-text-main">Mes prêts</h2>
        </header>
      )}

      <ul className={compact ? "space-y-2" : "space-y-2 px-3 pb-3 pt-2"}>
        {prets.map((pret) => {
          const montant = pret.montant_approuve ?? pret.montant_demande;
          const displayStatut = pret.displayStatut;
          const cfg = STATUT_CONFIG[displayStatut];
          const verse = displayStatut === "EN_COURS" || displayStatut === "EN_RETARD";
          const capital = computePretCapitalSummary({
            montant_approuve: pret.montant_approuve,
            montant_capital_restant: pret.montant_capital_restant,
            date_decaissement: pret.date_decaissement,
          });

          return (
            <li key={pret.id_pret}>
              <Link
                href={`/dashboard/groups/${pret.id_groupe}/prets/${pret.id_pret}`}
                className="flex flex-col gap-2 rounded-xl border border-amber-100 bg-white p-4 transition-colors hover:bg-amber-50/60 dark:border-amber-900/30 dark:bg-slate-950 dark:hover:bg-amber-950/30"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    {showGroupName && (
                      <p className="text-xs font-medium text-amber-800 dark:text-amber-200">
                        {pret.groupeNom}
                      </p>
                    )}
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {fmt(montant, pret.devise)}
                      <span className="ml-2 text-sm font-normal text-slate-500">
                        · {pret.dureeLabel}
                      </span>
                    </p>
                  </div>
                  <Badge variant={cfg.variant}>{cfg.label}</Badge>
                </div>

                {verse && pret.date_decaissement && (
                  <p className="text-sm text-emerald-700 dark:text-emerald-300">
                    Retiré de la banque le{" "}
                    {new Date(pret.date_decaissement).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                    {capital.montantDecaisse > 0 ? (
                      <>
                        {" "}
                        — <strong>{fmt(capital.montantDecaisse, pret.devise)}</strong>
                      </>
                    ) : null}
                  </p>
                )}

                {(displayStatut === "EN_COURS" || displayStatut === "EN_RETARD") && (
                  <div className="grid gap-2 text-sm text-slate-600 sm:grid-cols-2 dark:text-slate-400">
                    {capital.capitalRembourse > 0 ? (
                      <p>
                        Capital remboursé :{" "}
                        <strong className="text-emerald-700 dark:text-emerald-300">
                          {fmt(capital.capitalRembourse, pret.devise)}
                        </strong>
                      </p>
                    ) : null}
                    <p>
                      Capital restant :{" "}
                      <strong className="text-slate-900 dark:text-white">
                        {fmt(pret.montant_capital_restant, pret.devise)}
                      </strong>
                    </p>
                    <p>
                      Intérêts restants :{" "}
                      <strong className="text-slate-900 dark:text-white">
                        {fmt(pret.montant_interets_restant, pret.devise)}
                      </strong>
                    </p>
                    {pret.date_fin && (
                      <p className="sm:col-span-2 text-xs text-slate-500">
                        Échéance : {new Date(pret.date_fin).toLocaleDateString("fr-FR")}
                      </p>
                    )}
                  </div>
                )}

                {displayStatut === "APPROUVE" && (
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Votre demande est approuvée. L&apos;administrateur va verser les fonds prochainement.
                  </p>
                )}

                <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-300">
                  Voir le détail <ArrowRight className="size-3.5" />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
