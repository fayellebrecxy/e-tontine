"use server";

import { z } from "zod";
import { headers } from "next/headers";

import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  normalizeEmail,
  normalizeName,
  normalizeNextPath,
  normalizePhone,
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
  updatePasswordSchema,
} from "@/lib/validations";

type AuthActionResult =
  | { ok: true; redirectTo: string; message?: string }
  | { ok: false; error: string };

async function getOrigin() {
  const headerStore = await headers();
  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    headerStore.get("origin") ??
    `http://${headerStore.get("host") ?? "localhost:3000"}`
  );
}

export async function signInAction(
  input: z.infer<typeof signInSchema> & { next?: string },
): Promise<AuthActionResult> {
  const parsed = signInSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: "Invalid input." };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { ok: false as const, error: "Missing Supabase environment variables." };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: normalizeEmail(parsed.data.email),
    password: parsed.data.password,
  });

  if (error) {
    return { ok: false as const, error: error.message };
  }

  return { ok: true as const, redirectTo: normalizeNextPath(input.next) };
}

export async function signUpAction(input: z.infer<typeof signUpSchema>): Promise<AuthActionResult> {
  const parsed = signUpSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: "Invalid input." };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { ok: false as const, error: "Missing Supabase environment variables." };
  }

  const email = normalizeEmail(parsed.data.email);
  const telephone = normalizePhone(parsed.data.telephone);
  const existingPhone = await prisma.user.findUnique({ where: { telephone } });

  if (existingPhone) {
    return { ok: false as const, error: "Ce numéro de téléphone est déjà utilisé." };
  }

  const origin = await getOrigin();
  const { data, error } = await supabase.auth.signUp({
    email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=/dashboard`,
      data: {
        nom: normalizeName(parsed.data.nom),
        prenom: normalizeName(parsed.data.prenom),
        telephone,
      },
    },
  });

  if (error) {
    return { ok: false as const, error: error.message };
  }

  const user = data.user;
  if (user) {
    await prisma.user.upsert({
      where: { id_user: user.id },
      update: {
        email,
        nom: normalizeName(parsed.data.nom),
        prenom: normalizeName(parsed.data.prenom),
        telephone,
      },
      create: {
        id_user: user.id,
        nom: normalizeName(parsed.data.nom),
        prenom: normalizeName(parsed.data.prenom),
        email,
        telephone,
      },
    });
  }

  return {
    ok: true as const,
    redirectTo: data.session ? "/dashboard" : "/auth/login",
    message: data.session
      ? "Compte créé."
      : "Compte créé. Vérifie ton email pour confirmer ton inscription.",
  };
}

export async function resetPasswordAction(
  input: z.infer<typeof resetPasswordSchema>,
): Promise<AuthActionResult> {
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: "Invalid input." };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { ok: false as const, error: "Missing Supabase environment variables." };
  }

  const origin = await getOrigin();
  const { error } = await supabase.auth.resetPasswordForEmail(normalizeEmail(parsed.data.email), {
    redirectTo: `${origin}/auth/callback?next=/auth/update-password`,
  });

  if (error) {
    return { ok: false as const, error: error.message };
  }

  return {
    ok: true as const,
    redirectTo: "/auth/login",
    message: "Si l'adresse existe, un lien de réinitialisation a été envoyé.",
  };
}

export async function updatePasswordAction(
  input: z.infer<typeof updatePasswordSchema>,
): Promise<AuthActionResult> {
  const parsed = updatePasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: "Invalid input." };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { ok: false as const, error: "Missing Supabase environment variables." };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });

  if (error) {
    return { ok: false as const, error: error.message };
  }

  return {
    ok: true as const,
    redirectTo: "/dashboard",
    message: "Mot de passe mis à jour.",
  };
}
