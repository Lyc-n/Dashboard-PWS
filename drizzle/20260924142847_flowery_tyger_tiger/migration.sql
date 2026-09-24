CREATE TABLE "valid_session" (
	"uid" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"token" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "riwayat_survey" ALTER COLUMN "id" SET DATA TYPE uuid USING "id"::uuid;--> statement-breakpoint
ALTER TABLE "riwayat_survey" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "riwayat_survey" ALTER COLUMN "id" DROP IDENTITY;--> statement-breakpoint
ALTER TABLE "surveyor" ALTER COLUMN "id" SET DATA TYPE uuid USING "id"::uuid;--> statement-breakpoint
ALTER TABLE "surveyor" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "surveyor" ALTER COLUMN "id" DROP IDENTITY;