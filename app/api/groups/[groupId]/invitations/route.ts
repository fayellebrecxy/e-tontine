import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import crypto from "crypto";

import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Prisma } from "@/lib/generated/prisma/client";

function generateInviteCode() {
  return crypto.randomBytes(16).toString("base64url");
}

type AuthAdminResult =
  | { ok: true; userId: string }
  | { ok: false; response: NextResponse };

async function getOrigin(request: NextRequest) {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    request.headers.get("origin") ??
    `http://${request.headers.get("host") ?? "localhost:3000"}`
  );
}

async function getAdminUserId(groupId: string): Promise<AuthAdminResult> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, error: "Missing Supabase environment variables." },
        { status: 500 },
      ),
    };
  }

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return {
      ok: false,
      response: NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 }),
    };
  }

  const authUser = data.user;

  const membership = await prisma.membreGroupe.findUnique({
    where: { id_user_id_groupe: { id_user: authUser.id, id_groupe: groupId } },
    select: { role: true },
  });

  if (!membership) {
    return {
      ok: false,
      response: NextResponse.json({ ok: false, error: "Forbidden." }, { status: 403 }),
    };
  }

  if (membership.role !== "ADMIN") {
    return {
      ok: false,
      response: NextResponse.json({ ok: false, error: "Admin only." }, { status: 403 }),
    };
  }

  return { ok: true, userId: authUser.id };
}

async function createAndActivateInvitation(groupId: string, userId: string) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const code = generateInviteCode();

    try {
      const invitation = await prisma.$transaction(async (tx) => {
        const createdInvitation = await tx.invitationGroupe.create({
          data: {
            code,
            id_groupe: groupId,
            id_user_createur: userId,
          },
          select: {
            id_invitation: true,
            code: true,
            date_creation: true,
            id_groupe: true,
          },
        });

        // Keep Groupes.lien_invitation as the current/default code
        await tx.groupes.update({
          where: { id_groupe: groupId },
          data: { lien_invitation: code },
          select: { id_groupe: true },
        });

        return createdInvitation;
      });

      return { ok: true as const, invitation };
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        continue;
      }

      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        (err.code === "P2025" || err.code === "P2003")
      ) {
        return { ok: false as const, status: 404, error: "Group not found." };
      }

      return { ok: false as const, status: 500, error: "Internal server error." };
    }
  }

  return { ok: false as const, status: 500, error: "Failed to generate unique invite code." };
}

export async function GET(
  request: NextRequest,
  ctx: { params: Promise<{ groupId: string }> },
) {
  const { groupId } = await ctx.params;

  const auth = await getAdminUserId(groupId);
  if (!auth.ok) return auth.response;

  const groupe = await prisma.groupes.findUnique({
    where: { id_groupe: groupId },
    select: { id_groupe: true, lien_invitation: true },
  });

  if (!groupe) {
    return NextResponse.json({ ok: false, error: "Group not found." }, { status: 404 });
  }

  const currentCode = groupe.lien_invitation;
  if (!currentCode) {
    const created = await createAndActivateInvitation(groupId, auth.userId);
    if (!created.ok) {
      return NextResponse.json({ ok: false, error: created.error }, { status: created.status });
    }

    const origin = await getOrigin(request);
    const inviteLink = `${origin}/invitations/${created.invitation.code}`;
    return NextResponse.json(
      {
        ok: true,
        invitation: {
          ...created.invitation,
          lien: inviteLink,
        },
      },
      { status: 200 },
    );
  }

  const invitation = await prisma.invitationGroupe.findFirst({
    where: { code: currentCode, id_groupe: groupId, date_revocation: null },
    select: {
      id_invitation: true,
      code: true,
      date_creation: true,
      id_groupe: true,
    },
  });

  const origin = await getOrigin(request);
  const inviteLink = `${origin}/invitations/${currentCode}`;

  return NextResponse.json(
    {
      ok: true,
      invitation: invitation
        ? { ...invitation, lien: inviteLink }
        : {
            id_invitation: null,
            code: currentCode,
            date_creation: null,
            id_groupe: groupId,
            lien: inviteLink,
          },
    },
    { status: 200 },
  );
}

export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ groupId: string }> },
) {
  const { groupId } = await ctx.params;

  const auth = await getAdminUserId(groupId);
  if (!auth.ok) return auth.response;

  const created = await createAndActivateInvitation(groupId, auth.userId);
  if (!created.ok) {
    return NextResponse.json({ ok: false, error: created.error }, { status: created.status });
  }

  const origin = await getOrigin(request);
  const inviteLink = `${origin}/invitations/${created.invitation.code}`;
  return NextResponse.json(
    { ok: true, invitation: { ...created.invitation, lien: inviteLink } },
    { status: 201 },
  );
}
