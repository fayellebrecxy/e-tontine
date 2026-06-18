import type { Prisma } from "@/lib/generated/prisma";
import { prisma } from "@/lib/prisma";

/**
 * Default Prisma interactive transactions time out after 5s.
 * Financial flows (journal entries, multi-tour allocations) can exceed that on remote DBs.
 */
export const EXTENDED_TRANSACTION_OPTIONS = {
  maxWait: 10_000,
  timeout: 30_000,
};

export function runExtendedTransaction<T>(
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  return prisma.$transaction(fn, EXTENDED_TRANSACTION_OPTIONS);
}
