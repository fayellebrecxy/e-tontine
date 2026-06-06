-- CreateTable
CREATE TABLE "public"."retraits_amendes_reunions" (
    "id_retrait_amende" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_groupe" UUID NOT NULL,
    "id_admin_valideur" UUID NOT NULL,
    "montant" DECIMAL(15,2) NOT NULL,
    "motif" TEXT NOT NULL,
    "date_retrait" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "retraits_amendes_reunions_pkey" PRIMARY KEY ("id_retrait_amende")
);

-- CreateIndex
CREATE INDEX "retraits_amendes_reunions_id_groupe_idx" ON "public"."retraits_amendes_reunions"("id_groupe");

-- AddForeignKey
ALTER TABLE "public"."retraits_amendes_reunions" ADD CONSTRAINT "retraits_amendes_reunions_id_groupe_fkey" FOREIGN KEY ("id_groupe") REFERENCES "public"."groupes"("id_groupe") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."retraits_amendes_reunions" ADD CONSTRAINT "retraits_amendes_reunions_id_admin_valideur_fkey" FOREIGN KEY ("id_admin_valideur") REFERENCES "public"."membres_groupe"("id_membre_groupe") ON DELETE RESTRICT ON UPDATE CASCADE;
