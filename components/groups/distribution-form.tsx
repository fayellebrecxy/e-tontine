"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MobileMoneyCheckout } from "@/components/payments/mobile-money-checkout";

type TourItem = {
  numero: number;
  beneficiaire: string;
  idBeneficiaire: string;
  dateEcheance: string;
  potCollecte: number;
  potAttendu: number;
  soldeDisponible: number;
  dejaVerse: boolean;
  canDistribute: boolean;
  isPastDue: boolean;
};

type DistributionFormProps = {
  groupId: string;
  cycleId: string;
  tours: TourItem[];
  defaultTour: number;
  devise: string;
};

const MODES_VERSEMENT = [
  { value: "", label: "— Non précisé —" },
  { value: "VIREMENT", label: "Virement bancaire" },
  { value: "ESPECES", label: "Espèces" },
  { value: "MOBILE_MONEY", label: "Mobile Money" },
  { value: "CHEQUE", label: "Chèque" },
];

export function DistributionForm({
  groupId,
  cycleId,
  tours,
  defaultTour,
  devise,
}: DistributionFormProps) {
  const router = useRouter();

  const toursDisponibles = tours.filter((t) => !t.dejaVerse);

  const [numeroTour, setNumeroTour] = React.useState(
    String(toursDisponibles.find((t) => t.numero === defaultTour)?.numero ?? toursDisponibles[0]?.numero ?? defaultTour),
  );
  const [montantVerse, setMontantVerse] = React.useState("");
  const [modeVersement, setModeVersement] = React.useState("");
  const [referenceExterne, setReferenceExterne] = React.useState("");
  const [dateVersement, setDateVersement] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [showMobileMoney, setShowMobileMoney] = React.useState(false);

  const tourSelectionne = tours.find((t) => t.numero === Number(numeroTour));

  React.useEffect(() => {
    if (tourSelectionne && tourSelectionne.soldeDisponible > 0) {
      setMontantVerse(String(tourSelectionne.soldeDisponible));
    } else {
      setMontantVerse("");
    }
  }, [numeroTour, tourSelectionne]);

  const submit = async () => {
    const montantValue = Number(montantVerse);

    if (!Number.isFinite(montantValue) || montantValue <= 0) {
      toast.error("Veuillez saisir un montant valide et positif.");
      return;
    }

    if (tourSelectionne?.dejaVerse) {
      toast.error(`Le tour ${numeroTour} a déjà été soldé.`);
      return;
    }

    if (tourSelectionne && !tourSelectionne.canDistribute) {
      toast.error("Le pot ne peut être versé qu'après la date d'échéance du tour actif.");
      return;
    }

    if (tourSelectionne && montantValue > tourSelectionne.soldeDisponible) {
      toast.error(
        `Le montant ne peut pas dépasser la caisse disponible (${tourSelectionne.soldeDisponible.toLocaleString("fr-FR")} ${devise}).`,
      );
      return;
    }

    if (modeVersement === "MOBILE_MONEY") {
      setShowMobileMoney(true);
      return;
    }

    await submitManual(montantValue);
  };

  const submitManual = async (montantValue: number) => {
    setSubmitting(true);

    const res = await fetch(`/api/groups/${groupId}/cycles/${cycleId}/distributions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        numero_tour: Number(numeroTour),
        montant_verse: montantValue,
        ...(modeVersement ? { mode_versement: modeVersement } : {}),
        ...(referenceExterne.trim() ? { reference_externe: referenceExterne.trim() } : {}),
        ...(dateVersement ? { date_versement: dateVersement } : {}),
      }),
    });

    const body = (await res.json().catch(() => null)) as null | { ok?: boolean; error?: string };

    if (!res.ok || !body?.ok) {
      toast.error(body?.error ?? "Impossible d'enregistrer le versement.");
      setSubmitting(false);
      return;
    }

    toast.success(
      `💰 Pot du tour ${numeroTour} versé à ${tourSelectionne?.beneficiaire ?? "—"} avec succès !`,
    );
    setMontantVerse("");
    setReferenceExterne("");
    setDateVersement("");
    setModeVersement("");
    setSubmitting(false);
    router.refresh();
  };

  if (toursDisponibles.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>💰 Verser le pot au bénéficiaire</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-emerald-700 font-medium">
            ✅ Tous les tours de ce cycle ont reçu leur pot.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>💰 Verser le pot au bénéficiaire</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Versez le pot au bénéficiaire du tour actif après la date d&apos;échéance. Le montant peut
          être inférieur au pot théorique si des cotisations manquent — les arriérés seront réclamés
          au prochain tour. Les pénalités restent dans une caisse séparée.
        </p>

        {tourSelectionne?.canDistribute ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            ⏰ Échéance dépassée — vous pouvez clôturer ce tour et passer au suivant.
          </div>
        ) : tourSelectionne && !tourSelectionne.isPastDue ? (
          <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-900">
            Le versement sera possible après l&apos;échéance du {tourSelectionne.dateEcheance}.
          </div>
        ) : null}

        <div className="space-y-2">
          <Label>Tour à clôturer</Label>
          <select
            className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm"
            value={numeroTour}
            onChange={(e) => setNumeroTour(e.target.value)}
          >
            {tours.map((tour) => (
              <option key={tour.numero} value={tour.numero} disabled={tour.dejaVerse}>
                Tour {tour.numero} — {tour.beneficiaire} — Échéance : {tour.dateEcheance}
                {tour.dejaVerse ? " ✅ Versé" : ""}
              </option>
            ))}
          </select>
        </div>

        {tourSelectionne && (
          <div className="rounded-lg border border-brand-100 bg-brand-50 p-3 space-y-1">
            <p className="text-xs font-semibold text-brand-700 uppercase">Bénéficiaire du tour</p>
            <p className="text-sm font-bold text-brand-900">{tourSelectionne.beneficiaire}</p>
            <p className="text-xs text-brand-600">
              Pot attendu :{" "}
              <strong>{tourSelectionne.potAttendu.toLocaleString("fr-FR")} {devise}</strong>
            </p>
            <p className="text-xs text-brand-600">
              Collecté :{" "}
              <strong>{tourSelectionne.potCollecte.toLocaleString("fr-FR")} {devise}</strong>
            </p>
            <p className="text-xs text-brand-600">
              Caisse disponible :{" "}
              <strong>{tourSelectionne.soldeDisponible.toLocaleString("fr-FR")} {devise}</strong>
            </p>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Montant versé ({devise})</Label>
            <Input
              type="number"
              min={0}
              max={tourSelectionne?.soldeDisponible}
              step="0.01"
              placeholder="Ex : 150000"
              value={montantVerse}
              onChange={(e) => setMontantVerse(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Maximum : {tourSelectionne?.soldeDisponible.toLocaleString("fr-FR") ?? "—"} {devise}
            </p>
          </div>

          <div className="space-y-2">
            <Label>Date du versement</Label>
            <p className="text-xs text-muted-foreground">Laissez vide pour aujourd&apos;hui.</p>
            <Input
              type="date"
              value={dateVersement}
              onChange={(e) => setDateVersement(e.target.value)}
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Mode de versement</Label>
            <select
              className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm"
              value={modeVersement}
              onChange={(e) => setModeVersement(e.target.value)}
            >
              {MODES_VERSEMENT.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label>Référence externe (optionnel)</Label>
            <Input
              type="text"
              placeholder="Ex : TXN-123456789"
              value={referenceExterne}
              onChange={(e) => setReferenceExterne(e.target.value)}
            />
          </div>
        </div>

        <Button
          type="button"
          onClick={submit}
          disabled={submitting || !tourSelectionne?.canDistribute}
          className="w-full sm:w-auto"
        >
          {submitting
            ? "Enregistrement…"
            : modeVersement === "MOBILE_MONEY"
              ? "📱 Verser via Mobile Money"
              : "💰 Verser le pot au bénéficiaire"}
        </Button>

        {tourSelectionne?.canDistribute ? (
          <MobileMoneyCheckout
            groupId={groupId}
            contextType="CYCLE_DISTRIBUTION"
            contextId={cycleId}
            direction="OUTBOUND"
            montant={Number(montantVerse)}
            montantLabel={`${Number(montantVerse).toLocaleString("fr-FR")} ${devise}`}
            metadata={{
              numero_tour: Number(numeroTour),
              montant: Number(montantVerse),
            }}
            open={showMobileMoney}
            onOpenChange={setShowMobileMoney}
            onSuccess={() => {
              setMontantVerse("");
              setReferenceExterne("");
              setDateVersement("");
              setModeVersement("");
              router.refresh();
            }}
            title="Verser le pot via Mobile Money"
            description={`Transfert simulé vers ${tourSelectionne.beneficiaire}.`}
          />
        ) : null}
      </CardContent>
    </Card>
  );
}
