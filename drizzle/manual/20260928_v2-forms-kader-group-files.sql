-- Form v2: dua form bawaan, role kader, repeat group, dan multi-file.
--
-- ditulis manual, bukan lewat `drizzle-kit push`, karena:
--   1. `push` ikut menanyakan 26 perubahan lama yang tidak ada hubungannya
--      dengan migrasi ini (perbedaan kapitalisasi kolom di data_warga_import dan
--      riwayat_ks_import). Menjawabnya satu per satu berisiko menimpa kolom
--      impor dengan nama yang salah.
--   2. `drizzle-kit generate` gagal dengan "Non-commutative migrations detected"
--      karena sembilan folder migrasi lama saling bertentangan, dan
--      drizzle/meta/_journal.json masih kosong.
-- Operasi di sini semuanya additive atau aman: tidak ada DROP tabel data.
--
-- applying migration ini berulang kali aman (IF NOT EXISTS / IF EXISTS dipakai
-- untuk objek yang mungkin sudah ada).

-- 1. Role kader -------------------------------------------------------------
-- `role` menentukan hak akses, bukan jabatan. Kader dipisah dari 'staff'
-- karena Rekap Kunjungan Rumah memfilter kader dari tabel `users`, dan
-- sebelumnya sumbernya `admin_staff.peran = 'Kader'`.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON e.enumtypid = t.oid
                   WHERE t.typname = 'role' AND e.enumlabel = 'kader') THEN
        ALTER TYPE role ADD VALUE 'kader';
    END IF;
END
$$;

-- 2. Jabatan (display only) -------------------------------------------------
-- Bidan/Perawat/Kader adalah jabatan, bukan wewenang, jadi tidak masuk enum.
ALTER TABLE users ADD COLUMN IF NOT EXISTS jabatan varchar(50);

-- 3. Kunci seeder + penanda form yang mewajibkan warga -----------------------
-- `kode` stabil supaya seeder idempotent bisa menemukan form bawaan lewat kunci
-- yang tidak ikut berubah kalau admin mengganti `nama`. NULL untuk form buatan
-- user, jadi form bawaan dan form buatan tidak tertukar.
ALTER TABLE forms ADD COLUMN IF NOT EXISTS kode varchar(50);
ALTER TABLE forms ADD COLUMN IF NOT EXISTS "subjekWargaWajib" boolean NOT NULL DEFAULT true;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes
                   WHERE indexname = 'forms_kode_key' AND schemaname = 'public') THEN
        CREATE UNIQUE INDEX forms_kode_key ON forms (kode);
    END IF;
END
$$;

-- 4. Repeat group -----------------------------------------------------------
-- Satu field 'group' = satu baris survey_entries, isinya array of object di
-- kolom `value` jsonb. Unique index (surveyId, fieldId) tetap berlaku, jadi
-- tidak perlu tabel anak.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON e.enumtypid = t.oid
                   WHERE t.typname = 'form_field_type' AND e.enumlabel = 'group') THEN
        ALTER TYPE form_field_type ADD VALUE 'group';
    END IF;
END
$$;

ALTER TABLE form_fields ADD COLUMN IF NOT EXISTS "jumlahKolom" integer;

-- 5. Multi-file per field ---------------------------------------------------
-- Kegiatan Pemberdayaan mengizinkan sampai 6 foto pada field yang sama
-- (MAX_FOTO di src/hooks/use-kegiatan.ts), jadi
-- (surveyId, fieldId) tidak cukup unik.
ALTER TABLE survey_files ADD COLUMN IF NOT EXISTS ordinal integer NOT NULL DEFAULT 0;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_indexes
               WHERE indexname = 'survey_files_survey_id_field_id'
                 AND schemaname = 'public') THEN
        DROP INDEX survey_files_survey_id_field_id;
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes
                   WHERE indexname = 'survey_files_survey_id_field_id_ordinal'
                     AND schemaname = 'public') THEN
        CREATE UNIQUE INDEX survey_files_survey_id_field_id_ordinal
            ON survey_files ("surveyId", "fieldId", ordinal);
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint
                   WHERE conname = 'survey_files_ordinal_check'
                     AND conrelid = 'public.survey_files'::regclass) THEN
        ALTER TABLE survey_files ADD CONSTRAINT survey_files_ordinal_check CHECK (ordinal >= 0);
    END IF;
END
$$;

-- 6. Survey tanpa warga -----------------------------------------------------
-- Form Kegiatan Pemberdayaan tidak punya warga tetap per-submission, jadi
-- wargaNik harus bisa NULL. Aturan "form ini wajib atau tidak terisi warga"
-- datang dari forms."subjekWargaWajib" dan dijaga di backend, karena butuh isi
-- form_versions yang tidak ada di tabel surveys.
--
-- DROP NOT NULL lebih aman ditulis sebagai DO blok: kalau kolomnya ternyata
-- sudah nullable (mis. diulang di mesin lain), blok ini tidak gagal.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'surveys'
          AND column_name = 'wargaNik'
          AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE surveys ALTER COLUMN "wargaNik" DROP NOT NULL;
    END IF;
END
$$;

-- 7. updated_at yang valid ---------------------------------------------------
-- Trigger sebelumnya dibuat manual untuk 13 tabel, tapi audit_logs dan
-- survey_files tidak punya kolom updatedAt, jadi trigger-nya tidak pernah
-- benar-benar menyalakan NEW.updated_at. Dua trigger itu dihapus di sini.
DROP TRIGGER IF EXISTS audit_logs_set_updated_at ON audit_logs;
DROP TRIGGER IF EXISTS survey_files_set_updated_at ON survey_files;

CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
    NEW."updatedAt" = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Tabel survey_files dihapus ----------------------------------------------
-- Tabel ini tidak pernah masuk definisi Drizzle (src/lib/schema/*.ts), jadi
-- `drizzle-kit push` tidak mengenalinya dan tidak akan pernah mengelolanya.
-- Isinya kosong dan fitur lampiran belum didukung, jadi tabelnya dibuang.
--
-- DROP diletakkan di file terakhir yang menyentuh survey_files, bukan di
-- 20260928_form-builder-v2.sql yang membuatnya: kalau file yang membuat
-- di-drop, file ini (yang ALTER kolom `ordinal`) akan gagal saat diputar ulang.
DROP TRIGGER IF EXISTS survey_files_set_updated_at ON survey_files;
DROP TABLE IF EXISTS survey_files;
