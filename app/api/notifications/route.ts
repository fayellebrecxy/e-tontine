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
