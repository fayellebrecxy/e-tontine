import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const notifications = await prisma.notificationGroupe.findMany({
    where: { id_user: user.id },
    orderBy: { date_creation: "desc" },
    take: 30,
    include: {
      groupe: {
        select: {
          nom: true,
        },
      },
    },
  });

  return NextResponse.json(notifications);
}

export async function DELETE() {
  const supabase = await createSupabaseServerClient();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.notificationGroupe.deleteMany({
    where: { id_user: user.id },
  });

  return NextResponse.json({ success: true });
}
