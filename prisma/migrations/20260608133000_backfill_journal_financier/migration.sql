INSERT INTO "public"."caisses_financieres" (
  "id_groupe",
  "type_caisse",
  "nom",
  "reference_key",
  "id_cycle",
  "id_rubrique"
)
SELECT DISTINCT c."id_groupe", 'CYCLE'::"public"."TypeCaisseFinanciere", 'Cycle ' || c."nom_cycle", c."id_cycle"::TEXT, c."id_cycle", NULL::UUID
FROM "public"."cycles_tontine" c
WHERE EXISTS (SELECT 1 FROM "public"."cotisations" co WHERE co."id_cycle" = c."id_cycle")
   OR EXISTS (SELECT 1 FROM "public"."versements" v WHERE v."id_cycle" = c."id_cycle")
ON CONFLICT ("id_groupe", "type_caisse", "reference_key") DO NOTHING;

INSERT INTO "public"."caisses_financieres" (
  "id_groupe",
  "type_caisse",
  "nom",
  "reference_key",
  "id_cycle",
  "id_rubrique"
)
SELECT DISTINCT c."id_groupe", 'PENALITES_CYCLE'::"public"."TypeCaisseFinanciere", 'Pénalités ' || c."nom_cycle", c."id_cycle"::TEXT, c."id_cycle", NULL::UUID
FROM "public"."cycles_tontine" c
WHERE EXISTS (
  SELECT 1
  FROM "public"."cotisations" co
  WHERE co."id_cycle" = c."id_cycle"
    AND co."montant_penalite" IS NOT NULL
    AND co."montant_penalite" > 0
)
OR EXISTS (SELECT 1 FROM "public"."retraits_penalites" rp WHERE rp."id_cycle" = c."id_cycle")
ON CONFLICT ("id_groupe", "type_caisse", "reference_key") DO NOTHING;

INSERT INTO "public"."caisses_financieres" (
  "id_groupe",
  "type_caisse",
  "nom",
  "reference_key",
  "id_cycle",
  "id_rubrique"
)
SELECT DISTINCT r."id_groupe", 'RUBRIQUE'::"public"."TypeCaisseFinanciere", 'Rubrique ' || r."nom", r."id_rubrique"::TEXT, NULL::UUID, r."id_rubrique"
FROM "public"."rubriques_cotisation" r
WHERE EXISTS (SELECT 1 FROM "public"."paiements_rubrique" p WHERE p."id_rubrique" = r."id_rubrique")
   OR EXISTS (SELECT 1 FROM "public"."retraits" re WHERE re."id_rubrique" = r."id_rubrique")
ON CONFLICT ("id_groupe", "type_caisse", "reference_key") DO NOTHING;

INSERT INTO "public"."caisses_financieres" (
  "id_groupe",
  "type_caisse",
  "nom",
  "reference_key"
)
SELECT DISTINCT re."id_groupe", 'GENERALE'::"public"."TypeCaisseFinanciere", 'Caisse générale', re."id_groupe"::TEXT
FROM "public"."retraits" re
WHERE re."id_rubrique" IS NULL
ON CONFLICT ("id_groupe", "type_caisse", "reference_key") DO NOTHING;

INSERT INTO "public"."caisses_financieres" (
  "id_groupe",
  "type_caisse",
  "nom",
  "reference_key"
)
SELECT DISTINCT r."id_groupe", 'AMENDES_REUNION'::"public"."TypeCaisseFinanciere", 'Caisse amendes réunions', 'AMENDES_REUNION'
FROM "public"."reunions" r
WHERE EXISTS (
  SELECT 1
  FROM "public"."presences_reunion" p
  WHERE p."id_reunion" = r."id_reunion"
    AND p."amende_payee" = TRUE
)
OR EXISTS (SELECT 1 FROM "public"."retraits_amendes_reunions" ra WHERE ra."id_groupe" = r."id_groupe")
ON CONFLICT ("id_groupe", "type_caisse", "reference_key") DO NOTHING;

