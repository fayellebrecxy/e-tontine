ALTER TABLE "public"."cotisations"
  ADD COLUMN "penalite_collectee" BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE "public"."cotisations"
SET "penalite_collectee" = TRUE
WHERE "penalite_appliquee" = TRUE
  AND "montant_penalite" IS NOT NULL
  AND "montant_penalite" > 0
  AND "montant" > 0;
