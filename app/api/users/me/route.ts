import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { normalizeName, normalizePhone, updateMeSchema } from "@/lib/validations";
import { Prisma } from "@/lib/generated/prisma/client";

export async function PATCH(request: NextRequest) {
  const parsedBody = updateMeSchema.safeParse(await request.json().catch(() => null));
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

  const updateData: {
    nom?: string;
    prenom?: string;
    telephone?: string;
    photo_de_profil?: string | null;
  } = {};

  if (parsedBody.data.nom !== undefined) updateData.nom = normalizeName(parsedBody.data.nom);
  if (parsedBody.data.prenom !== undefined) updateData.prenom = normalizeName(parsedBody.data.prenom);
  if (parsedBody.data.telephone !== undefined)
    updateData.telephone = normalizePhone(parsedBody.data.telephone);
  if (parsedBody.data.photo_de_profil !== undefined)
    updateData.photo_de_profil = parsedBody.data.photo_de_profil;

  if (!Object.keys(updateData).length) {
    return NextResponse.json({ ok: false, error: "No updates provided." }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({
    where: { id_user: authUser.id },
    select: { id_user: true },
  });

  if (!existing) {
    return NextResponse.json({ ok: false, error: "User not found." }, { status: 404 });
  }

  try {
    const updated = await prisma.user.update({
      where: { id_user: authUser.id },
      data: updateData,
      select: {
        id_user: true,
        email: true,
        nom: true,
        prenom: true,
        telephone: true,
        photo_de_profil: true,
        date_creation: true,
        date_mise_a_jour: true,
      },
    });

    return NextResponse.json(
      { ok: true, user: updated },
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
        { ok: false, error: "Ce numéro de téléphone est déjà utilisé." },
        { status: 409 },
      );
    }

    return NextResponse.json({ ok: false, error: "Internal server error." }, { status: 500 });
  }
}
