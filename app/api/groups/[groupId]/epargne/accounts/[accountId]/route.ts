import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";

import { Prisma } from "@/lib/generated/prisma";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const accountActionSchema = z.object({
  action: z.enum(["CLOTURER", "REOUVRIR"]),
});

async function getAdminMembership(groupId: string) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: NextResponse.json({ ok: false, error: "Missing env." }, { status: 500 }) };

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return { error: NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 }) };
  }

  const membership = await prisma.membreGroupe.findFirst({
    where: {
      id_user: data.user.id,
      id_groupe: groupId,
      role: "ADMIN",
      statut_adhesion: "ACTIF",
    },
    select: { id_membre_groupe: true },
  });

  if (!membership) {
    return {
      error: NextResponse.json(
        { ok: false, error: "Action non autorisée pour ce rôle" },
        { status: 403 },
      ),
    };
  }

  return { membership };
}

export async function PATCH(
  request: NextRequest,
  ctx: { params: Promise<{ groupId: string; accountId: string }> },
) {
  const { groupId, accountId } = await ctx.params;
  const auth = await getAdminMembership(groupId);
  if (auth.error) return auth.error;

  const body = accountActionSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) {
    return NextResponse.json({ ok: false, error: "Action invalide." }, { status: 400 });
  }

  const account = await prisma.compteEpargne.findFirst({
    where: { id_compte: accountId, id_groupe: groupId },
    select: {
      id_compte: true,
      solde_actuel: true,
      statut: true,
    },
  });

  if (!account) {
    return NextResponse.json({ ok: false, error: "Compte épargne introuvable" }, { status: 404 });
  }

  if (body.data.action === "CLOTURER") {
    if (account.statut === "CLOTURE") {
      return NextResponse.json({ ok: true, status: account.statut });
    }

    if (!new Prisma.Decimal(account.solde_actuel).equals(0)) {
      return NextResponse.json(
        { ok: false, error: "Impossible de clôturer un compte avec un solde non nul" },
        { status: 400 },
      );
    }

    const updated = await prisma.compteEpargne.update({
      where: { id_compte: account.id_compte },
      data: { statut: "CLOTURE" },
      select: { statut: true },
    });

    return NextResponse.json({ ok: true, status: updated.statut });
  }

  const updated = await prisma.compteEpargne.update({
    where: { id_compte: account.id_compte },
    data: { statut: "ACTIF" },
    select: { statut: true },
  });

  return NextResponse.json({ ok: true, status: updated.statut });
}

export async function DELETE(
  _request: NextRequest,
  ctx: { params: Promise<{ groupId: string; accountId: string }> },
) {
  const { groupId, accountId } = await ctx.params;
  const auth = await getAdminMembership(groupId);
  if (auth.error) return auth.error;

  const account = await prisma.compteEpargne.findFirst({
    where: { id_compte: accountId, id_groupe: groupId },
    select: {
      id_compte: true,
      solde_actuel: true,
      _count: { select: { mouvements: true } },
    },
  });

  if (!account) {
    return NextResponse.json({ ok: false, error: "Compte épargne introuvable" }, { status: 404 });
  }

  if (account._count.mouvements > 0) {
    return NextResponse.json(
      { ok: false, error: "Ce compte contient déjà un historique. Clôture-le plutôt que de le supprimer." },
      { status: 400 },
    );
  }

  if (!new Prisma.Decimal(account.solde_actuel).equals(0)) {
    return NextResponse.json(
      { ok: false, error: "Impossible de supprimer un compte avec un solde non nul" },
      { status: 400 },
    );
  }

  await prisma.compteEpargne.delete({ where: { id_compte: account.id_compte } });

  return NextResponse.json({ ok: true });
}
