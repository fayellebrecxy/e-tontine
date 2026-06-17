-- Workflow prêts : avalistes PROPOSE → contrat → confirmation admin

ALTER TYPE "public"."StatutAvalistePret" ADD VALUE IF NOT EXISTS 'PROPOSE';
ALTER TYPE "public"."StatutAvalistePret" ADD VALUE IF NOT EXISTS 'CONTRAT_SOUMIS';

ALTER TYPE "public"."StatutPret" ADD VALUE IF NOT EXISTS 'EN_ATTENTE_CONFIRMATION_AVALISTES';

ALTER TYPE "public"."TypeMouvementPret" ADD VALUE IF NOT EXISTS 'ENVOI_DEMANDE_AVALISTES';
ALTER TYPE "public"."TypeMouvementPret" ADD VALUE IF NOT EXISTS 'CONTRAT_AVALISTE_SOUMIS';
ALTER TYPE "public"."TypeMouvementPret" ADD VALUE IF NOT EXISTS 'CONFIRMATION_AVALISTE_ADMIN';

ALTER TABLE "public"."avalistes_pret"
  ADD COLUMN IF NOT EXISTS "date_contrat" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "acceptation_saisie" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "date_confirmation_admin" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "signature_nom" TEXT;
