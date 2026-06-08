import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type HistoryVisibilityBody = {
  scope?: unknown;
  targetId?: unknown;
  clearScope?: unknown;
};

async function getCurrentUser() {
  const supabase = await createSupabaseServerClient();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;
  return user;
}

function parseBody(body: HistoryVisibilityBody | null) {
  if (!body || typeof body.scope !== "string" || typeof body.targetId !== "string") {
    return null;
  }

  const scope = body.scope.trim();
  const targetId = body.targetId.trim();

  if (!scope || !targetId) {
    return null;
  }

  return { scope, targetId };
}

function parseScopeOnly(body: HistoryVisibilityBody | null) {
  if (!body || typeof body.scope !== "string" || body.clearScope !== true) {
    return null;
  }

  const scope = body.scope.trim();
  return scope ? { scope } : null;
}

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const scope = searchParams.get("scope")?.trim();

  if (!scope) {
    return NextResponse.json({ error: "Scope requis." }, { status: 400 });
  }

  const hidden = await prisma.historiqueMasque.findMany({
    where: { id_user: user.id, scope },
    select: { target_id: true },
  });

  return NextResponse.json({
    ok: true,
    hiddenTargetIds: hidden.map((item) => item.target_id),
  });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = parseBody(
    (await request.json().catch(() => null)) as HistoryVisibilityBody | null,
  );
  if (!parsed) {
    return NextResponse.json({ error: "Scope ou cible invalide." }, { status: 400 });
  }

  await prisma.historiqueMasque.upsert({
    where: {
      id_user_scope_target_id: {
        id_user: user.id,
        scope: parsed.scope,
        target_id: parsed.targetId,
      },
    },
    update: { date_masquage: new Date() },
    create: {
      id_user: user.id,
      scope: parsed.scope,
      target_id: parsed.targetId,
    },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as HistoryVisibilityBody | null;
  const parsed = parseBody(body);
  const scopeOnly = parseScopeOnly(body);
  if (!parsed) {
    if (!scopeOnly) {
      return NextResponse.json({ error: "Scope ou cible invalide." }, { status: 400 });
    }

    await prisma.historiqueMasque.deleteMany({
      where: {
        id_user: user.id,
        scope: scopeOnly.scope,
      },
    });

    return NextResponse.json({ ok: true });
  }

  await prisma.historiqueMasque.deleteMany({
    where: {
      id_user: user.id,
      scope: parsed.scope,
      target_id: parsed.targetId,
    },
  });

  return NextResponse.json({ ok: true });
}
