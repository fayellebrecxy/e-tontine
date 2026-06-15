import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { normalizeNextPath } from "@/lib/validations";

/**
 * Vérifie un lien email (recovery, signup, etc.) généré via Admin generateLink
 * puis crée la session côté serveur (SSR) et redirige vers `next`.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const next = normalizeNextPath(url.searchParams.get("next"));

  if (tokenHash && type) {
    const supabase = await createSupabaseServerClient();
    const { error } = supabase
      ? await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
      : { error: new Error("Missing Supabase environment variables.") };

    if (!error) {
      return NextResponse.redirect(new URL(next, url.origin));
    }
  }

  const loginUrl = new URL("/auth/login", url.origin);
  loginUrl.searchParams.set("error", "auth_link_invalid");
  return NextResponse.redirect(loginUrl);
}
