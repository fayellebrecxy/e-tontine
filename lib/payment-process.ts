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

async function loadPaymentTransaction(
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

  return { ok: true, transaction };
}

function isTerminalStatus(statut: PaymentTransaction["statut"]) {
  return statut === "SUCCESS" || statut === "FAILED" || statut === "CANCELLED";
}

async function syncTransactionIfAlreadyFinalized(
  transaction: PaymentTransaction,
): Promise<PaymentTransaction | null> {
  if (isTerminalStatus(transaction.statut)) {
    return transaction;
  }

  const existingMovement = await prisma.mouvementFinancier.findFirst({
    where: {
      id_groupe: transaction.id_groupe,
      reference_type: "payment_transactions",
      reference_id: transaction.id_transaction,
    },
    select: { id_mouvement: true },
  });

  if (!existingMovement) {
    return null;
  }

  const now = new Date();
  const reference =
    transaction.provider_reference ?? generateProviderReference(transaction.provider, now);

  return prisma.paymentTransaction.update({
    where: { id_transaction: transaction.id_transaction },
    data: {
      statut: "SUCCESS",
      provider_reference: reference,
      date_confirmation: transaction.date_confirmation ?? now,
      message_erreur: null,
    },
  });
}

async function executePaymentFinalization(
  transaction: PaymentTransaction,
): Promise<PaymentTransaction> {
  const synced = await syncTransactionIfAlreadyFinalized(transaction);
  if (synced && isTerminalStatus(synced.statut)) {
    return synced;
  }

  const now = new Date();
  const reference =
    transaction.provider_reference ?? generateProviderReference(transaction.provider, now);

  let result: { ok: true; resultId?: string } | { ok: false; error: string };
  try {
    result = await finalizePaymentTransaction(transaction);
  } catch (error) {
    console.error("finalizePaymentTransaction:", error);
    result = { ok: false, error: "Erreur lors de la finalisation du paiement." };
  }

  if (!result.ok) {
    return prisma.paymentTransaction.update({
      where: { id_transaction: transaction.id_transaction },
      data: {
        statut: "FAILED",
        message_erreur: result.error,
        date_confirmation: now,
        provider_reference: reference,
      },
    });
  }

  return prisma.paymentTransaction.update({
    where: { id_transaction: transaction.id_transaction },
    data: {
      statut: "SUCCESS",
      provider_reference: reference,
      date_confirmation: now,
      id_resultat: result.resultId ?? null,
      message_erreur: null,
    },
  });
}

/** Read-only status lookup — does not finalize the payment. */
export async function getPaymentTransactionStatus(
  transactionId: string,
  groupId: string,
  requesterMemberId: string,
): Promise<
  | { ok: true; transaction: PaymentTransaction }
  | { ok: false; error: string; status: number }
> {
  const loaded = await loadPaymentTransaction(transactionId, groupId, requesterMemberId);
  if (!loaded.ok) {
    return loaded;
  }

  const synced = await syncTransactionIfAlreadyFinalized(loaded.transaction);
  if (synced) {
    return { ok: true, transaction: synced };
  }

  return loaded;
}

export async function processPendingPaymentIfReady(
  transactionId: string,
  groupId: string,
  requesterMemberId: string,
): Promise<
  | { ok: true; transaction: PaymentTransaction }
  | { ok: false; error: string; status: number }
> {
  const loaded = await loadPaymentTransaction(transactionId, groupId, requesterMemberId);
  if (!loaded.ok) {
    return loaded;
  }

  let transaction = loaded.transaction;

  const synced = await syncTransactionIfAlreadyFinalized(transaction);
  if (synced) {
    transaction = synced;
  }

  if (isTerminalStatus(transaction.statut)) {
    return { ok: true, transaction };
  }

  if (transaction.statut === "PROCESSING") {
    return { ok: true, transaction };
  }

  if (transaction.statut !== "PENDING") {
    return { ok: true, transaction };
  }

  const elapsed = Date.now() - transaction.date_creation.getTime();
  const requiredDelay = getSimulationDelayMs(transaction.direction);

  if (elapsed < requiredDelay) {
    return { ok: true, transaction };
  }

  const now = new Date();

  if (shouldSimulatePaymentFailure(transaction.telephone)) {
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
    data: {
      statut: "PROCESSING",
      provider_reference: reference,
    },
  });

  if (locked.count === 0) {
    const current = await prisma.paymentTransaction.findUnique({
      where: { id_transaction: transactionId },
    });
    if (!current) {
      return { ok: false, error: "Transaction introuvable.", status: 404 };
    }

    const resynced = await syncTransactionIfAlreadyFinalized(current);
    if (resynced) {
      return { ok: true, transaction: resynced };
    }

    return { ok: true, transaction: current };
  }

  const pending = await prisma.paymentTransaction.findUnique({
    where: { id_transaction: transactionId },
  });

  if (!pending) {
    return { ok: false, error: "Transaction introuvable.", status: 404 };
  }

  const completed = await executePaymentFinalization(pending);
  return { ok: true, transaction: completed };
}
