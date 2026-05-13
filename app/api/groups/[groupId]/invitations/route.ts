import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import crypto from "crypto";

import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Prisma } from "@/lib/generated/prisma/client";

function generateInviteCode() {
  return crypto.randomBytes(16).toString("base64url");
}

async function getOrigin(request: NextRequest) {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    request.headers.get("origin") ??
    `http://${request.headers.get("host") ?? "localhost:3000"}`
  );
}

export async function POST(
  request: NextRequest,
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
    select: { role: true },
  });

  if (!membership) {
    return NextResponse.json({ ok: false, error: "Forbidden." }, { status: 403 });
  }

  if (membership.role !== "ADMIN") {
    return NextResponse.json({ ok: false, error: "Admin only." }, { status: 403 });
  }

  for (let attempt = 0; attempt < 3; attempt++) {
    const code = generateInviteCode();

    try {
      const invitation = await prisma.invitationGroupe.create({
        data: {
          code,
          id_groupe: groupId,
          id_user_createur: authUser.id,
        },
        select: {
          id_invitation: true,
          code: true,
          date_creation: true,
          id_groupe: true,
        },
      });

      // Keep Groupes.lien_invitation as the current/default code
      await prisma.groupes.update({
        where: { id_groupe: groupId },
        data: { lien_invitation: code },
        select: { id_groupe: true },
      });

      const origin = await getOrigin(request);
      const inviteLink = `${origin}/invitations/${invitation.code}`;

      return NextResponse.json(
        { ok: true, invitation: { ...invitation, lien: inviteLink } },
        { status: 201 },
      );
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        continue;
      }

      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        (err.code === "P2025" || err.code === "P2003")
      ) {
        return NextResponse.json({ ok: false, error: "Group not found." }, { status: 404 });
      }

      return NextResponse.json({ ok: false, error: "Internal server error." }, { status: 500 });
    }
  }

  return NextResponse.json(
    { ok: false, error: "Failed to generate unique invite code." },
    { status: 500 },
  );
}
