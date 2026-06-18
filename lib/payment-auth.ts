import type { PaymentContextType, PaymentDirection } from "@/lib/generated/prisma";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isOutboundContext } from "@/lib/payment-amounts";

export async function getActiveMembership(groupId: string) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { ok: false as const, error: "Configuration Supabase manquante.", status: 500 };
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { ok: false as const, error: "Non authentifié.", status: 401 };
  }

  const membership = await prisma.membreGroupe.findFirst({
    where: { id_user: user.id, id_groupe: groupId, statut_adhesion: "ACTIF" },
    select: {
      id_membre_groupe: true,
      role: true,
      user: { select: { telephone: true } },
    },
  });

  if (!membership) {
    return { ok: false as const, error: "Accès refusé.", status: 403 };
  }

  return { ok: true as const, membership };
}

export function canInitiatePayment(input: {
  contextType: PaymentContextType;
  direction: PaymentDirection;
  role: "ADMIN" | "MEMBRE";
  payerMemberId: string;
  actorMemberId: string;
  targetMemberId?: string;
}) {
  if (isOutboundContext(input.contextType) || input.direction === "OUTBOUND") {
    return input.role === "ADMIN";
  }

  if (input.role === "ADMIN") {
    return true;
  }

  if (
    input.contextType === "EPARGNE_DEPOT" ||
    input.contextType === "EPARGNE_RETRAIT"
  ) {
    return input.actorMemberId === input.payerMemberId;
  }

  const effectiveTarget = input.targetMemberId ?? input.payerMemberId;
  return effectiveTarget === input.actorMemberId;
}
