-- Create notifications_groupe table for in-app group notifications

CREATE TABLE IF NOT EXISTS "public"."notifications_groupe" (
	"id_notification" UUID NOT NULL DEFAULT gen_random_uuid(),
	"id_user" UUID NOT NULL,
	"id_groupe" UUID,
	"type_notification" TEXT NOT NULL,
	"message" TEXT NOT NULL,
	"date_creation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
	"date_lecture" TIMESTAMP(3),
	CONSTRAINT "notifications_groupe_pkey" PRIMARY KEY ("id_notification")
);

CREATE INDEX IF NOT EXISTS "notifications_groupe_id_user_idx"
	ON "public"."notifications_groupe"("id_user");

CREATE INDEX IF NOT EXISTS "notifications_groupe_id_groupe_idx"
	ON "public"."notifications_groupe"("id_groupe");

DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'notifications_groupe_id_user_fkey'
	) THEN
		ALTER TABLE "public"."notifications_groupe"
			ADD CONSTRAINT "notifications_groupe_id_user_fkey"
			FOREIGN KEY ("id_user")
			REFERENCES "public"."users"("id_user")
			ON DELETE CASCADE
			ON UPDATE CASCADE;
	END IF;
END $$;

DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'notifications_groupe_id_groupe_fkey'
	) THEN
		ALTER TABLE "public"."notifications_groupe"
			ADD CONSTRAINT "notifications_groupe_id_groupe_fkey"
			FOREIGN KEY ("id_groupe")
			REFERENCES "public"."groupes"("id_groupe")
			ON DELETE SET NULL
			ON UPDATE CASCADE;
	END IF;
END $$;

ALTER TABLE "public"."notifications_groupe" ENABLE ROW LEVEL SECURITY;
