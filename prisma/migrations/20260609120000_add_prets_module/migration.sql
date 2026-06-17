-- Enums prêts
CREATE TYPE "public"."StatutPret" AS ENUM (
  'EN_ATTENTE_ANALYSE',
  'EN_ATTENTE_AVALISTES',
  'APPROUVE',
  'REFUSE',
  'ANNULE',
  'EN_COURS',
  'EN_RETARD',
  'SOLDE',
  'SOLDE_PAR_GARANTIE',
  'DEFAUT'
);

CREATE TYPE "public"."StatutAvalistePret" AS ENUM ('EN_ATTENTE', 'ACCEPTE', 'REFUSE');

CREATE TYPE "public"."TypeMouvementPret" AS ENUM (
  'DEMANDE_SOUMISE',
  'AVALISTE_PROPOSE',
  'AVALISTE_ACCEPTE',
  'AVALISTE_REFUSE',
  'ANALYSE_ADMIN',
  'APPROBATION',
  'REFUS',
  'DECAISSEMENT',
  'REMBOURSEMENT_CAPITAL',
  'REMBOURSEMENT_INTERET',
  'PASSAGE_EN_RETARD',
  'SAISIE_GARANTIE',
  'ANNULATION',
  'REDISTRIBUTION_INTERETS'
);

CREATE TYPE "public"."TypeEngagementPret" AS ENUM ('GARANTIE_EMPRUNTEUR', 'GARANTIE_AVALISTE');

-- Étendre enums existants
ALTER TYPE "public"."TypeOperationEpargne" ADD VALUE IF NOT EXISTS 'PRET_DEBIT_BANQUE';
ALTER TYPE "public"."TypeOperationEpargne" ADD VALUE IF NOT EXISTS 'PRET_CREDIT_BANQUE';
ALTER TYPE "public"."TypeOperationEpargne" ADD VALUE IF NOT EXISTS 'PRET_INTERET';
ALTER TYPE "public"."TypeOperationEpargne" ADD VALUE IF NOT EXISTS 'PRET_SAISIE_GARANTIE';
ALTER TYPE "public"."TypeOperationEpargne" ADD VALUE IF NOT EXISTS 'PRET_REDISTRIBUTION_INTERETS';

ALTER TYPE "public"."TypeCaisseFinanciere" ADD VALUE IF NOT EXISTS 'PRETS_INTERETS';

CREATE TABLE "public"."parametres_pret_groupe" (
  "id_parametres" UUID NOT NULL DEFAULT gen_random_uuid(),
  "id_groupe" UUID NOT NULL,
  "anciennete_min_jours" INTEGER NOT NULL DEFAULT 30,
  "plafond_pct_banque" DECIMAL(5,2) NOT NULL DEFAULT 100,
  "modele_contrat_avaliste" TEXT NOT NULL DEFAULT 'Je, {{avaliste_nom}}, m''engage à rembourser la dette de {{emprunteur_nom}} d''un montant de {{montant}} sur {{duree}} mois, taux {{taux}}%/mois, en cas de défaut de sa part. Date limite : {{date_fin}}.',
  "refus_sans_epargne" BOOLEAN NOT NULL DEFAULT false,
  "date_creation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "date_mise_a_jour" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "parametres_pret_groupe_pkey" PRIMARY KEY ("id_parametres")
);

