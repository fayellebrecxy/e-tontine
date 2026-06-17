import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getGroupMembership(groupId: string) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { error: NextResponse.json({ ok: false, error: "Missing env." }, { status: 500 }) };
  }

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return { error: NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 }) };
  }

  const membership = await prisma.membreGroupe.findFirst({
    where: { id_user: data.user.id, id_groupe: groupId, statut_adhesion: "ACTIF" },
    select: { id_membre_groupe: true, role: true, id_user: true },
  });

  if (!membership) {
    return { error: NextResponse.json({ ok: false, error: "Accès refusé" }, { status: 403 }) };
  }

  return { membership, user: data.user };
}

export async function requireAdmin(groupId: string) {
  const result = await getGroupMembership(groupId);
  if ("error" in result && result.error) return result;
  if (result.membership!.role !== "ADMIN") {
    return {
      error: NextResponse.json(
        { ok: false, error: "Action réservée à l'administrateur." },
        { status: 403 },
      ),
    };
  }
  return result;
}

export async function parseJsonBody<T>(request: NextRequest): Promise<T | null> {
  return (await request.json().catch(() => null)) as T | null;
}
