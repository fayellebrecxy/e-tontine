-- Ancienneté prêt : valeur par défaut 0 (l'admin configure explicitement)
ALTER TABLE "public"."parametres_pret_groupe"
  ALTER COLUMN "anciennete_min_jours" SET DEFAULT 0;