CREATE TABLE "public"."prets" (
  "id_pret" UUID NOT NULL DEFAULT gen_random_uuid(),
  "id_groupe" UUID NOT NULL,
  "id_emprunteur" UUID NOT NULL,
  "statut" "public"."StatutPret" NOT NULL DEFAULT 'EN_ATTENTE_ANALYSE',
  "montant_demande" DECIMAL(15,2) NOT NULL,
  "montant_approuve" DECIMAL(15,2),
  "duree_mois_demandee" INTEGER NOT NULL,
  "duree_mois_approuvee" INTEGER,
  "taux_interet_mensuel" DECIMAL(7,4),
  "montant_interets_total" DECIMAL(15,2) NOT NULL DEFAULT 0,
  "montant_capital_restant" DECIMAL(15,2) NOT NULL DEFAULT 0,
  "montant_interets_restant" DECIMAL(15,2) NOT NULL DEFAULT 0,
  "montant_garantie_emprunteur" DECIMAL(15,2) NOT NULL DEFAULT 0,
  "motif" TEXT,
  "notes_admin" TEXT,
  "motif_refus" TEXT,
  "date_demande" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "date_approbation" TIMESTAMP(3),
  "date_decaissement" TIMESTAMP(3),
  "date_fin" TIMESTAMP(3),
  "date_mise_a_jour" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "repartition_decaissement" JSONB,
  CONSTRAINT "prets_pkey" PRIMARY KEY ("id_pret")
);

CREATE TABLE "public"."avalistes_pret" (
  "id_avaliste_pret" UUID NOT NULL DEFAULT gen_random_uuid(),
  "id_pret" UUID NOT NULL,
  "id_membre_groupe" UUID NOT NULL,
  "statut" "public"."StatutAvalistePret" NOT NULL DEFAULT 'EN_ATTENTE',
  "montant_engagement" DECIMAL(15,2) NOT NULL DEFAULT 0,
  "contrat_texte" TEXT,
  "motif_refus" TEXT,
  "propose_par_emprunteur" BOOLEAN NOT NULL DEFAULT true,
  "date_proposition" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "date_reponse" TIMESTAMP(3),
  CONSTRAINT "avalistes_pret_pkey" PRIMARY KEY ("id_avaliste_pret")
);

CREATE TABLE "public"."mouvements_pret" (
  "id_mouvement" UUID NOT NULL DEFAULT gen_random_uuid(),
  "id_pret" UUID NOT NULL,
  "id_groupe" UUID NOT NULL,
  "type_mouvement" "public"."TypeMouvementPret" NOT NULL,
  "montant" DECIMAL(15,2) NOT NULL DEFAULT 0,
  "id_operateur" UUID,
  "id_membre_concerne" UUID,
  "details" TEXT,
  "capital_restant_apres" DECIMAL(15,2),
  "interets_restants_apres" DECIMAL(15,2),
  "date_operation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "mouvements_pret_pkey" PRIMARY KEY ("id_mouvement")
);

CREATE TABLE "public"."mouvements_banque_pret" (
  "id_impact" UUID NOT NULL DEFAULT gen_random_uuid(),
  "id_mouvement_pret" UUID NOT NULL,
  "id_pret" UUID NOT NULL,
  "id_compte" UUID NOT NULL,
  "id_membre_groupe" UUID NOT NULL,
  "montant" DECIMAL(15,2) NOT NULL,
  "solde_avant" DECIMAL(15,2) NOT NULL,
  "solde_apres" DECIMAL(15,2) NOT NULL,
  "date_operation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "mouvements_banque_pret_pkey" PRIMARY KEY ("id_impact")
);

CREATE TABLE "public"."engagements_epargne" (
  "id_engagement" UUID NOT NULL DEFAULT gen_random_uuid(),
  "id_groupe" UUID NOT NULL,
  "id_compte" UUID NOT NULL,
  "id_membre_groupe" UUID NOT NULL,
  "id_pret" UUID NOT NULL,
  "type_engagement" "public"."TypeEngagementPret" NOT NULL,
  "montant_engage" DECIMAL(15,2) NOT NULL,
  "actif" BOOLEAN NOT NULL DEFAULT true,
  "date_creation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "date_liberation" TIMESTAMP(3),
  CONSTRAINT "engagements_epargne_pkey" PRIMARY KEY ("id_engagement")
);

