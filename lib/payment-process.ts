import type { PaymentTransaction } from "@/lib/generated/prisma";
import { prisma } from "@/lib/prisma";
import {
  generateProviderReference,
  getSimulationDelayMs,
  shouldSimulatePaymentFailure,
} from "@/lib/payment-simulation";
import { finalizePaymentTransaction } from "@/lib/payment-finalize";
import { canAccessPaymentTransaction } from "@/lib/payment-access";

export type PaymentStatusResponse = {
  id: string;
  statut: PaymentTransaction["statut"];
  provider: PaymentTransaction["provider"];
  providerReference: string | null;
  montant: number;
  devise: string;
  messageErreur: string | null;
  dateConfirmation: string | null;
  resultId: string | null;
};

export function serializePaymentStatus(transaction: PaymentTransaction): PaymentStatusResponse {
  return {
    id: transaction.id_transaction,
    statut: transaction.statut,
    provider: transaction.provider,
    providerReference: transaction.provider_reference,
    montant: Number(transaction.montant),
    devise: transaction.devise,
    messageErreur: transaction.message_erreur,
    dateConfirmation: transaction.date_confirmation?.toISOString() ?? null,
    resultId: transaction.id_resultat,
  };
}

export async function processPendingPaymentIfReady(
  transactionId: string,
  groupId: string,
  requesterMemberId: string,
): Promise<
  | { ok: true; transaction: PaymentTransaction }
  | { ok: false; error: string; status: number }
> {
  const transaction = await prisma.paymentTransaction.findFirst({
    where: { id_transaction: transactionId, id_groupe: groupId },
  });

  if (!transaction) {
    return { ok: false, error: "Transaction introuvable.", status: 404 };
  }

  const canAccess = await canAccessPaymentTransaction(
    transaction,
    groupId,
    requesterMemberId,
  );

  if (!canAccess) {
    return { ok: false, error: "Accès refusé.", status: 403 };
  }

  if (transaction.statut !== "PENDING") {
    return { ok: true, transaction };
  }

  const elapsed = Date.now() - transaction.date_creation.getTime();
  const requiredDelay = getSimulationDelayMs(transaction.direction);

  if (elapsed < requiredDelay) {
    return { ok: true, transaction };
  }

  const shouldFail = shouldSimulatePaymentFailure(transaction.telephone);
  const now = new Date();

  if (shouldFail) {
    const failed = await prisma.paymentTransaction.update({
      where: { id_transaction: transactionId },
      data: {
        statut: "FAILED",
        message_erreur: "Solde insuffisant sur votre compte Mobile Money.",
        date_confirmation: now,
      },
    });
    return { ok: true, transaction: failed };
  }

  const reference =
    transaction.provider_reference ?? generateProviderReference(transaction.provider, now);

  const locked = await prisma.paymentTransaction.updateMany({
    where: { id_transaction: transactionId, statut: "PENDING" },
    data: { provider_reference: reference },
  });

  if (locked.count === 0) {
    const current = await prisma.paymentTransaction.findUnique({
      where: { id_transaction: transactionId },
    });
    if (!current) return { ok: false, error: "Transaction introuvable.", status: 404 };
    return { ok: true, transaction: current };
  }

  const pending = await prisma.paymentTransaction.findUnique({
    where: { id_transaction: transactionId },
  });

  if (!pending) {
    return { ok: false, error: "Transaction introuvable.", status: 404 };
  }

  let result: { ok: true; resultId?: string } | { ok: false; error: string };
  try {
    result = await finalizePaymentTransaction(pending);
  } catch (error) {
    console.error("finalizePaymentTransaction:", error);
    result = { ok: false, error: "Erreur lors de la finalisation du paiement." };
  }

  if (!result.ok) {
    const failed = await prisma.paymentTransaction.update({
      where: { id_transaction: transactionId },
      data: {
        statut: "FAILED",
        message_erreur: result.error,
        date_confirmation: now,
        provider_reference: reference,
      },
    });
    return { ok: true, transaction: failed };
  }

  const success = await prisma.paymentTransaction.update({
    where: { id_transaction: transactionId },
    data: {
      statut: "SUCCESS",
      provider_reference: reference,
      date_confirmation: now,
      id_resultat: result.resultId ?? null,
      message_erreur: null,
    },
  });

  return { ok: true, transaction: success };
}
