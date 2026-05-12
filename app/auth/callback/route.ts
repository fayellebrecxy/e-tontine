import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { normalizeNextPath } from "@/lib/validations";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = normalizeNextPath(url.searchParams.get("next"));

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = supabase
      ? await supabase.auth.exchangeCodeForSession(code)
      : { error: new Error("Missing Supabase environment variables.") };

    if (error) {
      const loginUrl = new URL("/auth/login", url.origin);
      loginUrl.searchParams.set("error", "auth_callback_failed");
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
