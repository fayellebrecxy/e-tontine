"use client";

import * as React from "react";
import { CheckCircle2, Loader2, Smartphone, XCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getProviderLabel,
  getSimulationDelayMs,
  getUssdHint,
  maskPaymentPhone,
} from "@/lib/payment-simulation";

type PaymentProvider = "ORANGE_MONEY" | "MTN_MOMO";

type PaymentContextType =
  | "CYCLE_COTISATION"
  | "RUBRIQUE"
  | "AMENDE_REUNION"
  | "EPARGNE_DEPOT"
  | "PRET_REMBOURSEMENT"
  | "CYCLE_DISTRIBUTION"
  | "PRET_DECAISSEMENT"
  | "RUBRIQUE_RETRAIT"
  | "PENALITE_RETRAIT"
  | "AMENDE_RETRAIT"
  | "EPARGNE_RETRAIT";

type TransactionStatus = {
  id: string;
  statut: "PENDING" | "PROCESSING" | "SUCCESS" | "FAILED" | "CANCELLED";
  provider: PaymentProvider;
  providerReference: string | null;
  montant: number;
  devise: string;
  messageErreur: string | null;
  dateConfirmation: string | null;
  resultId: string | null;
};

type Step = "form" | "waiting" | "success" | "failed";

export type MobileMoneyCheckoutProps = {
  groupId: string;
  contextType: PaymentContextType;
  contextId: string;
  montant?: number;
  montantLabel?: string;
  metadata?: Record<string, unknown>;
  targetMemberId?: string;
  direction?: "INBOUND" | "OUTBOUND";
  defaultTelephone?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (transaction: TransactionStatus) => void;
  title?: string;
  description?: string;
};

const PROVIDERS: { value: PaymentProvider; label: string; hint: string }[] = [
  { value: "ORANGE_MONEY", label: "Orange Money", hint: "#150#" },
  { value: "MTN_MOMO", label: "MTN MoMo", hint: "*126#" },
];

