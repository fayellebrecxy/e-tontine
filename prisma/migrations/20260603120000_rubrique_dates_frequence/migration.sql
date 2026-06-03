-- CreateEnum
CREATE TYPE "public"."TypeRubriqueCotisation" AS ENUM ('PONCTUELLE', 'RECURRENTE');

-- CreateEnum
CREATE TYPE "public"."FrequenceRubrique" AS ENUM ('UNIQUE', 'HEBDOMADAIRE', 'MENSUEL', 'TRIMESTRIEL', 'ANNUEL');

-- AlterTable
ALTER TABLE "public"."rubriques_cotisation"
ADD COLUMN "type_rubrique" "public"."TypeRubriqueCotisation" NOT NULL DEFAULT 'PONCTUELLE',
ADD COLUMN "frequence" "public"."FrequenceRubrique" NOT NULL DEFAULT 'MENSUEL',
ADD COLUMN "date_debut" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "date_fin" TIMESTAMP(3);

UPDATE "public"."rubriques_cotisation"
SET "date_debut" = "date_creation"
WHERE "date_debut" IS DISTINCT FROM "date_creation";

UPDATE "public"."rubriques_cotisation"
SET "type_rubrique" = 'PONCTUELLE',
    "frequence" = 'UNIQUE'
WHERE "date_limite" IS NOT NULL;

UPDATE "public"."rubriques_cotisation"
SET "frequence" = 'MENSUEL'
WHERE "type_rubrique" = 'RECURRENTE'
  AND ("duree" IS NULL OR "duree" = '');

UPDATE "public"."rubriques_cotisation"
SET "frequence" = 'HEBDOMADAIRE'
WHERE LOWER(COALESCE("duree", '')) LIKE '%hebdo%';

UPDATE "public"."rubriques_cotisation"
SET "frequence" = 'TRIMESTRIEL'
WHERE LOWER(COALESCE("duree", '')) LIKE '%trimestr%';

UPDATE "public"."rubriques_cotisation"
SET "frequence" = 'ANNUEL'
WHERE LOWER(COALESCE("duree", '')) LIKE '%annuel%';

UPDATE "public"."rubriques_cotisation"
SET "date_fin" = "date_limite"
WHERE "date_limite" IS NOT NULL AND "date_fin" IS NULL;
