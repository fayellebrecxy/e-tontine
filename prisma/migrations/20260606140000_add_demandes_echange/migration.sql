-- CreateEnum
CREATE TYPE "public"."StatutEchange" AS ENUM ('EN_ATTENTE', 'ACCEPTEE_MEMBRES', 'VALIDEE_ADMIN', 'REFUSEE_CIBLE', 'REFUSEE_ADMIN', 'ANNULEE');

-- CreateTable
CREATE TABLE "public"."demandes_echange" (
    "id_demande" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_cycle" UUID NOT NULL,
    "id_demandeur" UUID NOT NULL,
    "id_cible" UUID NOT NULL,
    "tour_demandeur" INTEGER NOT NULL,
    "tour_cible" INTEGER NOT NULL,
    "statut" "public"."StatutEchange" NOT NULL DEFAULT 'EN_ATTENTE',
    "note" TEXT,
    "date_demande" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_reponse" TIMESTAMP(3),

    CONSTRAINT "demandes_echange_pkey" PRIMARY KEY ("id_demande")
);

-- CreateIndex
CREATE INDEX "demandes_echange_id_cycle_idx" ON "public"."demandes_echange"("id_cycle");

-- CreateIndex
CREATE INDEX "demandes_echange_id_demandeur_idx" ON "public"."demandes_echange"("id_demandeur");

-- CreateIndex
CREATE INDEX "demandes_echange_id_cible_idx" ON "public"."demandes_echange"("id_cible");

-- AddForeignKey
ALTER TABLE "public"."demandes_echange" ADD CONSTRAINT "demandes_echange_id_cycle_fkey"
    FOREIGN KEY ("id_cycle") REFERENCES "public"."cycles_tontine"("id_cycle") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."demandes_echange" ADD CONSTRAINT "demandes_echange_id_demandeur_fkey"
    FOREIGN KEY ("id_demandeur") REFERENCES "public"."membres_groupe"("id_membre_groupe") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."demandes_echange" ADD CONSTRAINT "demandes_echange_id_cible_fkey"
    FOREIGN KEY ("id_cible") REFERENCES "public"."membres_groupe"("id_membre_groupe") ON DELETE CASCADE ON UPDATE CASCADE;
