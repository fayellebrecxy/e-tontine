-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'MEMBRE', 'UTILISATEUR');

-- CreateEnum
CREATE TYPE "StatutAdhesion" AS ENUM ('ACTIF', 'INACTIF', 'EN_ATTENTE');

-- CreateEnum
CREATE TYPE "StatutVisuel" AS ENUM ('EN_LIGNE', 'HORS_LIGNE');

-- CreateTable
CREATE TABLE "users" (
    "id_user" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telephone" TEXT NOT NULL,
    "mot_de_passe" TEXT NOT NULL,
    "photo_de_profil" TEXT,
    "nom_groupe" TEXT,
    "role" "Role" NOT NULL DEFAULT 'UTILISATEUR',
    "statut_adhesion" "StatutAdhesion" NOT NULL DEFAULT 'EN_ATTENTE',
    "date_adhesion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_depart" TIMESTAMP(3),
    "statut_visuel" "StatutVisuel" NOT NULL DEFAULT 'HORS_LIGNE',

    CONSTRAINT "users_pkey" PRIMARY KEY ("id_user")
);

-- CreateTable
CREATE TABLE "groupes" (
    "id_groupe" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "devise" TEXT NOT NULL DEFAULT 'XAF',
    "lien_invitation" TEXT,
    "date_de_creation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "groupes_pkey" PRIMARY KEY ("id_groupe")
);

-- CreateTable
CREATE TABLE "cycles_tontine" (
    "id_cycle" TEXT NOT NULL,
    "nom_cycle" TEXT NOT NULL,
    "date_debut" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_fin" TIMESTAMP(3) NOT NULL,
    "duree_tour_de_gain" INTEGER NOT NULL,
    "ordre_beneficiaire" TEXT,
    "id_groupe" TEXT NOT NULL,

    CONSTRAINT "cycles_tontine_pkey" PRIMARY KEY ("id_cycle")
);

-- CreateTable
CREATE TABLE "cotisations" (
    "id_cotisation" TEXT NOT NULL,
    "date_debut" TIMESTAMP(3) NOT NULL,
    "montant" DECIMAL(15,2) NOT NULL,
    "date_de_paiement" TIMESTAMP(3) NOT NULL,
    "penalite_appliquee" BOOLEAN NOT NULL DEFAULT false,
    "montant_penalite" DECIMAL(15,2),
    "id_user" TEXT NOT NULL,
    "id_cycle" TEXT NOT NULL,

    CONSTRAINT "cotisations_pkey" PRIMARY KEY ("id_cotisation")
);

-- CreateTable
CREATE TABLE "penalites" (
    "id_penalite" TEXT NOT NULL,
    "montant_base" DECIMAL(15,2) NOT NULL,
    "motif" TEXT NOT NULL,
    "taux_augmentation_heure" DECIMAL(5,2) NOT NULL,
    "seuil_heure_augmentation" INTEGER NOT NULL,
    "date_application" TIMESTAMP(3) NOT NULL,
    "montant_final" DECIMAL(15,2) NOT NULL,
    "id_user" TEXT NOT NULL,
    "id_cotisation" TEXT NOT NULL,

    CONSTRAINT "penalites_pkey" PRIMARY KEY ("id_penalite")
);

-- CreateTable
CREATE TABLE "_UserGroupe" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_UserGroupe_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_PenaliteCotisations" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_PenaliteCotisations_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_telephone_key" ON "users"("telephone");

-- CreateIndex
CREATE UNIQUE INDEX "groupes_lien_invitation_key" ON "groupes"("lien_invitation");

-- CreateIndex
CREATE INDEX "cycles_tontine_id_groupe_idx" ON "cycles_tontine"("id_groupe");

-- CreateIndex
CREATE INDEX "cotisations_id_cycle_idx" ON "cotisations"("id_cycle");

-- CreateIndex
CREATE INDEX "penalites_id_user_idx" ON "penalites"("id_user");

-- CreateIndex
CREATE INDEX "_UserGroupe_B_index" ON "_UserGroupe"("B");

-- CreateIndex
CREATE INDEX "_PenaliteCotisations_B_index" ON "_PenaliteCotisations"("B");

-- AddForeignKey
ALTER TABLE "cycles_tontine" ADD CONSTRAINT "cycles_tontine_id_groupe_fkey" FOREIGN KEY ("id_groupe") REFERENCES "groupes"("id_groupe") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cotisations" ADD CONSTRAINT "cotisations_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "users"("id_user") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cotisations" ADD CONSTRAINT "cotisations_id_cycle_fkey" FOREIGN KEY ("id_cycle") REFERENCES "cycles_tontine"("id_cycle") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "penalites" ADD CONSTRAINT "penalites_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "users"("id_user") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "penalites" ADD CONSTRAINT "penalites_id_cotisation_fkey" FOREIGN KEY ("id_cotisation") REFERENCES "cotisations"("id_cotisation") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserGroupe" ADD CONSTRAINT "_UserGroupe_A_fkey" FOREIGN KEY ("A") REFERENCES "groupes"("id_groupe") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UserGroupe" ADD CONSTRAINT "_UserGroupe_B_fkey" FOREIGN KEY ("B") REFERENCES "users"("id_user") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PenaliteCotisations" ADD CONSTRAINT "_PenaliteCotisations_A_fkey" FOREIGN KEY ("A") REFERENCES "cotisations"("id_cotisation") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PenaliteCotisations" ADD CONSTRAINT "_PenaliteCotisations_B_fkey" FOREIGN KEY ("B") REFERENCES "penalites"("id_penalite") ON DELETE CASCADE ON UPDATE CASCADE;
