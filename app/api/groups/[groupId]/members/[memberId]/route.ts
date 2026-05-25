import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { updateMemberRoleSchema } from "@/lib/validations";

export async function PATCH(
  request: NextRequest,
  ctx: { params: Promise<{ groupId: string; memberId: string }> },
) {
  const { groupId, memberId } = await ctx.params;

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

  const viewerMembership = await prisma.membreGroupe.findUnique({
    where: { id_user_id_groupe: { id_user: authUser.id, id_groupe: groupId } },
    select: { role: true },
  });

  if (!viewerMembership) {
    return NextResponse.json({ ok: false, error: "Forbidden." }, { status: 403 });
  }

  if (viewerMembership.role !== "ADMIN") {
    return NextResponse.json({ ok: false, error: "Admin only." }, { status: 403 });
  }

  const parsedBody = updateMemberRoleSchema.safeParse(await request.json().catch(() => null));
  if (!parsedBody.success) {
    return NextResponse.json({ ok: false, error: "Invalid input." }, { status: 400 });
  }

  const { role } = parsedBody.data;

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const member = await tx.membreGroupe.findFirst({
        where: { id_membre_groupe: memberId, id_groupe: groupId },
        select: { id_membre_groupe: true, id_user: true, role: true },
      });

      if (!member) {
        return { status: 404 as const, error: "Member not found." };
      }

      if (member.id_user === authUser.id && role === "MEMBRE") {
        return { status: 409 as const, error: "Cannot change your own role." };
      }

      if (member.role === role) {
        return { status: 200 as const, member: { id_membre_groupe: memberId, role } };
      }

      if (member.role === "ADMIN" && role === "MEMBRE") {
        const adminCount = await tx.membreGroupe.count({
          where: { id_groupe: groupId, role: "ADMIN" },
        });

        if (adminCount <= 1) {
          return { status: 409 as const, error: "At least one admin is required." };
        }
      }

      const result = await tx.membreGroupe.update({
        where: { id_membre_groupe: memberId },
        data: { role },
        select: { id_membre_groupe: true, role: true },
      });

      try {
        await tx.notificationGroupe.create({
          data: {
            id_user: member.id_user,
            id_groupe: groupId,
            type_notification: "ROLE_UPDATED",
            message:
              role === "ADMIN"
                ? "Vous avez ete promu admin du groupe."
                : "Votre role dans le groupe a ete mis a jour.",
          },
        });
      } catch {
        // Best-effort notifications; do not block role updates.
      }

      return { status: 200 as const, member: result };
    });

    if ("error" in updated) {
      return NextResponse.json({ ok: false, error: updated.error }, { status: updated.status });
    }

    return NextResponse.json({ ok: true, member: updated.member }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ ok: false, error: "Internal server error." }, { status: 500 });
  }
}
