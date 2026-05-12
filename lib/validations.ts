import { z } from "zod";

export const signInSchema = z.object({
  email: z.string().email("Please enter a valid email."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export const signUpSchema = signInSchema.extend({
  nom: z.string().trim().min(2, "Le nom doit contenir au moins 2 caractères.").max(64),
  prenom: z.string().trim().min(2, "Le prénom doit contenir au moins 2 caractères.").max(64),
  telephone: z
    .string()
    .trim()
    .min(8, "Le numéro de téléphone doit contenir au moins 8 caractères.")
    .max(24, "Le numéro de téléphone est trop long."),
});

export const resetPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email."),
});

export const updatePasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string().min(8, "Password must be at least 8 characters."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const updateMeSchema = z
  .object({
    nom: z.string().trim().min(2, "Le nom doit contenir au moins 2 caractères.").max(64).optional(),
    prenom: z
      .string()
      .trim()
      .min(2, "Le prénom doit contenir au moins 2 caractères.")
      .max(64)
      .optional(),
    telephone: z
      .string()
      .trim()
      .min(8, "Le numéro de téléphone doit contenir au moins 8 caractères.")
      .max(24, "Le numéro de téléphone est trop long.")
      .optional(),
    photo_de_profil: z.string().trim().min(1).max(1024).nullable().optional(),
  })
  .strict();

export function normalizeNextPath(next?: string | null) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/dashboard";
  }

  return next;
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function normalizePhone(telephone: string) {
  return telephone.trim().replace(/\s+/g, "");
}

export function normalizeName(name: string) {
  return name.trim().replace(/\s+/g, " ");
}
