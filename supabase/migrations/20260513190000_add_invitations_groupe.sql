-- Add invitations_groupe table for group invites

-- CreateTable
CREATE TABLE IF NOT EXISTS "public"."invitations_groupe" (
  "id_invitation" UUID NOT NULL DEFAULT gen_random_uuid(),
  "code" TEXT NOT NULL,
  "date_creation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "date_revocation" TIMESTAMP(3),
  "id_groupe" UUID NOT NULL,
  "id_user_createur" UUID,
  CONSTRAINT "invitations_groupe_pkey" PRIMARY KEY ("id_invitation")
);

-- Unique code
CREATE UNIQUE INDEX IF NOT EXISTS "invitations_groupe_code_key" ON "public"."invitations_groupe"("code");

-- Index group
CREATE INDEX IF NOT EXISTS "invitations_groupe_id_groupe_idx" ON "public"."invitations_groupe"("id_groupe");

-- FK: invitations_groupe.id_groupe -> groupes.id_groupe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'invitations_groupe_id_groupe_fkey'
  ) THEN
    ALTER TABLE "public"."invitations_groupe"
      ADD CONSTRAINT "invitations_groupe_id_groupe_fkey"
      FOREIGN KEY ("id_groupe")
      REFERENCES "public"."groupes"("id_groupe")
      ON DELETE CASCADE
      ON UPDATE CASCADE;
  END IF;
END $$;

-- FK: invitations_groupe.id_user_createur -> users.id_user
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'invitations_groupe_id_user_createur_fkey'
  ) THEN
    ALTER TABLE "public"."invitations_groupe"
      ADD CONSTRAINT "invitations_groupe_id_user_createur_fkey"
      FOREIGN KEY ("id_user_createur")
      REFERENCES "public"."users"("id_user")
      ON DELETE SET NULL
      ON UPDATE CASCADE;
  END IF;
END $$;

-- Enable Row Level Security (consistent with other public tables)
ALTER TABLE "public"."invitations_groupe" ENABLE ROW LEVEL SECURITY;
