import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getActiveMembership } from "@/lib/payment-auth";
import { processPendingPaymentIfReady, serializePaymentStatus } from "@/lib/payment-process";

export async function GET(
  _request: NextRequest,
  ctx: { params: Promise<{ groupId: string; transactionId: string }> },
) {
  const { groupId, transactionId } = await ctx.params;

  const auth = await getActiveMembership(groupId);
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  const result = await processPendingPaymentIfReady(
    transactionId,
    groupId,
    auth.membership.id_membre_groupe,
  );

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
  }

  return NextResponse.json({
    ok: true,
    transaction: serializePaymentStatus(result.transaction),
  });
}
