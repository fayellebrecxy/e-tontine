import { NextResponse } from "next/server";

import { redistributeInterets } from "@/lib/pret";
import { requireAdmin } from "@/lib/pret-auth";

export async function POST(
  request: Request,
  ctx: { params: Promise<{ groupId: string }> },
) {
  const { groupId } = await ctx.params;
  const auth = await requireAdmin(groupId);
  if ("error" in auth && auth.error) return auth.error;

  const body = (await request.json().catch(() => null)) as {
    montant?: number;
    note?: string;
  } | null;

  if (!body?.montant) {
    return NextResponse.json({ ok: false, error: "Montant requis." }, { status: 400 });
  }

  const result = await redistributeInterets({
    groupId,
    adminMemberId: auth.membership!.id_membre_groupe,
    montant: body.montant,
    mode: "EQUITABLE_EPARGNE",
    note: body.note,
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
  }

  return NextResponse.json({ ok: true });
}