export function MobileMoneyCheckout({
  groupId,
  contextType,
  contextId,
  montant,
  montantLabel,
  metadata,
  targetMemberId,
  direction = "INBOUND",
  defaultTelephone = "",
  open,
  onOpenChange,
  onSuccess,
  title,
  description,
}: MobileMoneyCheckoutProps) {
  const [step, setStep] = React.useState<Step>("form");
  const [provider, setProvider] = React.useState<PaymentProvider>("ORANGE_MONEY");
  const [telephone, setTelephone] = React.useState(defaultTelephone);
  const [transaction, setTransaction] = React.useState<TransactionStatus | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [elapsed, setElapsed] = React.useState(0);
  const onSuccessRef = React.useRef(onSuccess);
  const transactionIdRef = React.useRef<string | null>(null);
  const terminalRef = React.useRef(false);
  const successNotifiedRef = React.useRef(false);
  const confirmSentRef = React.useRef(false);
  const confirmInFlightRef = React.useRef(false);

  React.useEffect(() => {
    onSuccessRef.current = onSuccess;
  }, [onSuccess]);

  const applyTransactionResult = React.useCallback((tx: TransactionStatus) => {
    setTransaction(tx);
    if (tx.statut === "SUCCESS") {
      terminalRef.current = true;
      setStep("success");
      if (!successNotifiedRef.current) {
        successNotifiedRef.current = true;
        onSuccessRef.current?.(tx);
      }
    } else if (tx.statut === "FAILED" || tx.statut === "CANCELLED") {
      terminalRef.current = true;
      setStep("failed");
    }
  }, []);

  const fetchStatus = React.useCallback(
    async (transactionId: string) => {
      const statusRes = await fetch(
        `/api/groups/${groupId}/payments/${transactionId}/status`,
        { credentials: "same-origin" },
      );
      const statusBody = await statusRes.json().catch(() => null) as null | {
        ok?: boolean;
        error?: string;
        transaction?: TransactionStatus;
      };

      if (!statusRes.ok || !statusBody?.ok || !statusBody.transaction) {
        if (!terminalRef.current) {
          toast.error(statusBody?.error ?? "Impossible de vérifier le paiement.");
        }
        return null;
      }

      return statusBody.transaction;
    },
    [groupId],
  );

  const confirmPayment = React.useCallback(
    async (transactionId: string) => {
      const confirmRes = await fetch(
        `/api/groups/${groupId}/payments/${transactionId}/confirm`,
        { method: "POST", credentials: "same-origin" },
      );
      const confirmBody = await confirmRes.json().catch(() => null) as null | {
        ok?: boolean;
        error?: string;
        transaction?: TransactionStatus;
      };

      if (confirmRes.ok && confirmBody?.ok && confirmBody.transaction) {
        return confirmBody.transaction;
      }

      if (!confirmRes.ok && confirmBody?.error && !terminalRef.current) {
        toast.error(confirmBody.error);
      }

      return fetchStatus(transactionId);
    },
    [fetchStatus, groupId],
  );

  const refreshTransaction = React.useCallback(
    async (transactionId: string, mode: "poll" | "confirm") => {
      if (terminalRef.current) return;

      const tx =
        mode === "confirm"
          ? await confirmPayment(transactionId)
          : await fetchStatus(transactionId);

      if (tx) {
        applyTransactionResult(tx);
      }
    },
    [applyTransactionResult, confirmPayment, fetchStatus],
  );

  const reset = React.useCallback(() => {
    setStep("form");
    setProvider("ORANGE_MONEY");
    setTelephone(defaultTelephone);
    setTransaction(null);
    setSubmitting(false);
    setElapsed(0);
    transactionIdRef.current = null;
    terminalRef.current = false;
    successNotifiedRef.current = false;
    confirmSentRef.current = false;
    confirmInFlightRef.current = false;
  }, [defaultTelephone]);

  React.useEffect(() => {
    if (!open) {
      reset();
    }
  }, [open, reset]);

  React.useEffect(() => {
    setTelephone(defaultTelephone);
  }, [defaultTelephone]);

  React.useEffect(() => {
    const transactionId = transaction?.id;
    if (step !== "waiting" || !transactionId) return;

    const delayMs = getSimulationDelayMs(direction);
    const startedAt = Date.now();

    const tick = window.setInterval(() => {
      setElapsed(Math.min(delayMs, Date.now() - startedAt));
    }, 200);

    const runConfirmOnce = async () => {
      if (terminalRef.current || confirmSentRef.current || confirmInFlightRef.current) return;
      confirmInFlightRef.current = true;
      confirmSentRef.current = true;
      try {
        await refreshTransaction(transactionId, "confirm");
      } finally {
        confirmInFlightRef.current = false;
      }
    };

    const pollStatus = () => {
      if (terminalRef.current) return;
      void refreshTransaction(transactionId, "poll");
    };

    pollStatus();

    const confirmTimer = window.setTimeout(() => {
      void runConfirmOnce();
    }, delayMs);

    const poll = window.setInterval(() => {
      if (terminalRef.current) return;
      if (Date.now() - startedAt >= delayMs) {
        if (!confirmSentRef.current) {
          void runConfirmOnce();
          return;
        }
        pollStatus();
      }
    }, 2000);

    return () => {
      window.clearInterval(tick);
      window.clearInterval(poll);
      window.clearTimeout(confirmTimer);
    };
  }, [direction, refreshTransaction, step, transaction?.id]);

  const initiate = async () => {
    if (!telephone.trim() || telephone.trim().length < 8) {
      toast.error("Veuillez saisir un numéro de téléphone valide.");
      return;
    }

    setSubmitting(true);
    const res = await fetch(`/api/groups/${groupId}/payments/initiate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({
        context_type: contextType,
        context_id: contextId,
        provider,
        telephone: telephone.trim(),
        ...(montant !== undefined ? { montant } : {}),
        ...(metadata ? { metadata } : {}),
        ...(targetMemberId ? { target_member_id: targetMemberId } : {}),
      }),
    });
    setSubmitting(false);

    const body = await res.json().catch(() => null) as null | {
      ok?: boolean;
      error?: string;
      transaction?: TransactionStatus;
    };

    if (!res.ok || !body?.ok || !body.transaction) {
      toast.error(body?.error ?? "Impossible d'initier le paiement.");
      return;
    }

    setTransaction(body.transaction);
    transactionIdRef.current = body.transaction.id;
    setStep("waiting");
    setElapsed(0);
  };

  const delayMs = getSimulationDelayMs(direction);
  const progress = Math.min(100, Math.round((elapsed / delayMs) * 100));
  const displayAmount =
    montantLabel ??
    (montant !== undefined ? `${montant.toLocaleString("fr-FR")} XAF` : null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-brand-600" />
            {title ?? (direction === "OUTBOUND" ? "Transfert Mobile Money" : "Paiement Mobile Money")}
          </DialogTitle>
          <DialogDescription>
            {description ??
              "Une demande de confirmation va être envoyée sur votre téléphone. Veuillez patienter."}
          </DialogDescription>
        </DialogHeader>

        {step === "form" && (
          <div className="space-y-4">
            {displayAmount ? (
              <div className="rounded-lg border border-brand-100 bg-brand-50 px-4 py-3">
                <p className="text-xs font-medium uppercase text-brand-700">Montant</p>
                <p className="text-2xl font-bold text-brand-900">{displayAmount}</p>
              </div>
            ) : null}

            <div className="space-y-2">
              <Label>Opérateur</Label>
              <div className="grid grid-cols-2 gap-2">
                {PROVIDERS.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setProvider(item.value)}
                    className={`rounded-lg border px-3 py-3 text-left text-sm transition ${
                      provider === item.value
                        ? "border-brand-500 bg-brand-50 ring-1 ring-brand-500"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <span className="font-semibold">{item.label}</span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      USSD {item.hint}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mm-phone">Numéro de téléphone</Label>
              <Input
                id="mm-phone"
                value={telephone}
                onChange={(e) => setTelephone(e.target.value)}
                placeholder="Ex : 6XX XX XX XX"
                inputMode="tel"
              />
              <p className="text-xs text-muted-foreground">
                {direction === "OUTBOUND"
                  ? "Numéro du bénéficiaire qui recevra le transfert."
                  : "Numéro du compte Mobile Money à débiter."}
              </p>
            </div>
          </div>
        )}

        {step === "waiting" && transaction && (
          <div className="space-y-4 py-2 text-center">
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-brand-600" />
            <div>
              <p className="font-semibold text-gray-900">
                En attente de validation sur votre mobile…
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {getUssdHint(transaction.provider)}
              </p>
            </div>
            <div className="space-y-1">
              <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-brand-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Vérification en cours via {getProviderLabel(transaction.provider)}…
              </p>
            </div>
          </div>
        )}

        {step === "success" && transaction && (
          <div className="space-y-4">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-center">
              <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
              <p className="mt-2 text-lg font-bold text-emerald-800">Paiement confirmé</p>
              <p className="text-sm text-emerald-700">
                {direction === "OUTBOUND"
                  ? "Le transfert a été effectué avec succès."
                  : "Votre paiement a été enregistré avec succès."}
              </p>
            </div>

            <div className="rounded-lg border bg-muted/30 p-4 text-sm space-y-2">
              <p className="font-semibold">Reçu de paiement numérique</p>
              <div className="grid gap-1 text-muted-foreground">
                <p>
                  <span className="text-foreground font-medium">Statut :</span> Confirmé ✅
                </p>
                <p>
                  <span className="text-foreground font-medium">Opérateur :</span>{" "}
                  {getProviderLabel(transaction.provider)}
                </p>
                <p>
                  <span className="text-foreground font-medium">Référence :</span>{" "}
                  {transaction.providerReference}
                </p>
                <p>
                  <span className="text-foreground font-medium">Montant :</span>{" "}
                  {transaction.montant.toLocaleString("fr-FR")} {transaction.devise}
                </p>
                <p>
                  <span className="text-foreground font-medium">Frais :</span> 0 {transaction.devise}
                </p>
                <p>
                  Un SMS de confirmation a été envoyé au {maskPaymentPhone(telephone)}.
                </p>
              </div>
            </div>
          </div>
        )}

        {step === "failed" && transaction && (
          <div className="space-y-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-4 text-center">
            <XCircle className="mx-auto h-10 w-10 text-rose-600" />
            <p className="font-semibold text-rose-800">Paiement échoué</p>
            <p className="text-sm text-rose-700">
              {transaction.messageErreur ?? "La transaction n'a pas pu être confirmée."}
            </p>
          </div>
        )}

        <DialogFooter>
          {step === "form" && (
            <>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button type="button" onClick={initiate} disabled={submitting}>
                {submitting ? "Initialisation…" : "Valider le paiement"}
              </Button>
            </>
          )}
          {step === "waiting" && (
            <Button type="button" variant="outline" disabled>
              Patientez…
            </Button>
          )}
          {(step === "success" || step === "failed") && (
            <Button type="button" onClick={() => onOpenChange(false)}>
              Fermer
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function MobileMoneyPayButton({
  children,
  ...checkoutProps
}: Omit<MobileMoneyCheckoutProps, "open" | "onOpenChange"> & {
  children?: React.ReactNode;
  buttonVariant?: "default" | "outline" | "secondary" | "destructive" | "ghost" | "link";
  buttonSize?: "default" | "sm" | "lg" | "icon";
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const {
    buttonVariant = "default",
    buttonSize = "sm",
    className,
    onSuccess,
    ...rest
  } = checkoutProps;

  return (
    <>
      <Button
        type="button"
        variant={buttonVariant}
        size={buttonSize}
        className={className}
        onClick={() => setOpen(true)}
      >
        {children ?? "Payer via Mobile Money"}
      </Button>
      <MobileMoneyCheckout
        {...rest}
        open={open}
        onOpenChange={setOpen}
        onSuccess={(tx) => {
          onSuccess?.(tx);
          toast.success("Paiement Mobile Money confirmé.");
        }}
      />
    </>
  );
}
