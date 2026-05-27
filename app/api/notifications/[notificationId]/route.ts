import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ notificationId: string }> }
) {
  const { notificationId } = await params;
  const supabase = await createSupabaseServerClient();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Vérifier que la notification appartient bien à l'utilisateur
  const notification = await prisma.notificationGroupe.findUnique({
    where: { id_notification: notificationId },
  });

  if (!notification || notification.id_user !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.notificationGroupe.delete({
    where: { id_notification: notificationId },
  });

  return NextResponse.json({ success: true });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ notificationId: string }> }
) {
  const { notificationId } = await params;
  const supabase = await createSupabaseServerClient();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const notification = await prisma.notificationGroupe.findUnique({
    where: { id_notification: notificationId },
  });

  if (!notification || notification.id_user !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.notificationGroupe.update({
    where: { id_notification: notificationId },
    data: { date_lecture: new Date() },
  });

  return NextResponse.json(updated);
}
