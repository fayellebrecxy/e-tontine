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

export const createGroupSchema = z
  .object({
    nom: z.string().trim().min(2, "Le nom doit contenir au moins 2 caractères.").max(64),
    description: z.string().trim().max(512).optional(),
    devise: z.string().trim().min(1).max(8).optional(),
    regles: z
      .array(
        z.object({
          type_regle: z.enum(["COTISATION", "FREQUENCE", "PENALITE_RETARD", "PENALITE_MOTIF"]),
          nom_regle: z.string().trim().min(1).max(128).optional(),
          valeur: z.string().trim().min(1).max(256),
          est_active: z.boolean().optional(),
        }),
      )
      .optional(),
  })
  .strict();

export const updateGroupSchema = z
  .object({
    nom: z.string().trim().min(2, "Le nom doit contenir au moins 2 caractères.").max(64).optional(),
    description: z.string().trim().max(512).optional().nullable(),
    devise: z.string().trim().min(1).max(8).optional(),
  })
  .strict();

export const joinInvitationSchema = z
  .object({
    nom: z.string().trim().min(2, "Le nom doit contenir au moins 2 caractères.").max(64),
    prenom: z.string().trim().min(2, "Le prénom doit contenir au moins 2 caractères.").max(64),
    telephone: z
      .string()
      .trim()
      .min(8, "Le numéro de téléphone doit contenir au moins 8 caractères.")
      .max(24, "Le numéro de téléphone est trop long."),
    photo_de_profil: z.string().trim().min(1).max(1024).nullable().optional(),
  })
  .strict();

export const updateMemberRoleSchema = z
  .object({
    role: z.enum(["ADMIN", "MEMBRE"]),
  })
  .strict();

export const updateMemberStatusSchema = z
  .object({
    statut_adhesion: z.enum(["ACTIF"]),
  })
  .strict();

export const createCycleSchema = z
  .object({
    nom_cycle: z.string().trim().min(2, "Le nom du cycle est requis.").max(128),
    duree_tour_de_gain: z.number().int().positive(),
    montant_cotisation: z.number().positive(),
    participants: z.array(z.string().uuid()).min(1),
    penalty_active: z.boolean().default(false),
    penalty_type: z.enum(["FIXE", "POURCENTAGE", "PROGRESSIVE"]).optional(),
    penalty_value: z.number().nonnegative().optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (!data.penalty_active) return;

    if (!data.penalty_type) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Le mode de penalite est requis.",
        path: ["penalty_type"],
      });
    }

    if (!data.penalty_value || data.penalty_value <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "La valeur de la penalite doit etre positive.",
        path: ["penalty_value"],
      });
    }
  });

export const updateCycleSchema = z
  .object({
    nom_cycle: z.string().trim().min(2, "Le nom du cycle est requis.").max(128),
    date_debut: z.string(),
    date_fin: z.string(),
    duree_tour_de_gain: z.number().int().positive(),
    montant_cotisation: z.number().positive(),
    participants: z.array(z.string().uuid()).min(1),
    penalty_active: z.boolean().default(false),
    penalty_type: z.enum(["FIXE", "POURCENTAGE", "PROGRESSIVE"]).nullable().optional(),
    penalty_value: z.number().nonnegative().nullable().optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    const start = new Date(data.date_debut);
    const end = new Date(data.date_fin);

    if (Number.isNaN(start.getTime())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "La date de debut est invalide.",
        path: ["date_debut"],
      });
    }

    if (Number.isNaN(end.getTime())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "La date de fin est invalide.",
        path: ["date_fin"],
      });
    }

    if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && end <= start) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "La date de fin doit etre apres la date de debut.",
        path: ["date_fin"],
      });
    }

    if (!data.penalty_active) return;

    if (!data.penalty_type) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Le mode de penalite est requis.",
        path: ["penalty_type"],
      });
    }

    if (!data.penalty_value || data.penalty_value <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "La valeur de la penalite doit etre positive.",
        path: ["penalty_value"],
      });
    }
  });

export const createCyclePaymentSchema = z
  .object({
    id_membre_groupe: z.string().uuid(),
    montant: z.number().positive(),
    date_paiement: z.string().optional(),
    numero_tour: z.number().int().positive().optional(),
  })
  .strict();

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

export const createVersementSchema = z
  .object({
    numero_tour: z.number().int().positive("Le numéro de tour est requis."),
    montant_verse: z.number().positive("Le montant versé doit être positif."),
    mode_versement: z.enum(["VIREMENT", "ESPECES", "MOBILE_MONEY", "CHEQUE"]).optional(),
    reference_externe: z.string().trim().max(256).optional(),
    date_versement: z.string().optional(),
  })
  .strict();

export type CreateVersementInput = z.infer<typeof createVersementSchema>;

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
