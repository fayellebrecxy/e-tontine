DELETE FROM "public"."mouvements_financiers" mf
WHERE mf."source" = 'PENALITE_CYCLE'
  AND NOT EXISTS (
    SELECT 1
    FROM "public"."cotisations" c
    WHERE c."id_cotisation"::TEXT = mf."reference_id"
      AND c."penalite_collectee" = TRUE
      AND c."montant_penalite" IS NOT NULL
      AND c."montant_penalite" > 0
  );

WITH ordered AS (
  SELECT
    mf."id_mouvement",
    COALESCE(
      SUM(
        CASE
          WHEN mf."type_mouvement" = 'SORTIE' THEN -mf."montant"
          ELSE mf."montant"
        END
      ) OVER (
        PARTITION BY mf."id_caisse"
        ORDER BY mf."date_mouvement", mf."id_mouvement"
        ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING
      ),
      0
    ) AS "solde_avant_recalcule",
    COALESCE(
      SUM(
        CASE
          WHEN mf."type_mouvement" = 'SORTIE' THEN -mf."montant"
          ELSE mf."montant"
        END
      ) OVER (
        PARTITION BY mf."id_caisse"
        ORDER BY mf."date_mouvement", mf."id_mouvement"
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
      ),
      0
    ) AS "solde_apres_recalcule"
  FROM "public"."mouvements_financiers" mf
  WHERE mf."statut" = 'VALIDE'
)
UPDATE "public"."mouvements_financiers" mf
SET
  "solde_avant" = ordered."solde_avant_recalcule",
  "solde_apres" = ordered."solde_apres_recalcule"
FROM ordered
WHERE ordered."id_mouvement" = mf."id_mouvement";

UPDATE "public"."caisses_financieres" cf
SET "solde_actuel" = COALESCE(ledger."solde", 0)
FROM (
  SELECT
    cf_inner."id_caisse",
    SUM(
      CASE
        WHEN mf."type_mouvement" = 'SORTIE' THEN -mf."montant"
        ELSE mf."montant"
      END
    ) AS "solde"
  FROM "public"."caisses_financieres" cf_inner
  LEFT JOIN "public"."mouvements_financiers" mf
    ON mf."id_caisse" = cf_inner."id_caisse"
   AND mf."statut" = 'VALIDE'
  GROUP BY cf_inner."id_caisse"
) ledger
WHERE ledger."id_caisse" = cf."id_caisse";
