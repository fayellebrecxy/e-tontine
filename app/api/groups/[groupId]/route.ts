import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { updateGroupSchema } from "@/lib/validations";

export async function GET(
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
    select: {
      id_membre_groupe: true,
      role: true,
      statut_adhesion: true,
      statut_visuel: true,
      date_adhesion: true,
      date_depart: true,
      groupe: {
        select: {
          id_groupe: true,
          nom: true,
          description: true,
          devise: true,
          date_de_creation: true,
          date_mise_a_jour: true,
        },
      },
    },
  });

  if (!membership) {
    return NextResponse.json({ ok: false, error: "Forbidden." }, { status: 403 });
  }

  return NextResponse.json(
    {
      ok: true,
      groupe: membership.groupe,
      membership: {
        id_membre_groupe: membership.id_membre_groupe,
        role: membership.role,
        statut_adhesion: membership.statut_adhesion,
        statut_visuel: membership.statut_visuel,
        date_adhesion: membership.date_adhesion,
        date_depart: membership.date_depart,
      },
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}

async function getAdminUserId(groupId: string) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { ok: false, error: "Missing Supabase environment variables." },
        { status: 500 },
      ),
    };
  }

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return {
      ok: false as const,
      response: NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 }),
    };
  }

  const authUser = data.user;

  const membership = await prisma.membreGroupe.findFirst({
    where: { id_user: authUser.id, id_groupe: groupId, statut_adhesion: "ACTIF" },
    select: { role: true },
  });

  if (!membership) {
    return {
      ok: false as const,
      response: NextResponse.json({ ok: false, error: "Forbidden." }, { status: 403 }),
    };
  }

  if (membership.role !== "ADMIN") {
    return {
      ok: false as const,
      response: NextResponse.json({ ok: false, error: "Admin only." }, { status: 403 }),
    };
  }

  return { ok: true as const, userId: authUser.id };
}

export async function PATCH(
  request: NextRequest,
  ctx: { params: Promise<{ groupId: string }> },
) {
  const { groupId } = await ctx.params;

  const auth = await getAdminUserId(groupId);
  if (!auth.ok) return auth.response;

  const parsedBody = updateGroupSchema.safeParse(await request.json().catch(() => null));
  if (!parsedBody.success) {
    return NextResponse.json({ ok: false, error: "Invalid input." }, { status: 400 });
  }

  const updates = parsedBody.data;
  if (!updates.nom && updates.description === undefined && !updates.devise) {
    return NextResponse.json({ ok: false, error: "No changes provided." }, { status: 400 });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const groupe = await tx.groupes.update({
        where: { id_groupe: groupId },
        data: {
          ...(updates.nom ? { nom: updates.nom.trim() } : {}),
          ...(updates.description !== undefined
            ? { description: updates.description?.trim() ?? null }
            : {}),
          ...(updates.devise ? { devise: updates.devise.trim().toUpperCase() } : {}),
        },
        select: {
          id_groupe: true,
          nom: true,
          description: true,
          devise: true,
          date_de_creation: true,
          date_mise_a_jour: true,
        },
      });

      const members = await tx.membreGroupe.findMany({
        where: { id_groupe: groupId },
        select: { id_user: true },
      });

      if (members.length) {
        await tx.notificationGroupe.createMany({
          data: members.map((member) => ({
            id_user: member.id_user,
            id_groupe: groupId,
            type_notification: "GROUP_UPDATED",
            message: `Le groupe ${groupe.nom} a ete mis a jour.`,
          })),
        });
      }

      return groupe;
    });

    return NextResponse.json({ ok: true, groupe: result }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ ok: false, error: "Internal server error." }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  ctx: { params: Promise<{ groupId: string }> },
) {
  const { groupId } = await ctx.params;

  const auth = await getAdminUserId(groupId);
  if (!auth.ok) return auth.response;

  try {
    await prisma.$transaction(async (tx) => {
      const groupe = await tx.groupes.findUnique({
        where: { id_groupe: groupId },
        select: { id_groupe: true, nom: true },
      });

      if (!groupe) {
        throw new Error("GROUP_NOT_FOUND");
      }

      const members = await tx.membreGroupe.findMany({
        where: { id_groupe: groupId },
        select: { id_user: true },
      });

      if (members.length) {
        await tx.notificationGroupe.createMany({
          data: members.map((member) => ({
            id_user: member.id_user,
            id_groupe: null,
            type_notification: "GROUP_DELETED",
            message: `Le groupe ${groupe.nom} a ete supprime.`,
          })),
        });
      }

      await tx.groupes.delete({ where: { id_groupe: groupId } });
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    if (err instanceof Error && err.message === "GROUP_NOT_FOUND") {
      return NextResponse.json({ ok: false, error: "Group not found." }, { status: 404 });
    }

    return NextResponse.json({ ok: false, error: "Internal server error." }, { status: 500 });
  }
}
