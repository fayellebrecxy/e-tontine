-- Migration : Ajout de la table versements et de l'enum ModeVersement
-- Date : 2026-05-29

-- Création de l'enum ModeVersement
CREATE TYPE "public"."ModeVersement" AS ENUM ('VIREMENT', 'ESPECES', 'MOBILE_MONEY', 'CHEQUE');

-- Création de la table versements
CREATE TABLE "public"."versements" (
  "id_versement"      UUID        NOT NULL DEFAULT gen_random_uuid(),
  "id_cycle"          UUID        NOT NULL,
  "id_beneficiaire"   UUID        NOT NULL,
  "numero_tour"       INTEGER     NOT NULL,
  "montant_verse"     DECIMAL(15, 2) NOT NULL,
  "date_versement"    TIMESTAMPTZ NOT NULL DEFAULT now(),
  "mode_versement"    "public"."ModeVersement",
  "reference_externe" TEXT,
  "id_admin_valideur" UUID        NOT NULL,

  CONSTRAINT "versements_pkey" PRIMARY KEY ("id_versement"),
  CONSTRAINT "versements_id_cycle_fkey"
    FOREIGN KEY ("id_cycle") REFERENCES "public"."cycles_tontine"("id_cycle") ON DELETE CASCADE,
  CONSTRAINT "versements_id_beneficiaire_fkey"
    FOREIGN KEY ("id_beneficiaire") REFERENCES "public"."membres_groupe"("id_membre_groupe"),
  CONSTRAINT "versements_id_admin_valideur_fkey"
    FOREIGN KEY ("id_admin_valideur") REFERENCES "public"."membres_groupe"("id_membre_groupe")
);

-- Index pour les requêtes fréquentes
CREATE INDEX "versements_id_cycle_idx"        ON "public"."versements"("id_cycle");
CREATE INDEX "versements_id_beneficiaire_idx" ON "public"."versements"("id_beneficiaire");
