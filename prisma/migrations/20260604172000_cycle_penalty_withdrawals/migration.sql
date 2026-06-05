CREATE TABLE "public"."retraits_penalites" (
  "id_retrait_penalite" UUID NOT NULL DEFAULT gen_random_uuid(),
  "montant" DECIMAL(15,2) NOT NULL,
  "motif" TEXT NOT NULL,
  "numero_tour" INTEGER,
  "date_retrait" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "id_cycle" UUID NOT NULL,
  "id_admin_valideur" UUID NOT NULL,

  CONSTRAINT "retraits_penalites_pkey" PRIMARY KEY ("id_retrait_penalite")
);

CREATE INDEX "retraits_penalites_id_cycle_idx" ON "public"."retraits_penalites"("id_cycle");
CREATE INDEX "retraits_penalites_id_admin_valideur_idx" ON "public"."retraits_penalites"("id_admin_valideur");

ALTER TABLE "public"."retraits_penalites"
ADD CONSTRAINT "retraits_penalites_id_cycle_fkey"
FOREIGN KEY ("id_cycle") REFERENCES "public"."cycles_tontine"("id_cycle")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."retraits_penalites"
ADD CONSTRAINT "retraits_penalites_id_admin_valideur_fkey"
FOREIGN KEY ("id_admin_valideur") REFERENCES "public"."membres_groupe"("id_membre_groupe")
ON DELETE RESTRICT ON UPDATE CASCADE;
