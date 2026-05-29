"use client";

type VersementItem = {
  id_versement: string;
  numero_tour: number;
  montant_verse: number;
  date_versement: Date | string;
  mode_versement: string | null;
  reference_externe: string | null;
  beneficiaire: {
    id_membre_groupe: string;
    user: { nom: string; prenom: string };
  };
  valideur: {
    user: { nom: string; prenom: string };
  };
};

type TourInfo = {
  numero: number;
  beneficiaire: string;
  potCollecte: number;
};

type DistributionHistoryProps = {
  versements: VersementItem[];
  tours: TourInfo[];
  totalTours: number;
  devise: string;
};

const MODE_LABELS: Record<string, string> = {
  VIREMENT: "Virement",
  ESPECES: "Espèces",
  MOBILE_MONEY: "Mobile Money",
  CHEQUE: "Chèque",
};

export function DistributionHistory({
  versements,
  tours,
  totalTours,
  devise,
}: DistributionHistoryProps) {
  const versementsParTour = new Map(versements.map((v) => [v.numero_tour, v]));
  const toursParNumero = new Map(tours.map((t) => [t.numero, t]));

  const toursVerses = versements.length;
  const totalDistribue = versements.reduce((acc, v) => acc + Number(v.montant_verse), 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">
          Historique des versements aux bénéficiaires
        </h2>
        <span className="text-xs text-muted-foreground">
          {toursVerses} / {totalTours} tours soldés
        </span>
      </div>

      {/* Résumé trésorerie */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="space-y-1">
          <p className="text-[10px] font-medium text-gray-500 uppercase">Tours soldés</p>
          <p className="text-xl font-bold text-emerald-600">
            {toursVerses} / {totalTours}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-medium text-gray-500 uppercase">Total distribué</p>
          <p className="text-xl font-bold text-brand-600">
            {totalDistribue.toLocaleString("fr-FR")} {devise}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-medium text-gray-500 uppercase">Progression</p>
          <p className="text-xl font-bold text-gray-900">
            {totalTours > 0 ? Math.round((toursVerses / totalTours) * 100) : 0}%
          </p>
        </div>
      </div>

      {/* Tableau des tours */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50 text-left">
              <th className="px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase">Tour</th>
              <th className="px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase">Bénéficiaire</th>
              <th className="px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase">Pot collecté</th>
              <th className="px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase">Montant versé</th>
              <th className="px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase">Date</th>
              <th className="px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase">Mode</th>
              <th className="px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {Array.from({ length: totalTours }, (_, i) => {
              const num = i + 1;
              const versement = versementsParTour.get(num);
              const tourInfo = toursParNumero.get(num);

              return (
                <tr key={num} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-semibold text-gray-900">Tour {num}</td>
                  <td className="px-4 py-3 text-gray-700">
                    {versement
                      ? `${versement.beneficiaire.user.prenom} ${versement.beneficiaire.user.nom}`
                      : tourInfo?.beneficiaire ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {tourInfo
                      ? `${tourInfo.potCollecte.toLocaleString("fr-FR")} ${devise}`
                      : "—"}
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-900">
                    {versement
                      ? `${Number(versement.montant_verse).toLocaleString("fr-FR")} ${devise}`
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {versement
                      ? new Date(versement.date_versement).toLocaleDateString("fr-FR")
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {versement?.mode_versement
                      ? MODE_LABELS[versement.mode_versement] ?? versement.mode_versement
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {versement ? (
                      <span className="inline-flex items-center rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                        ✅ Soldé
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700 ring-1 ring-inset ring-amber-600/20">
                        ⏳ En attente
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {versements.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-4">
          Aucun versement enregistré pour ce cycle.
        </p>
      )}
    </div>
  );
}
