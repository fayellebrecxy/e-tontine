-- CreateEnum
CREATE TYPE "TypeMontant" AS ENUM ('FIXE', 'VARIABLE');

-- CreateEnum
CREATE TYPE "ModeVersement" AS ENUM ('VIREMENT', 'ESPECES', 'MOBILE_MONEY', 'CHEQUE');

-- CreateTable
CREATE TABLE "rubriques_cotisation" (
    "id_rubrique" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nom" TEXT NOT NULL,
    "type_montant" "TypeMontant" NOT NULL DEFAULT 'FIXE',
    "montant_fixe" DECIMAL(15,2),
    "duree" TEXT,
    "est_obligatoire" BOOLEAN NOT NULL DEFAULT true,
    "id_groupe" UUID NOT NULL,
    "date_creation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rubriques_cotisation_pkey" PRIMARY KEY ("id_rubrique")
);

-- CreateTable
CREATE TABLE "membres_rubrique" (
    "id_membre_rubrique" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_rubrique" UUID NOT NULL,
    "id_membre_groupe" UUID NOT NULL,

    CONSTRAINT "membres_rubrique_pkey" PRIMARY KEY ("id_membre_rubrique")
);

-- CreateTable
CREATE TABLE "paiements_rubrique" (
    "id_paiement" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_rubrique" UUID NOT NULL,
    "id_membre_groupe" UUID NOT NULL,
    "montant_paye" DECIMAL(15,2) NOT NULL,
    "date_paiement" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,

    CONSTRAINT "paiements_rubrique_pkey" PRIMARY KEY ("id_paiement")
);

-- CreateTable
CREATE TABLE "retraits" (
    "id_retrait" UUID NOT NULL DEFAULT gen_random_uuid(),
    "montant" DECIMAL(15,2) NOT NULL,
    "motif" TEXT NOT NULL,
    "date_retrait" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id_groupe" UUID NOT NULL,
    "id_admin_valideur" UUID NOT NULL,

    CONSTRAINT "retraits_pkey" PRIMARY KEY ("id_retrait")
);

-- CreateTable
CREATE TABLE "versements" (
    "id_versement" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_cycle" UUID NOT NULL,
    "id_beneficiaire" UUID NOT NULL,
    "numero_tour" INTEGER NOT NULL,
    "montant_verse" DECIMAL(15,2) NOT NULL,
    "date_versement" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mode_versement" "ModeVersement",
    "reference_externe" TEXT,
    "id_admin_valideur" UUID NOT NULL,

    CONSTRAINT "versements_pkey" PRIMARY KEY ("id_versement")
);

-- CreateIndex
CREATE INDEX "rubriques_cotisation_id_groupe_idx" ON "rubriques_cotisation"("id_groupe");

-- CreateIndex
CREATE UNIQUE INDEX "membres_rubrique_id_rubrique_id_membre_groupe_key" ON "membres_rubrique"("id_rubrique", "id_membre_groupe");

-- CreateIndex
CREATE INDEX "paiements_rubrique_id_rubrique_idx" ON "paiements_rubrique"("id_rubrique");

-- CreateIndex
CREATE INDEX "paiements_rubrique_id_membre_groupe_idx" ON "paiements_rubrique"("id_membre_groupe");

-- CreateIndex
CREATE INDEX "retraits_id_groupe_idx" ON "retraits"("id_groupe");

-- CreateIndex
CREATE INDEX "versements_id_cycle_idx" ON "versements"("id_cycle");

-- CreateIndex
CREATE INDEX "versements_id_beneficiaire_idx" ON "versements"("id_beneficiaire");

-- AddForeignKey
ALTER TABLE "rubriques_cotisation" ADD CONSTRAINT "rubriques_cotisation_id_groupe_fkey" FOREIGN KEY ("id_groupe") REFERENCES "groupes"("id_groupe") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membres_rubrique" ADD CONSTRAINT "membres_rubrique_id_rubrique_fkey" FOREIGN KEY ("id_rubrique") REFERENCES "rubriques_cotisation"("id_rubrique") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membres_rubrique" ADD CONSTRAINT "membres_rubrique_id_membre_groupe_fkey" FOREIGN KEY ("id_membre_groupe") REFERENCES "membres_groupe"("id_membre_groupe") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paiements_rubrique" ADD CONSTRAINT "paiements_rubrique_id_rubrique_fkey" FOREIGN KEY ("id_rubrique") REFERENCES "rubriques_cotisation"("id_rubrique") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paiements_rubrique" ADD CONSTRAINT "paiements_rubrique_id_membre_groupe_fkey" FOREIGN KEY ("id_membre_groupe") REFERENCES "membres_groupe"("id_membre_groupe") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "retraits" ADD CONSTRAINT "retraits_id_groupe_fkey" FOREIGN KEY ("id_groupe") REFERENCES "groupes"("id_groupe") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "retraits" ADD CONSTRAINT "retraits_id_admin_valideur_fkey" FOREIGN KEY ("id_admin_valideur") REFERENCES "membres_groupe"("id_membre_groupe") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "versements" ADD CONSTRAINT "versements_id_cycle_fkey" FOREIGN KEY ("id_cycle") REFERENCES "cycles_tontine"("id_cycle") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "versements" ADD CONSTRAINT "versements_id_beneficiaire_fkey" FOREIGN KEY ("id_beneficiaire") REFERENCES "membres_groupe"("id_membre_groupe") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "versements" ADD CONSTRAINT "versements_id_admin_valideur_fkey" FOREIGN KEY ("id_admin_valideur") REFERENCES "membres_groupe"("id_membre_groupe") ON DELETE RESTRICT ON UPDATE CASCADE;
