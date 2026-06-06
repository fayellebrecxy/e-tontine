import { NextResponse } from "next/server";
import { sendReunionReminders } from "@/lib/reunion-reminders";

/**
 * GET /api/cron/reunion-reminders
 * Protégé par un token secret (CRON_SECRET).
 * À appeler chaque jour à 8h via un cron Supabase / Vercel Cron.
 *
 * Exemple cron Vercel (vercel.json) :
 * { "crons": [{ "path": "/api/cron/reunion-reminders", "schedule": "0 7 * * *" }] }
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
    }
  }

  const result = await sendReunionReminders();
  return NextResponse.json({ ok: true, ...result });
}
