ALTER TABLE "public"."rubriques_cotisation"
ADD COLUMN "duree_jours" INTEGER NOT NULL DEFAULT 1;

UPDATE "public"."rubriques_cotisation"
SET "duree_jours" = GREATEST(
  1,
  FLOOR(EXTRACT(EPOCH FROM (COALESCE("date_fin", "date_limite", "date_debut") - "date_debut")) / 86400)::INTEGER + 1
)
WHERE "date_debut" IS NOT NULL;

UPDATE "public"."rubriques_cotisation"
SET "date_fin" = "date_debut" + (("duree_jours" - 1) * INTERVAL '1 day')
WHERE "date_fin" IS NULL;
