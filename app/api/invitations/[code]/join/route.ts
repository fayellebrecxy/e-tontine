import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { joinInvitationSchema, normalizeEmail, normalizeName, normalizePhone } from "@/lib/validations";
import { Prisma } from "@/lib/generated/prisma/client";

export async function POST(request: NextRequest, ctx: { params: Promise<{ code: string }> }) {
  const { code } = await ctx.params;

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

  const currentDbUser = await prisma.user.findUnique({
    where: { id_user: authUser.id },
    select: { nom: true, prenom: true, telephone: true, photo_de_profil: true },
  });

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

  const rawBody = await request.json().catch(() => null);
  const profileComplete = Boolean(
    currentDbUser?.nom.trim() && currentDbUser.prenom.trim() && currentDbUser.telephone.trim(),
  );

  let nom: string;
  let prenom: string;
  let telephone: string;
  let photo_de_profil: string | null | undefined;

  if (rawBody === null) {
    if (!profileComplete || !currentDbUser) {
      return NextResponse.json(
        {
          ok: false,
          code: "PROFILE_INCOMPLETE",
          error:
            "Profil incomplet. Renseignez nom, prénom et téléphone pour rejoindre ce groupe.",
        },
        { status: 409 },
      );
    }

    nom = normalizeName(currentDbUser.nom);
    prenom = normalizeName(currentDbUser.prenom);
    telephone = normalizePhone(currentDbUser.telephone);
    photo_de_profil = currentDbUser.photo_de_profil;
  } else {
    const parsedBody = joinInvitationSchema.safeParse(rawBody);
    if (!parsedBody.success) {
      return NextResponse.json({ ok: false, error: "Invalid input." }, { status: 400 });
    }

    nom = normalizeName(parsedBody.data.nom);
    prenom = normalizeName(parsedBody.data.prenom);
    telephone = normalizePhone(parsedBody.data.telephone);
    photo_de_profil =
      parsedBody.data.photo_de_profil === undefined ? undefined : parsedBody.data.photo_de_profil;
  }

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

    const existingMembership = await prisma.membreGroupe.findUnique({
      where: { id_user_id_groupe: { id_user: authUser.id, id_groupe: groupId } },
      select: {
        id_membre_groupe: true,
        role: true,
        statut_adhesion: true,
        statut_visuel: true,
        date_adhesion: true,
        id_groupe: true,
      },
    });

    if (existingMembership) {
      return NextResponse.json(
        { ok: true, already_member: true, groupe: group, membership: existingMembership },
        {
          status: 200,
          headers: {
            "Cache-Control": "no-store",
          },
        },
      );
    }

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
      return NextResponse.json(
        { ok: false, error: "Données déjà utilisées ou conflit d’unicité." },
        { status: 409 },
      );
    }

    return NextResponse.json({ ok: false, error: "Internal server error." }, { status: 500 });
  }
}
