-- Langganan Web Push per perangkat (notifikasi di luar browser).
--
-- Dibuat manual, bukan lewat `pnpm db:sql`, karena generate terblokir konflik
-- histori migrasi yang sudah ada (lihat CONTRIBUTING.md, kanal `drizzle/manual/`).
-- Aman dijalankan berulang: tabel hanya dibuat kalau belum ada.
CREATE TABLE IF NOT EXISTS "push_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"userAgent" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"lastUsedAt" timestamp with time zone,
	CONSTRAINT "push_subscriptions_endpoint_unique" UNIQUE("endpoint")
);
