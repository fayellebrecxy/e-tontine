-- CreateEnum
CREATE TYPE "public"."TypeReunion" AS ENUM ('ORDINAIRE', 'EXTRAORDINAIRE', 'URGENCE');

-- CreateEnum
CREATE TYPE "public"."StatutReunion" AS ENUM ('PLANIFIEE', 'TERMINEE', 'ANNULEE');

-- CreateEnum
CREATE TYPE "public"."StatutPresence" AS ENUM ('PRESENT', 'ABSENT', 'EXCUSE', 'EN_RETARD');

-- CreateTable
CREATE TABLE "public"."reunions" (
    "id_reunion" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_groupe" UUID NOT NULL,
    "titre" TEXT NOT NULL,
    "description" TEXT,
    "date_reunion" TIMESTAMP(3) NOT NULL,
    "lieu" TEXT,
    "type_reunion" "public"."TypeReunion" NOT NULL DEFAULT 'ORDINAIRE',
    "statut" "public"."StatutReunion" NOT NULL DEFAULT 'PLANIFIEE',
    "montant_amende" DECIMAL(15,2),
    "compte_rendu" TEXT,
    "date_creation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_mise_a_jour" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reunions_pkey" PRIMARY KEY ("id_reunion")
);

-- CreateTable
CREATE TABLE "public"."presences_reunion" (
    "id_presence" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_reunion" UUID NOT NULL,
    "id_membre_groupe" UUID NOT NULL,
    "statut_presence" "public"."StatutPresence" NOT NULL DEFAULT 'ABSENT',
    "amende_payee" BOOLEAN NOT NULL DEFAULT false,
    "note_absence" TEXT,
    "date_enregistrement" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "presences_reunion_pkey" PRIMARY KEY ("id_presence")
);

-- CreateIndex
CREATE INDEX "reunions_id_groupe_idx" ON "public"."reunions"("id_groupe");

-- CreateIndex
CREATE UNIQUE INDEX "presences_reunion_id_reunion_id_membre_groupe_key" ON "public"."presences_reunion"("id_reunion", "id_membre_groupe");

-- CreateIndex
CREATE INDEX "presences_reunion_id_reunion_idx" ON "public"."presences_reunion"("id_reunion");

-- CreateIndex
CREATE INDEX "presences_reunion_id_membre_groupe_idx" ON "public"."presences_reunion"("id_membre_groupe");

-- AddForeignKey
ALTER TABLE "public"."reunions" ADD CONSTRAINT "reunions_id_groupe_fkey" FOREIGN KEY ("id_groupe") REFERENCES "public"."groupes"("id_groupe") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."presences_reunion" ADD CONSTRAINT "presences_reunion_id_reunion_fkey" FOREIGN KEY ("id_reunion") REFERENCES "public"."reunions"("id_reunion") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."presences_reunion" ADD CONSTRAINT "presences_reunion_id_membre_groupe_fkey" FOREIGN KEY ("id_membre_groupe") REFERENCES "public"."membres_groupe"("id_membre_groupe") ON DELETE CASCADE ON UPDATE CASCADE;
