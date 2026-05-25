import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(
  _request: NextRequest,
  ctx: { params: Promise<{ groupId: string }> },
) {
  const { groupId } = await ctx.params;

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: "Missing Supabase environment variables." },
      { status: 500 },
    );
  }

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  const authUser = data.user;

  const membership = await prisma.membreGroupe.findUnique({
    where: { id_user_id_groupe: { id_user: authUser.id, id_groupe: groupId } },
    select: { id_membre_groupe: true, statut_adhesion: true },
  });

  if (!membership) {
    return NextResponse.json({ ok: false, error: "Forbidden." }, { status: 403 });
  }

  if (membership.statut_adhesion === "ACTIF") {
    return NextResponse.json(
      { ok: false, error: "Already active." },
      { status: 409 },
    );
  }

  if (membership.statut_adhesion === "EN_ATTENTE") {
    return NextResponse.json({ ok: true, pending: true }, { status: 200 });
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.membreGroupe.update({
        where: { id_membre_groupe: membership.id_membre_groupe },
        data: { statut_adhesion: "EN_ATTENTE" },
        select: { id_membre_groupe: true },
      });

      const admins = await tx.membreGroupe.findMany({
        where: { id_groupe: groupId, role: "ADMIN", statut_adhesion: "ACTIF" },
        select: { id_user: true },
      });

      if (admins.length) {
        await tx.notificationGroupe.createMany({
          data: admins.map((admin) => ({
            id_user: admin.id_user,
            id_groupe: groupId,
            type_notification: "MEMBER_REJOIN_REQUEST",
            message: "Un membre exclu demande a reintegrer le groupe.",
          })),
        });
      }
    });

    return NextResponse.json({ ok: true, pending: true }, { status: 200 });
  } catch {
    return NextResponse.json({ ok: false, error: "Internal server error." }, { status: 500 });
  }
}
