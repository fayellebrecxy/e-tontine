CREATE TYPE "public"."TypeCaisseFinanciere" AS ENUM (
  'GENERALE',
  'CYCLE',
  'RUBRIQUE',
  'AMENDES_REUNION',
  'PENALITES_CYCLE'
);

CREATE TYPE "public"."TypeMouvementFinancier" AS ENUM (
  'ENTREE',
  'SORTIE',
  'CORRECTION'
);

CREATE TYPE "public"."SourceMouvementFinancier" AS ENUM (
  'COTISATION_CYCLE',
  'VERSEMENT_BENEFICIAIRE',
  'PAIEMENT_RUBRIQUE',
  'RETRAIT_RUBRIQUE',
  'AMENDE_REUNION',
  'RETRAIT_AMENDES_REUNION',
  'PENALITE_CYCLE',
  'RETRAIT_PENALITE_CYCLE',
  'RETRAIT_GENERAL',
  'VERSEMENT_POT'
);

CREATE TYPE "public"."StatutMouvementFinancier" AS ENUM (
  'VALIDE',
  'ANNULE'
);

CREATE TABLE "public"."caisses_financieres" (
  "id_caisse" UUID NOT NULL DEFAULT gen_random_uuid(),
  "id_groupe" UUID NOT NULL,
  "type_caisse" "public"."TypeCaisseFinanciere" NOT NULL,
  "nom" TEXT NOT NULL,
  "reference_key" TEXT NOT NULL,
  "id_cycle" UUID,
  "id_rubrique" UUID,
  "solde_actuel" DECIMAL(15,2) NOT NULL DEFAULT 0,
  "date_creation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "caisses_financieres_pkey" PRIMARY KEY ("id_caisse")
);

CREATE TABLE "public"."mouvements_financiers" (
  "id_mouvement" UUID NOT NULL DEFAULT gen_random_uuid(),
  "id_groupe" UUID NOT NULL,
  "id_caisse" UUID NOT NULL,
  "type_mouvement" "public"."TypeMouvementFinancier" NOT NULL,
  "source" "public"."SourceMouvementFinancier" NOT NULL,
  "montant" DECIMAL(15,2) NOT NULL,
  "motif" TEXT NOT NULL,
  "solde_avant" DECIMAL(15,2) NOT NULL,
  "solde_apres" DECIMAL(15,2) NOT NULL,
  "id_admin_createur" UUID,
  "id_membre_concerne" UUID,
  "reference_type" TEXT,
  "reference_id" TEXT,
  "statut" "public"."StatutMouvementFinancier" NOT NULL DEFAULT 'VALIDE',
  "date_mouvement" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "mouvements_financiers_pkey" PRIMARY KEY ("id_mouvement")
);

CREATE UNIQUE INDEX "caisses_financieres_id_groupe_type_caisse_reference_key_key"
  ON "public"."caisses_financieres"("id_groupe", "type_caisse", "reference_key");
CREATE INDEX "caisses_financieres_id_groupe_idx" ON "public"."caisses_financieres"("id_groupe");
CREATE INDEX "caisses_financieres_id_cycle_idx" ON "public"."caisses_financieres"("id_cycle");
CREATE INDEX "caisses_financieres_id_rubrique_idx" ON "public"."caisses_financieres"("id_rubrique");
CREATE INDEX "mouvements_financiers_id_groupe_date_mouvement_idx"
  ON "public"."mouvements_financiers"("id_groupe", "date_mouvement");
CREATE INDEX "mouvements_financiers_id_caisse_date_mouvement_idx"
  ON "public"."mouvements_financiers"("id_caisse", "date_mouvement");
CREATE INDEX "mouvements_financiers_id_membre_concerne_idx"
  ON "public"."mouvements_financiers"("id_membre_concerne");
CREATE INDEX "mouvements_financiers_source_reference_id_idx"
  ON "public"."mouvements_financiers"("source", "reference_id");

ALTER TABLE "public"."caisses_financieres"
  ADD CONSTRAINT "caisses_financieres_id_groupe_fkey"
  FOREIGN KEY ("id_groupe") REFERENCES "public"."groupes"("id_groupe") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."caisses_financieres"
  ADD CONSTRAINT "caisses_financieres_id_cycle_fkey"
  FOREIGN KEY ("id_cycle") REFERENCES "public"."cycles_tontine"("id_cycle") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."caisses_financieres"
  ADD CONSTRAINT "caisses_financieres_id_rubrique_fkey"
  FOREIGN KEY ("id_rubrique") REFERENCES "public"."rubriques_cotisation"("id_rubrique") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."mouvements_financiers"
  ADD CONSTRAINT "mouvements_financiers_id_groupe_fkey"
  FOREIGN KEY ("id_groupe") REFERENCES "public"."groupes"("id_groupe") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."mouvements_financiers"
  ADD CONSTRAINT "mouvements_financiers_id_caisse_fkey"
  FOREIGN KEY ("id_caisse") REFERENCES "public"."caisses_financieres"("id_caisse") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."mouvements_financiers"
  ADD CONSTRAINT "mouvements_financiers_id_admin_createur_fkey"
  FOREIGN KEY ("id_admin_createur") REFERENCES "public"."membres_groupe"("id_membre_groupe") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "public"."mouvements_financiers"
  ADD CONSTRAINT "mouvements_financiers_id_membre_concerne_fkey"
  FOREIGN KEY ("id_membre_concerne") REFERENCES "public"."membres_groupe"("id_membre_groupe") ON DELETE SET NULL ON UPDATE CASCADE;
