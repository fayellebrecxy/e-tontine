"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ParticipantItem = {
  id_membre_groupe: string;
  nom: string;
  prenom: string;
  paidForActiveTour?: number;
  remainingForActiveTour?: number;
  /** Pénalité automatique en attente pour ce tour (non encore collectée) */
  pendingPenaltyForActiveTour?: number | null;
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
  defaultTour,
}: CyclePaymentFormProps) {
  const router = useRouter();
  const [selected, setSelected] = React.useState(
    participants.find(
      (participant) =>
        (participant.remainingForActiveTour ?? 0) > 0 ||
        (participant.pendingPenaltyForActiveTour ?? 0) > 0,
    )
      ?.id_membre_groupe ??
      participants[0]?.id_membre_groupe ??
      "",
  );
  const [numeroTour, setNumeroTour] = React.useState(String(defaultTour));
  const [montant, setMontant] = React.useState("");
  const [datePaiement, setDatePaiement] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const selectedParticipant = participants.find((participant) => participant.id_membre_groupe === selected);
  const selectedRemaining = selectedParticipant?.remainingForActiveTour ?? 0;
  const selectedPenalty = selectedParticipant?.pendingPenaltyForActiveTour ?? 0;
  const selectedTotalToCollect = selectedRemaining + selectedPenalty;

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

    setSubmitting(true);
    const res = await fetch(`/api/groups/${groupId}/cycles/${cycleId}/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id_membre_groupe: selected,
        montant: montantValue,
        numero_tour: Number(numeroTour),
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
          Sélectionnez le membre qui a payé, le tour concerné, puis saisissez le montant reçu.
        </p>
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
                disabled={
                  (member.remainingForActiveTour ?? 0) <= 0 &&
                  !(member.pendingPenaltyForActiveTour && member.pendingPenaltyForActiveTour > 0)
                }
              >
                {member.prenom} {member.nom}
                {typeof member.remainingForActiveTour === "number"
                  ? ` — cotisation restante : ${member.remainingForActiveTour.toLocaleString("fr-FR")}`
                  : ""}
                {member.pendingPenaltyForActiveTour
                  ? ` ⚠️ pénalité : ${member.pendingPenaltyForActiveTour.toLocaleString("fr-FR")}`
                  : ""}
              </option>
            ))}
          </select>
          {selectedParticipant ? (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">
                Déjà versé : {(selectedParticipant.paidForActiveTour ?? 0).toLocaleString("fr-FR")} ·
                Reste à cotiser : <span className="font-medium text-gray-700">{selectedRemaining.toLocaleString("fr-FR")}</span>
              </p>
              {selectedParticipant.pendingPenaltyForActiveTour ? (
                <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  <span className="font-semibold">⚠️ Pénalité de retard enregistrée automatiquement :</span>{" "}
                  <span className="font-bold">{selectedParticipant.pendingPenaltyForActiveTour.toLocaleString("fr-FR")}</span>
                  <br />
                  Ce membre doit payer sa cotisation + la pénalité. Lorsque vous enregistrerez son paiement,
                  la cotisation ira dans la caisse principale et la pénalité dans la caisse pénalités.
                  <br />
                  <span className="font-semibold">Total à collecter :{" "}
                    {selectedTotalToCollect.toLocaleString("fr-FR")}
                  </span>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label>Tour concerné</Label>
          <p className="text-xs text-muted-foreground">Chaque tour correspond à un bénéficiaire. Le tour en cours est pré-sélectionné.</p>
          <select
            className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm"
            value={numeroTour}
            onChange={(event) => setNumeroTour(event.target.value)}
          >
            {tours.map((tour) => (
              <option key={tour.numero} value={tour.numero}>
                Tour {tour.numero} — Bénéficiaire : {tour.beneficiaire} — Échéance : {tour.dateEcheance}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Montant versé</Label>
            <Input
              type="number"
              min={0}
              max={selectedTotalToCollect || selectedParticipant?.remainingForActiveTour}
              step="0.01"
              value={montant}
              onChange={(event) => setMontant(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Date du versement</Label>
              <p className="text-xs text-muted-foreground">Laissez vide pour utiliser la date d'aujourd'hui.</p>
            <Input
              type="date"
              value={datePaiement}
              onChange={(event) => setDatePaiement(event.target.value)}
            />
          </div>
        </div>
        <Button type="button" onClick={submit} disabled={submitting}>
          {submitting ? "Enregistrement…" : "✅ Enregistrer le versement"}
        </Button>
      </CardContent>
    </Card>
  );
}
