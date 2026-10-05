-- Ubah semua kolom timestamp dari `timestamp without time zone` jadi
-- `timestamp with time zone` (timestamptz).
--
-- Latar belakang: `now()` menulis UTC (TimeZone database = UTC) ke kolom
-- `timestamp without time zone`, lalu driver `postgres` v3 membacanya sebagai
-- waktu lokal. Di Asia/Jakarta setiap nilai jadi bergeser 7 jam. Diuji dengan
-- driver yang dipakai aplikasi, bukan asumsi.
--
-- `USING <kolom> AT TIME ZONE 'UTC'` wajib ada: tanpa itu Postgres menganggap
-- nilai lama sudah berzona dan tidak mengubah angkanya, jadi hasilnya tetap
-- salah 7 jam (nilai jadi lebih besar). Nilai yang ada sekarang adalah UTC, jadi
-- konversi ini benar dan tidak mengubah momen sebenarnya.
--
-- Yang SENGAJA tidak disentuh:
--   - kolom `date` (surveys.tanggal, data_warga.tgl_lahir, data_warga_import.tgl_lahir)
--     tanggal kalender tidak punya zona waktu; `timestamp` akan merusak artinya.
--   - data_warga_import dan riwayat_ks_import: tabel impor, tidak punya kolom timestamp.
--
-- Rollback:
--   alter table <t> alter column <c> type timestamp using <c> at time zone 'Asia/Jakarta';
--   (nilai lalu salah 7 jam sampai migrasi diulang, tapi tidak ada data yang hilang)
--
-- Lock: ACCESS EXCLUSIVE singkat + rewrite tabel. Tabel terbesar yang punya
-- timestamp hanya form_fields (369 baris) dan form_field_rules (143 baris),
-- jadi aman di luar jam operasional.

BEGIN;

ALTER TABLE data_warga
  ALTER COLUMN "createdAt" TYPE timestamptz USING "createdAt" AT TIME ZONE 'UTC',
  ALTER COLUMN "updatedAt" TYPE timestamptz USING "updatedAt" AT TIME ZONE 'UTC';

ALTER TABLE wilayah_kerja
  ALTER COLUMN "createdAt" TYPE timestamptz USING "createdAt" AT TIME ZONE 'UTC',
  ALTER COLUMN "updatedAt" TYPE timestamptz USING "updatedAt" AT TIME ZONE 'UTC';

ALTER TABLE fasilitas_kesehatan
  ALTER COLUMN "createdAt" TYPE timestamptz USING "createdAt" AT TIME ZONE 'UTC',
  ALTER COLUMN "updatedAt" TYPE timestamptz USING "updatedAt" AT TIME ZONE 'UTC';

ALTER TABLE users
  ALTER COLUMN "createdAt" TYPE timestamptz USING "createdAt" AT TIME ZONE 'UTC',
  ALTER COLUMN "updatedAt" TYPE timestamptz USING "updatedAt" AT TIME ZONE 'UTC';

ALTER TABLE forms
  ALTER COLUMN "createdAt" TYPE timestamptz USING "createdAt" AT TIME ZONE 'UTC',
  ALTER COLUMN "updatedAt" TYPE timestamptz USING "updatedAt" AT TIME ZONE 'UTC';

ALTER TABLE form_versions
  ALTER COLUMN "createdAt" TYPE timestamptz USING "createdAt" AT TIME ZONE 'UTC',
  ALTER COLUMN "publishedAt" TYPE timestamptz USING "publishedAt" AT TIME ZONE 'UTC',
  ALTER COLUMN "updatedAt" TYPE timestamptz USING "updatedAt" AT TIME ZONE 'UTC';

ALTER TABLE form_sections
  ALTER COLUMN "createdAt" TYPE timestamptz USING "createdAt" AT TIME ZONE 'UTC',
  ALTER COLUMN "updatedAt" TYPE timestamptz USING "updatedAt" AT TIME ZONE 'UTC';

ALTER TABLE form_fields
  ALTER COLUMN "createdAt" TYPE timestamptz USING "createdAt" AT TIME ZONE 'UTC',
  ALTER COLUMN "updatedAt" TYPE timestamptz USING "updatedAt" AT TIME ZONE 'UTC';

ALTER TABLE form_field_rules
  ALTER COLUMN "createdAt" TYPE timestamptz USING "createdAt" AT TIME ZONE 'UTC',
  ALTER COLUMN "updatedAt" TYPE timestamptz USING "updatedAt" AT TIME ZONE 'UTC';

ALTER TABLE surveys
  ALTER COLUMN "createdAt" TYPE timestamptz USING "createdAt" AT TIME ZONE 'UTC',
  ALTER COLUMN "updatedAt" TYPE timestamptz USING "updatedAt" AT TIME ZONE 'UTC';

ALTER TABLE survey_entries
  ALTER COLUMN "createdAt" TYPE timestamptz USING "createdAt" AT TIME ZONE 'UTC',
  ALTER COLUMN "updatedAt" TYPE timestamptz USING "updatedAt" AT TIME ZONE 'UTC';

ALTER TABLE audit_logs
  ALTER COLUMN "createdAt" TYPE timestamptz USING "createdAt" AT TIME ZONE 'UTC';

ALTER TABLE valid_session
  ALTER COLUMN "expiresAt" TYPE timestamptz USING "expiresAt" AT TIME ZONE 'UTC';

COMMIT;

-- Trigger set_updated_at() tidak perlu diubah: NEW."updatedAt" = now() sudah
-- timestamptz dan otomatis masuk ke kolom timestamptz. Yang perlu dipastikan
-- trigger tetap terpasang untuk 11 tabel, karena kolomnya berubah tipe.
DO $$
DECLARE
    hilang text;
BEGIN
    SELECT string_agg(nama, ', ')
      INTO hilang
      FROM unnest(ARRAY[
        'data_warga', 'wilayah_kerja', 'fasilitas_kesehatan', 'users', 'forms',
        'form_versions', 'form_sections', 'form_fields', 'form_field_rules',
        'surveys', 'survey_entries'
      ]) AS nama
     WHERE NOT EXISTS (
        SELECT 1 FROM pg_trigger tr
        WHERE tr.tgrelid = nama::regclass AND NOT tr.tgisinternal
      );
    IF hilang IS NOT NULL THEN
        RAISE EXCEPTION 'trigger set_updated_at hilang di: %', hilang;
    END IF;
END
$$;