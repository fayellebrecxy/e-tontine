/*
  Warnings:

  - Added the required column `montant_cotisation` to the `cycles_tontine` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "cycles_tontine" ADD COLUMN     "montant_cotisation" DECIMAL(15,2) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "cycles_participants" (
    "id_cycle_participant" UUID NOT NULL DEFAULT gen_random_uuid(),
    "ordre" INTEGER NOT NULL,
    "date_ajout" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id_cycle" UUID NOT NULL,
    "id_membre_groupe" UUID NOT NULL,

    CONSTRAINT "cycles_participants_pkey" PRIMARY KEY ("id_cycle_participant")
);

-- CreateIndex
CREATE INDEX "cycles_participants_id_cycle_idx" ON "cycles_participants"("id_cycle");

-- CreateIndex
CREATE INDEX "cycles_participants_id_membre_groupe_idx" ON "cycles_participants"("id_membre_groupe");

-- CreateIndex
CREATE UNIQUE INDEX "cycles_participants_id_cycle_id_membre_groupe_key" ON "cycles_participants"("id_cycle", "id_membre_groupe");

-- AddForeignKey
ALTER TABLE "cycles_participants" ADD CONSTRAINT "cycles_participants_id_cycle_fkey" FOREIGN KEY ("id_cycle") REFERENCES "cycles_tontine"("id_cycle") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cycles_participants" ADD CONSTRAINT "cycles_participants_id_membre_groupe_fkey" FOREIGN KEY ("id_membre_groupe") REFERENCES "membres_groupe"("id_membre_groupe") ON DELETE CASCADE ON UPDATE CASCADE;
