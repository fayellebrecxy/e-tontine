import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { openEpargneAccountForMember, openEpargneAccountsForGroup } from "@/lib/epargne";

const createAccountSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("CREATE_ONE"),
    memberId: z.string().uuid(),
  }),
  z.object({
    action: z.literal("CREATE_ALL"),
  }),
]);

async function getAdminMembership(groupId: string) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: NextResponse.json({ ok: false, error: "Missing env." }, { status: 500 }) };

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return { error: NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 }) };
  }

  const membership = await prisma.membreGroupe.findFirst({
    where: {
      id_user: data.user.id,
      id_groupe: groupId,
      role: "ADMIN",
      statut_adhesion: "ACTIF",
    },
    select: { id_membre_groupe: true },
  });

  if (!membership) {
    return {
      error: NextResponse.json(
        { ok: false, error: "Action non autorisée pour ce rôle" },
        { status: 403 },
      ),
    };
  }

  return { membership };
}

export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ groupId: string }> },
) {
  const { groupId } = await ctx.params;
  const auth = await getAdminMembership(groupId);
  if (auth.error) return auth.error;

  const body = createAccountSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) {
    return NextResponse.json({ ok: false, error: "Données invalides." }, { status: 400 });
  }

  if (body.data.action === "CREATE_ONE") {
    const result = await openEpargneAccountForMember({
      groupId,
      memberId: body.data.memberId,
    });

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
    }

    return NextResponse.json({
      ok: true,
      created: result.created,
      account: result.account,
    }, { status: result.created ? 201 : 200 });
  }

  const accounts = await openEpargneAccountsForGroup(groupId);

  return NextResponse.json({
    ok: true,
    createdCount: accounts.length,
  }, { status: 201 });
}
