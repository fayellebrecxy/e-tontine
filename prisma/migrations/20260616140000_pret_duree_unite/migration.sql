-- CreateEnum
CREATE TYPE "public"."UniteDureePret" AS ENUM ('JOUR', 'MOIS');

-- Add new duration columns
ALTER TABLE "public"."prets"
  ADD COLUMN "duree_unite_demandee" "public"."UniteDureePret" NOT NULL DEFAULT 'MOIS',
  ADD COLUMN "duree_valeur_demandee" INTEGER,
  ADD COLUMN "duree_unite_approuvee" "public"."UniteDureePret",
  ADD COLUMN "duree_valeur_approuvee" INTEGER;

-- Migrate existing month-based data
UPDATE "public"."prets"
SET
  "duree_valeur_demandee" = "duree_mois_demandee",
  "duree_unite_demandee" = 'MOIS';

UPDATE "public"."prets"
SET
  "duree_valeur_approuvee" = "duree_mois_approuvee",
  "duree_unite_approuvee" = 'MOIS'
WHERE "duree_mois_approuvee" IS NOT NULL;

ALTER TABLE "public"."prets"
  ALTER COLUMN "duree_valeur_demandee" SET NOT NULL;

ALTER TABLE "public"."prets"
  DROP COLUMN "duree_mois_demandee",
  DROP COLUMN "duree_mois_approuvee";
