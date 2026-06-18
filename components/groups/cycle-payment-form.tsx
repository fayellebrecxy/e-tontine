"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MobileMoneyCheckout } from "@/components/payments/mobile-money-checkout";

type DebtSlice = {
  type: "COTISATION" | "PENALITE";
  numeroTour: number;
  remaining: number;
};

type ParticipantItem = {
  id_membre_groupe: string;
  nom: string;
  prenom: string;
  totalDue: number;
  cotisationDue: number;
  penaltyDue: number;
  debtSlices: DebtSlice[];
};

type TourItem = {
  numero: number;
  beneficiaire: string;
  dateEcheance: string;
};

type CyclePaymentFormProps = {
  groupId: string;
  cycleId: string;
  participants: ParticipantItem[];
  tours: TourItem[];
  defaultTour: number;
};

export function CyclePaymentForm({
  groupId,
  cycleId,
  participants,
  tours,
}: CyclePaymentFormProps) {
  const router = useRouter();
  const [selected, setSelected] = React.useState(
    participants.find((participant) => participant.totalDue > 0)?.id_membre_groupe ??
      participants[0]?.id_membre_groupe ??
      "",
  );
  const [montant, setMontant] = React.useState("");
  const [datePaiement, setDatePaiement] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [showMobileMoney, setShowMobileMoney] = React.useState(false);

  const selectedParticipant = participants.find((participant) => participant.id_membre_groupe === selected);
  const activeTourInfo = tours[0];

  const submit = async () => {
    const montantValue = Number(montant);
    if (!selected) {
      toast.error("Veuillez sélectionner un membre.");
      return;
    }

    if (!Number.isFinite(montantValue) || montantValue <= 0) {
      toast.error("Veuillez saisir un montant valide et positif.");
      return;
    }

    if (selectedParticipant && montantValue > selectedParticipant.totalDue) {
      toast.error(
        `Montant trop élevé. Total dû : ${selectedParticipant.totalDue.toLocaleString("fr-FR")}.`,
      );
      return;
    }

    setSubmitting(true);
    const res = await fetch(`/api/groups/${groupId}/cycles/${cycleId}/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id_membre_groupe: selected,
        montant: montantValue,
        ...(datePaiement ? { date_paiement: datePaiement } : {}),
      }),
    });

    const body = (await res.json().catch(() => null)) as null | { ok?: boolean; error?: string };

    if (!res.ok || !body?.ok) {
      toast.error(body?.error ?? "Impossible d'enregistrer le versement.");
      setSubmitting(false);
      return;
    }

    toast.success(`✅ Versement de ${montantValue.toLocaleString("fr-FR")} enregistré avec succès.`);
    setMontant("");
    setDatePaiement("");
    setSubmitting(false);
    router.refresh();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Enregistrer un versement (Admin)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Le montant est imputé automatiquement dans l&apos;ordre : arriérés des tours passés,
          pénalités associées, puis cotisation du tour en cours.
        </p>

        {activeTourInfo ? (
          <div className="rounded-md border border-brand-100 bg-brand-50 px-3 py-2 text-xs text-brand-800">
            Tour actif : {activeTourInfo.numero} — Bénéficiaire : {activeTourInfo.beneficiaire} —
            Échéance : {activeTourInfo.dateEcheance}
          </div>
        ) : null}

        <div className="space-y-2">
          <Label>Membre qui a versé</Label>
          <select
            className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm"
            value={selected}
            onChange={(event) => setSelected(event.target.value)}
          >
            {participants.map((member) => (
              <option
                key={member.id_membre_groupe}
                value={member.id_membre_groupe}
                disabled={member.totalDue <= 0}
              >
                {member.prenom} {member.nom}
                {member.totalDue > 0
                  ? ` — total dû : ${member.totalDue.toLocaleString("fr-FR")}`
                  : " — soldé"}
              </option>
            ))}
          </select>

          {selectedParticipant && selectedParticipant.totalDue > 0 ? (
            <div className="space-y-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-xs">
              <p>
                Cotisations en attente :{" "}
                <strong>{selectedParticipant.cotisationDue.toLocaleString("fr-FR")}</strong>
              </p>
              {selectedParticipant.penaltyDue > 0 ? (
                <p className="text-amber-800">
                  Pénalités en attente :{" "}
                  <strong>{selectedParticipant.penaltyDue.toLocaleString("fr-FR")}</strong>
                </p>
              ) : null}
              <ul className="list-disc space-y-0.5 pl-4 text-gray-600">
                {selectedParticipant.debtSlices.map((slice) => (
                  <li key={`${slice.type}-${slice.numeroTour}`}>
                    {slice.type === "COTISATION" ? "Cotisation" : "Pénalité"} tour {slice.numeroTour}{" "}
                    : {slice.remaining.toLocaleString("fr-FR")}
                  </li>
                ))}
              </ul>
              <p className="font-semibold text-gray-800">
                Total à collecter : {selectedParticipant.totalDue.toLocaleString("fr-FR")}
              </p>
            </div>
          ) : null}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Montant versé</Label>
            <Input
              type="number"
              min={0}
              max={selectedParticipant?.totalDue}
              step="0.01"
              value={montant}
              onChange={(event) => setMontant(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Date du versement</Label>
            <p className="text-xs text-muted-foreground">Laissez vide pour utiliser la date d&apos;aujourd&apos;hui.</p>
            <Input
              type="date"
              value={datePaiement}
              onChange={(event) => setDatePaiement(event.target.value)}
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={submit} disabled={submitting || !selectedParticipant?.totalDue}>
            {submitting ? "Enregistrement…" : "✅ Enregistrer manuellement"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={!selectedParticipant?.totalDue}
            onClick={() => setShowMobileMoney(true)}
          >
            📱 Simuler Mobile Money
          </Button>
        </div>

        {selectedParticipant && selectedParticipant.totalDue > 0 ? (
          <MobileMoneyCheckout
            groupId={groupId}
            contextType="CYCLE_COTISATION"
            contextId={cycleId}
            montant={Number(montant) > 0 ? Number(montant) : selectedParticipant.totalDue}
            montantLabel={`${(Number(montant) > 0 ? Number(montant) : selectedParticipant.totalDue).toLocaleString("fr-FR")} XAF`}
            targetMemberId={selected}
            open={showMobileMoney}
            onOpenChange={setShowMobileMoney}
            onSuccess={() => {
              setMontant("");
              setDatePaiement("");
              router.refresh();
            }}
            title="Encaisser via Mobile Money"
            description="Simulez un paiement Mobile Money pour le membre sélectionné."
          />
        ) : null}
      </CardContent>
    </Card>
  );
}
