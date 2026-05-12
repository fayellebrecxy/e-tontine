-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "RoleGroupe" AS ENUM ('ADMIN', 'MEMBRE');

-- CreateEnum
CREATE TYPE "StatutAdhesion" AS ENUM ('ACTIF', 'INACTIF', 'EN_ATTENTE');

-- CreateEnum
CREATE TYPE "StatutVisuel" AS ENUM ('VERT', 'ORANGE', 'ROUGE');

-- CreateEnum
CREATE TYPE "TypeRegle" AS ENUM ('COTISATION', 'FREQUENCE', 'PENALITE_RETARD', 'PENALITE_MOTIF');

-- CreateTable
CREATE TABLE "users" (
    "id_user" UUID NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telephone" TEXT NOT NULL,
    "photo_de_profil" TEXT,
    "date_creation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_mise_a_jour" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id_user")
);

-- CreateTable
CREATE TABLE "groupes" (
    "id_groupe" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "devise" TEXT NOT NULL DEFAULT 'XAF',
    "lien_invitation" TEXT,
    "date_de_creation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_mise_a_jour" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "groupes_pkey" PRIMARY KEY ("id_groupe")
);

-- CreateTable
CREATE TABLE "membres_groupe" (
    "id_membre_groupe" UUID NOT NULL DEFAULT gen_random_uuid(),
    "role" "RoleGroupe" NOT NULL DEFAULT 'MEMBRE',
    "statut_adhesion" "StatutAdhesion" NOT NULL DEFAULT 'ACTIF',
    "date_adhesion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_depart" TIMESTAMP(3),
    "statut_visuel" "StatutVisuel" NOT NULL DEFAULT 'VERT',
    "id_user" UUID NOT NULL,
    "id_groupe" UUID NOT NULL,

    CONSTRAINT "membres_groupe_pkey" PRIMARY KEY ("id_membre_groupe")
);

-- CreateTable
CREATE TABLE "regles_groupe" (
    "id_regle" UUID NOT NULL DEFAULT gen_random_uuid(),
    "type_regle" "TypeRegle" NOT NULL,
    "nom_regle" TEXT NOT NULL,
    "valeur" TEXT NOT NULL,
    "est_active" BOOLEAN NOT NULL DEFAULT true,
    "date_debut_validite" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_fin_validite" TIMESTAMP(3),
    "id_groupe" UUID NOT NULL,

    CONSTRAINT "regles_groupe_pkey" PRIMARY KEY ("id_regle")
);

-- CreateTable
CREATE TABLE "cycles_tontine" (
    "id_cycle" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nom_cycle" TEXT NOT NULL,
    "date_debut" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_fin" TIMESTAMP(3) NOT NULL,
    "duree_tour_de_gain" INTEGER NOT NULL,
    "ordre_beneficiaire" TEXT,
    "id_groupe" UUID NOT NULL,

    CONSTRAINT "cycles_tontine_pkey" PRIMARY KEY ("id_cycle")
);

-- CreateTable
CREATE TABLE "cotisations" (
    "id_cotisation" UUID NOT NULL DEFAULT gen_random_uuid(),
    "date_debut" TIMESTAMP(3) NOT NULL,
    "montant" DECIMAL(15,2) NOT NULL,
    "date_de_paiement" TIMESTAMP(3) NOT NULL,
    "penalite_appliquee" BOOLEAN NOT NULL DEFAULT false,
    "montant_penalite" DECIMAL(15,2),
    "id_membre_groupe" UUID NOT NULL,
    "id_cycle" UUID NOT NULL,

    CONSTRAINT "cotisations_pkey" PRIMARY KEY ("id_cotisation")
);

-- CreateTable
CREATE TABLE "penalites" (
    "id_penalite" UUID NOT NULL DEFAULT gen_random_uuid(),
    "montant_base" DECIMAL(15,2) NOT NULL,
    "motif" TEXT NOT NULL,
    "taux_augmentation_heure" DECIMAL(5,2) NOT NULL,
    "seuil_heure_augmentation" INTEGER NOT NULL,
    "date_application" TIMESTAMP(3) NOT NULL,
    "montant_final" DECIMAL(15,2) NOT NULL,
    "id_membre_groupe" UUID NOT NULL,
    "id_cotisation" UUID NOT NULL,

    CONSTRAINT "penalites_pkey" PRIMARY KEY ("id_penalite")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_telephone_key" ON "users"("telephone");

-- CreateIndex
CREATE UNIQUE INDEX "groupes_lien_invitation_key" ON "groupes"("lien_invitation");

-- CreateIndex
CREATE INDEX "membres_groupe_id_groupe_idx" ON "membres_groupe"("id_groupe");

-- CreateIndex
CREATE INDEX "membres_groupe_id_user_idx" ON "membres_groupe"("id_user");

-- CreateIndex
CREATE UNIQUE INDEX "membres_groupe_id_user_id_groupe_key" ON "membres_groupe"("id_user", "id_groupe");

-- CreateIndex
CREATE INDEX "regles_groupe_id_groupe_idx" ON "regles_groupe"("id_groupe");

-- CreateIndex
CREATE INDEX "cycles_tontine_id_groupe_idx" ON "cycles_tontine"("id_groupe");

-- CreateIndex
CREATE INDEX "cotisations_id_cycle_idx" ON "cotisations"("id_cycle");

-- CreateIndex
CREATE INDEX "cotisations_id_membre_groupe_idx" ON "cotisations"("id_membre_groupe");

-- CreateIndex
CREATE INDEX "penalites_id_membre_groupe_idx" ON "penalites"("id_membre_groupe");

-- CreateIndex
CREATE INDEX "penalites_id_cotisation_idx" ON "penalites"("id_cotisation");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_id_user_auth_users_fkey" FOREIGN KEY ("id_user") REFERENCES auth.users("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membres_groupe" ADD CONSTRAINT "membres_groupe_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "users"("id_user") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membres_groupe" ADD CONSTRAINT "membres_groupe_id_groupe_fkey" FOREIGN KEY ("id_groupe") REFERENCES "groupes"("id_groupe") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regles_groupe" ADD CONSTRAINT "regles_groupe_id_groupe_fkey" FOREIGN KEY ("id_groupe") REFERENCES "groupes"("id_groupe") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cycles_tontine" ADD CONSTRAINT "cycles_tontine_id_groupe_fkey" FOREIGN KEY ("id_groupe") REFERENCES "groupes"("id_groupe") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cotisations" ADD CONSTRAINT "cotisations_id_membre_groupe_fkey" FOREIGN KEY ("id_membre_groupe") REFERENCES "membres_groupe"("id_membre_groupe") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cotisations" ADD CONSTRAINT "cotisations_id_cycle_fkey" FOREIGN KEY ("id_cycle") REFERENCES "cycles_tontine"("id_cycle") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "penalites" ADD CONSTRAINT "penalites_id_membre_groupe_fkey" FOREIGN KEY ("id_membre_groupe") REFERENCES "membres_groupe"("id_membre_groupe") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "penalites" ADD CONSTRAINT "penalites_id_cotisation_fkey" FOREIGN KEY ("id_cotisation") REFERENCES "cotisations"("id_cotisation") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Enable Row Level Security for all public tables exposed by Supabase APIs.
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "groupes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "membres_groupe" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "regles_groupe" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "cycles_tontine" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "cotisations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "penalites" ENABLE ROW LEVEL SECURITY;
