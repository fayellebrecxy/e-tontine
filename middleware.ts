import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { normalizeNextPath } from "@/lib/auth/navigation";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { response, userId } = await updateSession(request);

  const pathname = request.nextUrl.pathname;
  const next = `${pathname}${request.nextUrl.search}`;
  const normalizedNext = normalizeNextPath(request.nextUrl.searchParams.get("next"));
  const isAuthRoute =
    pathname === "/auth/login" || pathname === "/auth/register" || pathname === "/auth/reset-password";
  const isProtected = pathname.startsWith("/dashboard") || pathname.startsWith("/account");

  if (isAuthRoute && userId) {
    return NextResponse.redirect(new URL(normalizedNext, request.url));
  }

  if (isProtected && !userId) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/auth/login";
    loginUrl.searchParams.set("next", next);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
