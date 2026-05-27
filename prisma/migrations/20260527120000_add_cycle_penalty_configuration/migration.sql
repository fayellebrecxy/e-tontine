CREATE TYPE "ModePenalite" AS ENUM ('FIXE', 'POURCENTAGE', 'PROGRESSIVE');

ALTER TABLE "cycles_tontine"
ADD COLUMN "penalites_activees" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "mode_penalite" "ModePenalite",
ADD COLUMN "valeur_penalite" DECIMAL(15,2);

ALTER TABLE "penalites"
ADD COLUMN "mode_penalite" "ModePenalite",
ADD COLUMN "valeur_configuree" DECIMAL(15,2),
ADD COLUMN "jours_retard" INTEGER,
ADD COLUMN "date_echeance" TIMESTAMP(3);

ALTER TABLE "cotisations"
ADD COLUMN "numero_tour" INTEGER,
ADD COLUMN "date_echeance" TIMESTAMP(3);