CREATE UNIQUE INDEX "parametres_pret_groupe_id_groupe_key" ON "public"."parametres_pret_groupe"("id_groupe");
CREATE INDEX "prets_id_groupe_statut_idx" ON "public"."prets"("id_groupe", "statut");
CREATE INDEX "prets_id_emprunteur_idx" ON "public"."prets"("id_emprunteur");
CREATE UNIQUE INDEX "avalistes_pret_id_pret_id_membre_groupe_key" ON "public"."avalistes_pret"("id_pret", "id_membre_groupe");
CREATE INDEX "avalistes_pret_id_pret_idx" ON "public"."avalistes_pret"("id_pret");
CREATE INDEX "avalistes_pret_id_membre_groupe_statut_idx" ON "public"."avalistes_pret"("id_membre_groupe", "statut");
CREATE INDEX "mouvements_pret_id_pret_date_operation_idx" ON "public"."mouvements_pret"("id_pret", "date_operation");
CREATE INDEX "mouvements_pret_id_groupe_date_operation_idx" ON "public"."mouvements_pret"("id_groupe", "date_operation");
CREATE INDEX "mouvements_banque_pret_id_pret_idx" ON "public"."mouvements_banque_pret"("id_pret");
CREATE INDEX "mouvements_banque_pret_id_compte_idx" ON "public"."mouvements_banque_pret"("id_compte");
CREATE INDEX "mouvements_banque_pret_id_membre_groupe_idx" ON "public"."mouvements_banque_pret"("id_membre_groupe");
CREATE INDEX "engagements_epargne_id_compte_actif_idx" ON "public"."engagements_epargne"("id_compte", "actif");
CREATE INDEX "engagements_epargne_id_pret_idx" ON "public"."engagements_epargne"("id_pret");
CREATE INDEX "engagements_epargne_id_membre_groupe_actif_idx" ON "public"."engagements_epargne"("id_membre_groupe", "actif");

ALTER TABLE "public"."parametres_pret_groupe"
  ADD CONSTRAINT "parametres_pret_groupe_id_groupe_fkey"
  FOREIGN KEY ("id_groupe") REFERENCES "public"."groupes"("id_groupe") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."prets"
  ADD CONSTRAINT "prets_id_groupe_fkey"
  FOREIGN KEY ("id_groupe") REFERENCES "public"."groupes"("id_groupe") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "prets_id_emprunteur_fkey"
  FOREIGN KEY ("id_emprunteur") REFERENCES "public"."membres_groupe"("id_membre_groupe") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."avalistes_pret"
  ADD CONSTRAINT "avalistes_pret_id_pret_fkey"
  FOREIGN KEY ("id_pret") REFERENCES "public"."prets"("id_pret") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "avalistes_pret_id_membre_groupe_fkey"
  FOREIGN KEY ("id_membre_groupe") REFERENCES "public"."membres_groupe"("id_membre_groupe") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."mouvements_pret"
  ADD CONSTRAINT "mouvements_pret_id_pret_fkey"
  FOREIGN KEY ("id_pret") REFERENCES "public"."prets"("id_pret") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "mouvements_pret_id_operateur_fkey"
  FOREIGN KEY ("id_operateur") REFERENCES "public"."membres_groupe"("id_membre_groupe") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "public"."mouvements_banque_pret"
  ADD CONSTRAINT "mouvements_banque_pret_id_mouvement_pret_fkey"
  FOREIGN KEY ("id_mouvement_pret") REFERENCES "public"."mouvements_pret"("id_mouvement") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "mouvements_banque_pret_id_compte_fkey"
  FOREIGN KEY ("id_compte") REFERENCES "public"."comptes_epargne"("id_compte") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."engagements_epargne"
  ADD CONSTRAINT "engagements_epargne_id_groupe_fkey"
  FOREIGN KEY ("id_groupe") REFERENCES "public"."groupes"("id_groupe") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "engagements_epargne_id_compte_fkey"
  FOREIGN KEY ("id_compte") REFERENCES "public"."comptes_epargne"("id_compte") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "engagements_epargne_id_membre_groupe_fkey"
  FOREIGN KEY ("id_membre_groupe") REFERENCES "public"."membres_groupe"("id_membre_groupe") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "engagements_epargne_id_pret_fkey"
  FOREIGN KEY ("id_pret") REFERENCES "public"."prets"("id_pret") ON DELETE CASCADE ON UPDATE CASCADE;
