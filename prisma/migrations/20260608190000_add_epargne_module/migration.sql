CREATE TYPE "public"."StatutCompteEpargne" AS ENUM ('ACTIF', 'BLOQUE');
CREATE TYPE "public"."TypeOperationEpargne" AS ENUM ('DEPOT', 'RETRAIT');
CREATE TYPE "public"."RoleActeurEpargne" AS ENUM ('ADMIN', 'SYSTEME');
CREATE TYPE "public"."StatutSignalementEpargne" AS ENUM ('OUVERT', 'TRAITE');

CREATE TABLE "public"."comptes_epargne" (
  "id_compte" UUID NOT NULL DEFAULT gen_random_uuid(),
  "numero_compte" TEXT NOT NULL,
  "id_groupe" UUID NOT NULL,
  "id_membre_groupe" UUID NOT NULL,
  "solde_actuel" DECIMAL(15,2) NOT NULL DEFAULT 0,
  "statut" "public"."StatutCompteEpargne" NOT NULL DEFAULT 'ACTIF',
  "date_ouverture" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "date_mise_a_jour" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "comptes_epargne_pkey" PRIMARY KEY ("id_compte")
);

CREATE TABLE "public"."mouvements_epargne" (
  "id_mouvement" UUID NOT NULL DEFAULT gen_random_uuid(),
  "id_compte" UUID NOT NULL,
  "id_groupe" UUID NOT NULL,
  "id_membre_groupe" UUID NOT NULL,
  "id_operateur" UUID,
  "role_acteur" "public"."RoleActeurEpargne" NOT NULL DEFAULT 'ADMIN',
  "type_operation" "public"."TypeOperationEpargne" NOT NULL,
  "montant" DECIMAL(15,2) NOT NULL,
  "motif" TEXT NOT NULL,
  "solde_avant" DECIMAL(15,2) NOT NULL,
  "solde_apres" DECIMAL(15,2) NOT NULL,
  "date_operation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "mouvements_epargne_pkey" PRIMARY KEY ("id_mouvement")
);

CREATE TABLE "public"."signalements_epargne" (
  "id_signalement" UUID NOT NULL DEFAULT gen_random_uuid(),
  "id_compte" UUID NOT NULL,
  "id_mouvement" UUID NOT NULL,
  "id_membre_groupe" UUID NOT NULL,
  "motif" TEXT NOT NULL,
  "statut" "public"."StatutSignalementEpargne" NOT NULL DEFAULT 'OUVERT',
  "date_signalement" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "signalements_epargne_pkey" PRIMARY KEY ("id_signalement")
);

CREATE UNIQUE INDEX "comptes_epargne_numero_compte_key"
  ON "public"."comptes_epargne"("numero_compte");
CREATE UNIQUE INDEX "comptes_epargne_id_membre_groupe_key"
  ON "public"."comptes_epargne"("id_membre_groupe");
CREATE INDEX "comptes_epargne_id_groupe_idx"
  ON "public"."comptes_epargne"("id_groupe");
CREATE INDEX "comptes_epargne_id_membre_groupe_idx"
  ON "public"."comptes_epargne"("id_membre_groupe");

CREATE INDEX "mouvements_epargne_id_compte_date_operation_idx"
  ON "public"."mouvements_epargne"("id_compte", "date_operation");
CREATE INDEX "mouvements_epargne_id_groupe_date_operation_idx"
  ON "public"."mouvements_epargne"("id_groupe", "date_operation");
CREATE INDEX "mouvements_epargne_id_membre_groupe_idx"
  ON "public"."mouvements_epargne"("id_membre_groupe");
CREATE INDEX "mouvements_epargne_id_operateur_idx"
  ON "public"."mouvements_epargne"("id_operateur");

CREATE INDEX "signalements_epargne_id_compte_idx"
  ON "public"."signalements_epargne"("id_compte");
CREATE INDEX "signalements_epargne_id_mouvement_idx"
  ON "public"."signalements_epargne"("id_mouvement");
CREATE INDEX "signalements_epargne_id_membre_groupe_idx"
  ON "public"."signalements_epargne"("id_membre_groupe");

ALTER TABLE "public"."comptes_epargne"
  ADD CONSTRAINT "comptes_epargne_id_groupe_fkey"
  FOREIGN KEY ("id_groupe") REFERENCES "public"."groupes"("id_groupe") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."comptes_epargne"
  ADD CONSTRAINT "comptes_epargne_id_membre_groupe_fkey"
  FOREIGN KEY ("id_membre_groupe") REFERENCES "public"."membres_groupe"("id_membre_groupe") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."mouvements_epargne"
  ADD CONSTRAINT "mouvements_epargne_id_compte_fkey"
  FOREIGN KEY ("id_compte") REFERENCES "public"."comptes_epargne"("id_compte") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."mouvements_epargne"
  ADD CONSTRAINT "mouvements_epargne_id_groupe_fkey"
  FOREIGN KEY ("id_groupe") REFERENCES "public"."groupes"("id_groupe") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."mouvements_epargne"
  ADD CONSTRAINT "mouvements_epargne_id_membre_groupe_fkey"
  FOREIGN KEY ("id_membre_groupe") REFERENCES "public"."membres_groupe"("id_membre_groupe") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."mouvements_epargne"
  ADD CONSTRAINT "mouvements_epargne_id_operateur_fkey"
  FOREIGN KEY ("id_operateur") REFERENCES "public"."membres_groupe"("id_membre_groupe") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "public"."signalements_epargne"
  ADD CONSTRAINT "signalements_epargne_id_compte_fkey"
  FOREIGN KEY ("id_compte") REFERENCES "public"."comptes_epargne"("id_compte") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."signalements_epargne"
  ADD CONSTRAINT "signalements_epargne_id_mouvement_fkey"
  FOREIGN KEY ("id_mouvement") REFERENCES "public"."mouvements_epargne"("id_mouvement") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."signalements_epargne"
  ADD CONSTRAINT "signalements_epargne_id_membre_groupe_fkey"
  FOREIGN KEY ("id_membre_groupe") REFERENCES "public"."membres_groupe"("id_membre_groupe") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "public"."comptes_epargne" (
  "numero_compte",
  "id_groupe",
  "id_membre_groupe",
  "date_ouverture"
)
SELECT
  'EP-' || UPPER(SUBSTRING(mg."id_groupe"::TEXT, 1, 4)) || '-' || LPAD(
    ROW_NUMBER() OVER (PARTITION BY mg."id_groupe" ORDER BY mg."date_adhesion", mg."id_membre_groupe")::TEXT,
    4,
    '0'
  ),
  mg."id_groupe",
  mg."id_membre_groupe",
  CURRENT_TIMESTAMP
FROM "public"."membres_groupe" mg
WHERE mg."statut_adhesion" = 'ACTIF'
ON CONFLICT ("id_membre_groupe") DO NOTHING;
