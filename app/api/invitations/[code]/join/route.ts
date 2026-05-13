import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { joinInvitationSchema, normalizeEmail, normalizeName, normalizePhone } from "@/lib/validations";
import { Prisma } from "@/lib/generated/prisma/client";

export async function POST(request: NextRequest, ctx: { params: Promise<{ code: string }> }) {
  const { code } = await ctx.params;

  const parsedBody = joinInvitationSchema.safeParse(await request.json().catch(() => null));
  if (!parsedBody.success) {
    return NextResponse.json({ ok: false, error: "Invalid input." }, { status: 400 });
  }

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
  const email = authUser.email ? normalizeEmail(authUser.email) : null;
  if (!email) {
    return NextResponse.json({ ok: false, error: "Missing email in auth user." }, { status: 400 });
  }

  const invitation = await prisma.invitationGroupe.findFirst({
    where: { code, date_revocation: null },
    select: {
      id_invitation: true,
      code: true,
      id_groupe: true,
      date_creation: true,
      groupe: {
        select: { id_groupe: true, nom: true, description: true, devise: true },
      },
    },
  });

  const fallbackGroup = invitation
    ? null
    : await prisma.groupes.findUnique({
        where: { lien_invitation: code },
        select: { id_groupe: true, nom: true, description: true, devise: true },
      });

  const group = invitation?.groupe ?? fallbackGroup;
  const groupId = invitation?.id_groupe ?? fallbackGroup?.id_groupe;

  if (!group || !groupId) {
    return NextResponse.json({ ok: false, error: "Invalid invitation code." }, { status: 404 });
  }

  const nom = normalizeName(parsedBody.data.nom);
  const prenom = normalizeName(parsedBody.data.prenom);
  const telephone = normalizePhone(parsedBody.data.telephone);
  const photo_de_profil =
    parsedBody.data.photo_de_profil === undefined ? undefined : parsedBody.data.photo_de_profil;

  const existingPhone = await prisma.user.findUnique({
    where: { telephone },
    select: { id_user: true },
  });

  if (existingPhone && existingPhone.id_user !== authUser.id) {
    return NextResponse.json(
      { ok: false, error: "Ce numéro de téléphone est déjà utilisé." },
      { status: 409 },
    );
  }

  try {
    await prisma.user.upsert({
      where: { id_user: authUser.id },
      update: {
        email,
        nom,
        prenom,
        telephone,
        ...(photo_de_profil !== undefined ? { photo_de_profil } : {}),
      },
      create: {
        id_user: authUser.id,
        email,
        nom,
        prenom,
        telephone,
        photo_de_profil: photo_de_profil ?? null,
      },
    });

    const membership = await prisma.membreGroupe.create({
      data: {
        id_user: authUser.id,
        id_groupe: groupId,
        role: "MEMBRE",
        statut_adhesion: "ACTIF",
      },
      select: {
        id_membre_groupe: true,
        role: true,
        statut_adhesion: true,
        statut_visuel: true,
        date_adhesion: true,
        id_groupe: true,
      },
    });

    return NextResponse.json(
      { ok: true, groupe: group, membership },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      // Unique violation: likely membership already exists or user unique fields collision
      return NextResponse.json(
        { ok: false, error: "Vous êtes déjà membre du groupe, ou données déjà utilisées." },
        { status: 409 },
      );
    }

    return NextResponse.json({ ok: false, error: "Internal server error." }, { status: 500 });
  }
}
