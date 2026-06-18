import type { PaymentTransaction } from "@/lib/generated/prisma";
import { prisma } from "@/lib/prisma";
import type { PaymentMetadata } from "@/lib/payment-amounts";

function asMetadata(value: unknown): PaymentMetadata {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as PaymentMetadata;
  }
  return {};
}

export async function canAccessPaymentTransaction(
  transaction: PaymentTransaction,
  groupId: string,
  requesterMemberId: string,
) {
  const requester = await prisma.membreGroupe.findFirst({
    where: {
      id_membre_groupe: requesterMemberId,
      id_groupe: groupId,
      statut_adhesion: "ACTIF",
    },
    select: { role: true },
  });

  if (!requester) {
    return false;
  }

  const metadata = asMetadata(transaction.metadata);
  const initiatedBy =
    typeof metadata.initiatedByMemberId === "string" ? metadata.initiatedByMemberId : null;

  if (transaction.id_membre_groupe === requesterMemberId) {
    return true;
  }

  if (initiatedBy === requesterMemberId) {
    return true;
  }

  return requester.role === "ADMIN";
}
