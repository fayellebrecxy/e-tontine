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
  const [selected, setSelected] = React.useState(participants[0]?.id_membre_groupe ?? "");
  const [numeroTour, setNumeroTour] = React.useState(String(defaultTour));
  const [montant, setMontant] = React.useState("");
  const [datePaiement, setDatePaiement] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const submit = async () => {
    const montantValue = Number(montant);
    if (!selected) {
      toast.error("Selectionnez un membre.");
      return;
    }

    if (!Number.isFinite(montantValue) || montantValue <= 0) {
      toast.error("Montant invalide.");
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

    toast.success(`✅ Versement de ${montantValue.toLocaleString("fr-FR")} enregistre avec succes.`);
    setMontant("");
    setDatePaiement("");
    setSubmitting(false);
    router.refresh();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Enregistrer un versement</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <Label>Membre</Label>
          <select
            className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm"
            value={selected}
            onChange={(event) => setSelected(event.target.value)}
          >
            {participants.map((member) => (
              <option key={member.id_membre_groupe} value={member.id_membre_groupe}>
                {member.prenom} {member.nom}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label>Tour concerne</Label>
          <select
            className="w-full rounded-md border border-input bg-white px-3 py-2 text-sm"
            value={numeroTour}
            onChange={(event) => setNumeroTour(event.target.value)}
          >
            {tours.map((tour) => (
              <option key={tour.numero} value={tour.numero}>
                Tour {tour.numero} - {tour.beneficiaire} - echeance {tour.dateEcheance}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Montant verse</Label>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={montant}
              onChange={(event) => setMontant(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Date de versement</Label>
            <Input
              type="date"
              value={datePaiement}
              onChange={(event) => setDatePaiement(event.target.value)}
            />
          </div>
        </div>
        <Button type="button" onClick={submit} disabled={submitting}>
          {submitting ? "Enregistrement..." : "Ajouter le versement"}
        </Button>
      </CardContent>
    </Card>
  );
}
