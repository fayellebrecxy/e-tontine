CREATE TABLE "public"."historiques_masques" (
  "id_masquage" UUID NOT NULL DEFAULT gen_random_uuid(),
  "id_user" UUID NOT NULL,
  "scope" TEXT NOT NULL,
  "target_id" TEXT NOT NULL,
  "date_masquage" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "historiques_masques_pkey" PRIMARY KEY ("id_masquage")
);

CREATE UNIQUE INDEX "historiques_masques_id_user_scope_target_id_key"
ON "public"."historiques_masques"("id_user", "scope", "target_id");

CREATE INDEX "historiques_masques_id_user_idx"
ON "public"."historiques_masques"("id_user");

CREATE INDEX "historiques_masques_scope_target_id_idx"
ON "public"."historiques_masques"("scope", "target_id");

ALTER TABLE "public"."historiques_masques"
ADD CONSTRAINT "historiques_masques_id_user_fkey"
FOREIGN KEY ("id_user") REFERENCES "public"."users"("id_user")
ON DELETE CASCADE ON UPDATE CASCADE;
