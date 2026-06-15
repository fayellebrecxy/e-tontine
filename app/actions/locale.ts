"use server";

import { cookies } from "next/headers";

import { LOCALE_COOKIE, locales, type Locale } from "@/i18n/request";

export async function setLocale(locale: Locale) {
  if (!locales.includes(locale)) return;
  const store = await cookies();
  store.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}
