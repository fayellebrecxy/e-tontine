-- CreateEnum
CREATE TYPE "public"."PaymentContextType" AS ENUM (
  'CYCLE_COTISATION',
  'RUBRIQUE',
  'AMENDE_REUNION',
  'EPARGNE_DEPOT',
  'PRET_REMBOURSEMENT',
  'CYCLE_DISTRIBUTION',
  'PRET_DECAISSEMENT',
  'RUBRIQUE_RETRAIT',
  'PENALITE_RETRAIT',
  'AMENDE_RETRAIT',
  'EPARGNE_RETRAIT'
);

CREATE TYPE "public"."PaymentProvider" AS ENUM ('ORANGE_MONEY', 'MTN_MOMO');

CREATE TYPE "public"."PaymentStatut" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'CANCELLED');

CREATE TYPE "public"."PaymentDirection" AS ENUM ('INBOUND', 'OUTBOUND');

CREATE TABLE "public"."transactions_paiement" (
  "id_transaction" UUID NOT NULL DEFAULT gen_random_uuid(),
  "id_groupe" UUID NOT NULL,
  "id_membre_groupe" UUID NOT NULL,
  "context_type" "public"."PaymentContextType" NOT NULL,
  "context_id" UUID NOT NULL,
  "direction" "public"."PaymentDirection" NOT NULL DEFAULT 'INBOUND',
  "montant" DECIMAL(15, 2) NOT NULL,
  "devise" TEXT NOT NULL DEFAULT 'XAF',
  "provider" "public"."PaymentProvider" NOT NULL,
  "telephone" TEXT NOT NULL,
  "provider_reference" TEXT,
  "statut" "public"."PaymentStatut" NOT NULL DEFAULT 'PENDING',
  "message_erreur" TEXT,
  "metadata" JSONB,
  "id_resultat" TEXT,
  "date_creation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "date_confirmation" TIMESTAMP(3),

  CONSTRAINT "transactions_paiement_pkey" PRIMARY KEY ("id_transaction")
);

CREATE INDEX "transactions_paiement_id_groupe_idx" ON "public"."transactions_paiement"("id_groupe");
CREATE INDEX "transactions_paiement_id_membre_groupe_idx" ON "public"."transactions_paiement"("id_membre_groupe");
CREATE INDEX "transactions_paiement_statut_idx" ON "public"."transactions_paiement"("statut");
CREATE INDEX "transactions_paiement_date_creation_idx" ON "public"."transactions_paiement"("date_creation");

ALTER TABLE "public"."transactions_paiement"
  ADD CONSTRAINT "transactions_paiement_id_groupe_fkey"
  FOREIGN KEY ("id_groupe") REFERENCES "public"."groupes"("id_groupe") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."transactions_paiement"
  ADD CONSTRAINT "transactions_paiement_id_membre_groupe_fkey"
  FOREIGN KEY ("id_membre_groupe") REFERENCES "public"."membres_groupe"("id_membre_groupe") ON DELETE CASCADE ON UPDATE CASCADE;
