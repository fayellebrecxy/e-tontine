"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Calendar, Clock, Smartphone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MobileMoneyCheckout } from "@/components/payments/mobile-money-checkout";
import {
  FREQUENCE_LABELS,
  getRubriquePlanningSummary,
  type FrequenceRubrique,
  type RubriquePlanningInput,
  type TypeRubriqueCotisation,
} from "@/lib/rubrique-dates";

type Props = {
  rubrique: {
    type_rubrique: TypeRubriqueCotisation;
    frequence: FrequenceRubrique;
    date_debut: string | Date;
    duree_jours?: number | null;
    date_limite?: string | Date | null;
    date_fin?: string | Date | null;
  };
  /** Reste à payer pour le membre connecté (0 si admin vue globale sans filtre). */
  resteAPayer?: number;
  compact?: boolean;
  groupId?: string;
  rubriqueId?: string;
  memberTelephone?: string;
  devise?: string;
};

export function RubriquePlanningBanner({
  rubrique,
  resteAPayer = 0,
  compact,
  groupId,
  rubriqueId,
  memberTelephone,
  devise = "XAF",
}: Props) {
  const router = useRouter();
  const [montant, setMontant] = React.useState("");
  const [open, setOpen] = React.useState(false);

  const planning: RubriquePlanningInput = {
    type_rubrique: rubrique.type_rubrique,
    frequence: rubrique.frequence,
    date_debut: new Date(rubrique.date_debut),
    duree_jours: rubrique.duree_jours,
    date_fin: rubrique.date_fin ? new Date(rubrique.date_fin) : null,
    date_limite: rubrique.date_limite ? new Date(rubrique.date_limite) : null,
  };

  const summary = getRubriquePlanningSummary(planning);
  const canPay = Boolean(groupId && rubriqueId && resteAPayer > 0);
  const amount = Number(montant);
  const isValidAmount = Number.isFinite(amount) && amount > 0 && amount <= resteAPayer;

  if (compact) {
    return (
      <p className="text-xs text-muted-foreground truncate">
        {summary.frequenceLabel}
        {summary.dateDebutLabel ? ` · Début ${summary.dateDebutLabel}` : ""}
      </p>
    );
  }

  return (
    <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary">{FREQUENCE_LABELS[rubrique.frequence]}</Badge>
        {canPay ? (
          <Badge variant="destructive" className="bg-rose-100 text-rose-700 hover:bg-rose-100">
            Reste {resteAPayer.toLocaleString("fr-FR")} {devise}
          </Badge>
        ) : resteAPayer === 0 && groupId ? (
          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Soldé</Badge>
        ) : null}
      </div>

      <div className="grid gap-2 sm:grid-cols-2 text-sm">
        <div className="flex items-start gap-2">
          <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
          <div>
            <p className="text-muted-foreground text-xs">Date de début</p>
            <p className="font-medium">{summary.dateDebutLabel}</p>
          </div>
        </div>

        {summary.dateFinLabel ? (
          <div className="flex items-start gap-2">
            <Clock className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
            <div>
              <p className="text-muted-foreground text-xs">Date de fin</p>
              <p className="font-medium">{summary.dateFinLabel}</p>
            </div>
          </div>
        ) : null}
      </div>

      {canPay ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-3">
          <div>
            <p className="text-sm font-semibold text-amber-900">Paiement en attente</p>
            <p className="text-xs text-amber-800">
              Réglez votre cotisation rubrique via Orange Money ou MTN MoMo.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rubrique-montant">Montant à verser ({devise})</Label>
            <Input
              id="rubrique-montant"
              type="number"
              min={1}
              max={resteAPayer}
              step="1"
              value={montant}
              onChange={(e) => setMontant(e.target.value)}
              placeholder={`Ex : ${Math.min(resteAPayer, 5000).toLocaleString("fr-FR")}`}
              className="bg-white"
            />
            <p className="text-xs text-amber-800">
              Paiement en tranche possible · Maximum{" "}
              {resteAPayer.toLocaleString("fr-FR")} {devise}
            </p>
          </div>

          <Button
            type="button"
            className="gap-2"
            disabled={!isValidAmount}
            onClick={() => setOpen(true)}
          >
            <Smartphone className="h-4 w-4" />
            Payer ma rubrique
          </Button>

          <MobileMoneyCheckout
            groupId={groupId!}
            contextType="RUBRIQUE"
            contextId={rubriqueId!}
            montant={amount}
            montantLabel={`${amount.toLocaleString("fr-FR")} ${devise}`}
            defaultTelephone={memberTelephone}
            open={open}
            onOpenChange={setOpen}
            onSuccess={() => {
              setMontant("");
              router.refresh();
            }}
            title="Payer ma rubrique"
          />
        </div>
      ) : null}
    </div>
  );
}
