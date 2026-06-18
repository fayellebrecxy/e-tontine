import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { initiatePaymentSchema } from "@/lib/validations";
import { canInitiatePayment, getActiveMembership } from "@/lib/payment-auth";
import { isOutboundContext, resolvePaymentAmount } from "@/lib/payment-amounts";
import {
  generateProviderReference,
  normalizePaymentPhone,
} from "@/lib/payment-simulation";
import { serializePaymentStatus } from "@/lib/payment-process";

export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ groupId: string }> },
) {
  const { groupId } = await ctx.params;

  const auth = await getActiveMembership(groupId);
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  const parsed = initiatePaymentSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Données invalides." }, { status: 400 });
  }

  const {
    context_type,
    context_id,
    provider,
    telephone,
    montant,
    metadata: rawMetadata,
    target_member_id,
  } = parsed.data;

  const direction = isOutboundContext(context_type) ? "OUTBOUND" : "INBOUND";

  let payerMemberId =
    direction === "INBOUND" && target_member_id && auth.membership.role === "ADMIN"
      ? target_member_id
      : auth.membership.id_membre_groupe;

  if (context_type === "EPARGNE_DEPOT" || context_type === "EPARGNE_RETRAIT") {
    const account = await prisma.compteEpargne.findFirst({
      where: { id_compte: context_id, id_groupe: groupId, statut: "ACTIF" },
      select: { id_membre_groupe: true },
    });
    if (!account) {
      return NextResponse.json({ ok: false, error: "Compte épargne introuvable." }, { status: 404 });
    }
    if (context_type === "EPARGNE_DEPOT" && direction === "INBOUND") {
      payerMemberId = account.id_membre_groupe;
    }
  }

  if (
    !canInitiatePayment({
      contextType: context_type,
      direction,
      role: auth.membership.role,
      payerMemberId,
      actorMemberId: auth.membership.id_membre_groupe,
      targetMemberId: target_member_id,
    })
  ) {
    return NextResponse.json({ ok: false, error: "Action non autorisée." }, { status: 403 });
  }

  const metadata = {
    ...(rawMetadata ?? {}),
    ...(montant !== undefined ? { montant } : {}),
    ...(target_member_id ? { targetMemberId: target_member_id } : {}),
    initiatedByMemberId: auth.membership.id_membre_groupe,
  };

  const amountResult = await resolvePaymentAmount({
    groupId,
    contextType: context_type,
    contextId: context_id,
    memberId: payerMemberId,
    direction,
    metadata,
  });

  if (!amountResult.ok) {
    return NextResponse.json({ ok: false, error: amountResult.error }, { status: 409 });
  }

  const transaction = await prisma.paymentTransaction.create({
    data: {
      id_groupe: groupId,
      id_membre_groupe:
        direction === "OUTBOUND" ? auth.membership.id_membre_groupe : payerMemberId,
      context_type: context_type,
      context_id: context_id,
      direction,
      montant: amountResult.montant,
      devise: amountResult.devise,
      provider,
      telephone: normalizePaymentPhone(telephone),
      provider_reference: generateProviderReference(provider),
      statut: "PENDING",
      metadata: amountResult.metadata as object,
    },
  });

  return NextResponse.json(
    {
      ok: true,
      transaction: serializePaymentStatus(transaction),
    },
    { status: 201 },
  );
}
