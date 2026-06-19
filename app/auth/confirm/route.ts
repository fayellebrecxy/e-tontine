import { createServerClient, type SetAllCookies } from "@supabase/ssr";
import type { EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";

import { normalizeNextPath } from "@/lib/validations";

/**
 * Vérifie un lien email (recovery, signup, etc.) généré via Admin generateLink
 * puis crée la session côté serveur (SSR) et redirige vers `next`.
 */
export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type") as EmailOtpType | null;
  const next = normalizeNextPath(request.nextUrl.searchParams.get("next"));

  const loginUrl = new URL("/auth/login", request.url);
  loginUrl.searchParams.set("error", "auth_link_invalid");

  if (!tokenHash || !type) {
    return NextResponse.redirect(loginUrl);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !publishableKey) {
    return NextResponse.redirect(loginUrl);
  }

  const redirectOk = NextResponse.redirect(new URL(next, request.url));

  const supabase = createServerClient(supabaseUrl, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: Parameters<SetAllCookies>[0]) {
        cookiesToSet.forEach(({ name, value, options }) => {
          redirectOk.cookies.set(name, value, options);
        });
      },
    },
  });

  const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });

  if (error) {
    return NextResponse.redirect(loginUrl);
  }

  return redirectOk;
}
