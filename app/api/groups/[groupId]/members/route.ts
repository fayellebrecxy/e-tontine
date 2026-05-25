import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
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

  const viewerMembership = await prisma.membreGroupe.findFirst({
    where: { id_user: authUser.id, id_groupe: groupId, statut_adhesion: "ACTIF" },
    select: { id_membre_groupe: true },
  });

  if (!viewerMembership) {
    return NextResponse.json({ ok: false, error: "Forbidden." }, { status: 403 });
  }

  const members = await prisma.membreGroupe.findMany({
    where: { id_groupe: groupId },
    include: {
      user: {
        select: {
          id_user: true,
          nom: true,
          prenom: true,
          email: true,
          telephone: true,
          photo_de_profil: true,
        },
      },
    },
    orderBy: [{ role: "asc" }, { date_adhesion: "asc" }],
  });

  return NextResponse.json(
    {
      ok: true,
      members: members.map((m) => ({
        id_membre_groupe: m.id_membre_groupe,
        role: m.role,
        statut_adhesion: m.statut_adhesion,
        statut_visuel: m.statut_visuel,
        date_adhesion: m.date_adhesion,
        date_depart: m.date_depart,
        user: m.user,
      })),
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