WITH source_movements AS (
  SELECT
    cf."id_caisse",
    p."id_paiement"::TEXT AS reference_id,
    'paiements_rubrique'::TEXT AS reference_type,
    rb."id_groupe",
    'ENTREE'::"public"."TypeMouvementFinancier" AS type_mouvement,
    'PAIEMENT_RUBRIQUE'::"public"."SourceMouvementFinancier" AS source,
    p."montant_paye" AS montant,
    'Paiement de la rubrique ' || rb."nom" AS motif,
    NULL::UUID AS id_admin_createur,
    p."id_membre_groupe" AS id_membre_concerne,
    p."date_paiement" AS date_mouvement,
    p."montant_paye" AS signed_amount
  FROM "public"."paiements_rubrique" p
  JOIN "public"."rubriques_cotisation" rb ON rb."id_rubrique" = p."id_rubrique"
  JOIN "public"."caisses_financieres" cf
    ON cf."id_groupe" = rb."id_groupe"
   AND cf."type_caisse" = 'RUBRIQUE'
   AND cf."reference_key" = rb."id_rubrique"::TEXT
  WHERE NOT EXISTS (
    SELECT 1 FROM "public"."mouvements_financiers" mf
    WHERE mf."source" = 'PAIEMENT_RUBRIQUE'
      AND mf."reference_type" = 'paiements_rubrique'
      AND mf."reference_id" = p."id_paiement"::TEXT
  )

  UNION ALL

  SELECT
    cf."id_caisse",
    re."id_retrait"::TEXT,
    'retraits',
    re."id_groupe",
    'SORTIE'::"public"."TypeMouvementFinancier",
    CASE WHEN re."id_rubrique" IS NULL
      THEN 'RETRAIT_GENERAL'::"public"."SourceMouvementFinancier"
      ELSE 'RETRAIT_RUBRIQUE'::"public"."SourceMouvementFinancier"
    END,
    re."montant",
    re."motif",
    re."id_admin_valideur",
    NULL::UUID,
    re."date_retrait",
    -re."montant"
  FROM "public"."retraits" re
  LEFT JOIN "public"."rubriques_cotisation" rb ON rb."id_rubrique" = re."id_rubrique"
  JOIN "public"."caisses_financieres" cf
    ON cf."id_groupe" = re."id_groupe"
   AND cf."type_caisse" = CASE WHEN re."id_rubrique" IS NULL THEN 'GENERALE'::"public"."TypeCaisseFinanciere" ELSE 'RUBRIQUE'::"public"."TypeCaisseFinanciere" END
   AND cf."reference_key" = COALESCE(re."id_rubrique"::TEXT, re."id_groupe"::TEXT)
  WHERE NOT EXISTS (
    SELECT 1 FROM "public"."mouvements_financiers" mf
    WHERE mf."reference_type" = 'retraits'
      AND mf."reference_id" = re."id_retrait"::TEXT
  )

  UNION ALL

  SELECT
    cf."id_caisse",
    co."id_cotisation"::TEXT,
    'cotisations',
    cy."id_groupe",
    'ENTREE'::"public"."TypeMouvementFinancier",
    'COTISATION_CYCLE'::"public"."SourceMouvementFinancier",
    co."montant",
    'Cotisation du tour ' || COALESCE(co."numero_tour"::TEXT, '-') || ' - ' || cy."nom_cycle",
    NULL::UUID,
    co."id_membre_groupe",
    co."date_de_paiement",
    co."montant"
  FROM "public"."cotisations" co
  JOIN "public"."cycles_tontine" cy ON cy."id_cycle" = co."id_cycle"
  JOIN "public"."caisses_financieres" cf
    ON cf."id_groupe" = cy."id_groupe"
   AND cf."type_caisse" = 'CYCLE'
   AND cf."reference_key" = cy."id_cycle"::TEXT
  WHERE co."montant" > 0
    AND NOT EXISTS (
      SELECT 1 FROM "public"."mouvements_financiers" mf
      WHERE mf."source" = 'COTISATION_CYCLE'
        AND mf."reference_type" = 'cotisations'
        AND mf."reference_id" = co."id_cotisation"::TEXT
    )

  UNION ALL

  SELECT
    cf."id_caisse",
    co."id_cotisation"::TEXT,
    'cotisations',
    cy."id_groupe",
    'ENTREE'::"public"."TypeMouvementFinancier",
    'PENALITE_CYCLE'::"public"."SourceMouvementFinancier",
    co."montant_penalite",
    'Pénalité du tour ' || COALESCE(co."numero_tour"::TEXT, '-') || ' - ' || cy."nom_cycle",
    NULL::UUID,
    co."id_membre_groupe",
    co."date_de_paiement",
    co."montant_penalite"
  FROM "public"."cotisations" co
  JOIN "public"."cycles_tontine" cy ON cy."id_cycle" = co."id_cycle"
  JOIN "public"."caisses_financieres" cf
    ON cf."id_groupe" = cy."id_groupe"
   AND cf."type_caisse" = 'PENALITES_CYCLE'
   AND cf."reference_key" = cy."id_cycle"::TEXT
  WHERE co."montant_penalite" IS NOT NULL
    AND co."montant_penalite" > 0
    AND NOT EXISTS (
      SELECT 1 FROM "public"."mouvements_financiers" mf
      WHERE mf."source" = 'PENALITE_CYCLE'
        AND mf."reference_type" = 'cotisations'
        AND mf."reference_id" = co."id_cotisation"::TEXT
    )

  UNION ALL

  SELECT
    cf."id_caisse",
    v."id_versement"::TEXT,
    'versements',
    cy."id_groupe",
    'SORTIE'::"public"."TypeMouvementFinancier",
    'VERSEMENT_BENEFICIAIRE'::"public"."SourceMouvementFinancier",
    v."montant_verse",
    'Versement au bénéficiaire du tour ' || v."numero_tour"::TEXT || ' - ' || cy."nom_cycle",
    v."id_admin_valideur",
    v."id_beneficiaire",
    v."date_versement",
    -v."montant_verse"
  FROM "public"."versements" v
  JOIN "public"."cycles_tontine" cy ON cy."id_cycle" = v."id_cycle"
  JOIN "public"."caisses_financieres" cf
    ON cf."id_groupe" = cy."id_groupe"
   AND cf."type_caisse" = 'CYCLE'
   AND cf."reference_key" = cy."id_cycle"::TEXT
  WHERE NOT EXISTS (
    SELECT 1 FROM "public"."mouvements_financiers" mf
    WHERE mf."source" = 'VERSEMENT_BENEFICIAIRE'
      AND mf."reference_type" = 'versements'
      AND mf."reference_id" = v."id_versement"::TEXT
  )

  UNION ALL

  SELECT
    cf."id_caisse",
    p."id_presence"::TEXT,
    'presences_reunion',
    r."id_groupe",
    'ENTREE'::"public"."TypeMouvementFinancier",
    'AMENDE_REUNION'::"public"."SourceMouvementFinancier",
    r."montant_amende",
    'Amende payée - ' || r."titre",
    NULL::UUID,
    p."id_membre_groupe",
    p."date_enregistrement",
    r."montant_amende"
  FROM "public"."presences_reunion" p
  JOIN "public"."reunions" r ON r."id_reunion" = p."id_reunion"
  JOIN "public"."caisses_financieres" cf
    ON cf."id_groupe" = r."id_groupe"
   AND cf."type_caisse" = 'AMENDES_REUNION'
   AND cf."reference_key" = 'AMENDES_REUNION'
  WHERE p."amende_payee" = TRUE
    AND r."montant_amende" IS NOT NULL
    AND r."montant_amende" > 0
    AND NOT EXISTS (
      SELECT 1 FROM "public"."mouvements_financiers" mf
      WHERE mf."source" = 'AMENDE_REUNION'
        AND mf."reference_type" = 'presences_reunion'
        AND mf."reference_id" = p."id_presence"::TEXT
    )

  UNION ALL

  SELECT
    cf."id_caisse",
    ra."id_retrait_amende"::TEXT,
    'retraits_amendes_reunions',
    ra."id_groupe",
    'SORTIE'::"public"."TypeMouvementFinancier",
    'RETRAIT_AMENDES_REUNION'::"public"."SourceMouvementFinancier",
    ra."montant",
    ra."motif",
    ra."id_admin_valideur",
    NULL::UUID,
    ra."date_retrait",
    -ra."montant"
  FROM "public"."retraits_amendes_reunions" ra
  JOIN "public"."caisses_financieres" cf
    ON cf."id_groupe" = ra."id_groupe"
   AND cf."type_caisse" = 'AMENDES_REUNION'
   AND cf."reference_key" = 'AMENDES_REUNION'
  WHERE NOT EXISTS (
    SELECT 1 FROM "public"."mouvements_financiers" mf
    WHERE mf."source" = 'RETRAIT_AMENDES_REUNION'
      AND mf."reference_type" = 'retraits_amendes_reunions'
      AND mf."reference_id" = ra."id_retrait_amende"::TEXT
  )

  UNION ALL

  SELECT
    cf."id_caisse",
    rp."id_retrait_penalite"::TEXT,
    'retraits_penalites',
    cy."id_groupe",
    'SORTIE'::"public"."TypeMouvementFinancier",
    'RETRAIT_PENALITE_CYCLE'::"public"."SourceMouvementFinancier",
    rp."montant",
    rp."motif",
    rp."id_admin_valideur",
    NULL::UUID,
    rp."date_retrait",
    -rp."montant"
  FROM "public"."retraits_penalites" rp
  JOIN "public"."cycles_tontine" cy ON cy."id_cycle" = rp."id_cycle"
  JOIN "public"."caisses_financieres" cf
    ON cf."id_groupe" = cy."id_groupe"
   AND cf."type_caisse" = 'PENALITES_CYCLE'
   AND cf."reference_key" = cy."id_cycle"::TEXT
  WHERE NOT EXISTS (
    SELECT 1 FROM "public"."mouvements_financiers" mf
    WHERE mf."source" = 'RETRAIT_PENALITE_CYCLE'
      AND mf."reference_type" = 'retraits_penalites'
      AND mf."reference_id" = rp."id_retrait_penalite"::TEXT
  )
),
numbered AS (
  SELECT
    sm.*,
    COALESCE(
      SUM(sm."signed_amount") OVER (
        PARTITION BY sm."id_caisse"
        ORDER BY sm."date_mouvement", sm."reference_type", sm."reference_id"
        ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING
      ),
      0
    ) AS solde_avant
  FROM source_movements sm
)
INSERT INTO "public"."mouvements_financiers" (
  "id_groupe",
  "id_caisse",
  "type_mouvement",
  "source",
  "montant",
  "motif",
  "solde_avant",
  "solde_apres",
  "id_admin_createur",
  "id_membre_concerne",
  "reference_type",
  "reference_id",
  "date_mouvement"
)
SELECT
  n."id_groupe",
  n."id_caisse",
  n."type_mouvement",
  n."source",
  n."montant",
  n."motif",
  n."solde_avant",
  n."solde_avant" + n."signed_amount",
  n."id_admin_createur",
  n."id_membre_concerne",
  n."reference_type",
  n."reference_id",
  n."date_mouvement"
FROM numbered n;

UPDATE "public"."caisses_financieres" cf
SET "solde_actuel" = COALESCE(ledger."solde", 0)
FROM (
  SELECT
    mf."id_caisse",
    SUM(
      CASE
        WHEN mf."type_mouvement" = 'SORTIE' THEN -mf."montant"
        ELSE mf."montant"
      END
    ) AS "solde"
  FROM "public"."mouvements_financiers" mf
  WHERE mf."statut" = 'VALIDE'
  GROUP BY mf."id_caisse"
) ledger
WHERE ledger."id_caisse" = cf."id_caisse";
