-- Backfill rubriques variables sans montant avant contrainte NOT NULL
UPDATE "rubriques_cotisation"
SET "montant_fixe" = 0
WHERE "montant_fixe" IS NULL;

-- DropEnum dependency
ALTER TABLE "rubriques_cotisation" DROP COLUMN "type_montant";

-- DropEnum
DROP TYPE "TypeMontant";

-- Make montant required
ALTER TABLE "rubriques_cotisation" ALTER COLUMN "montant_fixe" SET NOT NULL;
