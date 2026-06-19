import { createServerClient, type SetAllCookies } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import { normalizeNextPath } from "@/lib/validations";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const next = normalizeNextPath(request.nextUrl.searchParams.get("next"));
  const redirectTo = NextResponse.redirect(new URL(next, request.url));

  if (!code) {
    return redirectTo;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !publishableKey) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("error", "auth_callback_failed");
    return NextResponse.redirect(loginUrl);
  }

  const supabase = createServerClient(supabaseUrl, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: Parameters<SetAllCookies>[0]) {
        cookiesToSet.forEach(({ name, value, options }) => {
          redirectTo.cookies.set(name, value, options);
        });
      },
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("error", "auth_callback_failed");
    return NextResponse.redirect(loginUrl);
  }

  return redirectTo;
}
