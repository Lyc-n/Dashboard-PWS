-- ============================================================================
-- Index untuk data_warga_import
--
-- Tabel ini adalah sumber awal data sasaran: 20.454 baris, 4.7 MB, dan sampai
-- sekarang HANYA punya satu index yaitu primary key `raw_id`. Semua pencarian
-- dan filter yang dipakai UI kena seq scan penuh:
--
--   * `WHERE nik = $1`            -> src/lib/utils.server.ts (importUntukNik, saat
--                                    menyimpan warga dari form Kunjungan Rumah)
--   * `nama_art/nama_kk ILIKE %q%` -> src/lib/utils.server.ts (cariSasaranWarga,
--                                    dipanggil tiap ketikan di form)
--   * `kelurahan = $1` lewat CTE  -> src/lib/utils.server.ts (querySasaranListPaged)
--
-- ILIKE dengan pola di tengah (`%q%`) tidak bisa memakai btree sama sekali, jadi
-- butuh operator class trigram. Tanpa ini, satu ketikan = scan 20.454 baris.
--
-- CATATAN: `nik` kosong di 8.277 dari 20.454 baris. Index btree tetap dipakai
-- untuk baris NULL, jadi ukurannya lebih besar dari yang paling mungkin
-- dibutuhkan — di 4.7 MB itu tidak terasa, dan `importUntukNik` selalu mencari
-- NIK 16 digit sehingga index parsial tidak akan membantu.
--
-- Index GIN trigram tidak bisa dideklarasikan lewat schema Drizzle
-- (IndexBuilder hanya menerima PgIndexMethod + kolom, bukan opclass bebas),
-- jadi file ini yang menjadi sumbernya. Schema Drizzle tetap mendeklarasikan
-- index btree `nik` di src/lib/schema/data-import.ts supaya perbedaannya
-- terlihat di introspeksi schema.
--
-- Idempoten: bisa dijalankan berkali-kali.
-- ============================================================================

BEGIN;

-- pg_trgm belum terpasang di DB ini (dicek lewat pg_available_extensions).
-- Schema `extensions` sudah ada di search_path default Supabase, jadi operator
-- class-nya ketemu tanpa prefix.
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;

-- Lookup NIK persis: dipakai saat menyimpan warga dari form Kunjungan Rumah,
-- supaya kolom yang tidak ada di form (rt, rw, agama) tetap terisi dari import.
CREATE INDEX IF NOT EXISTS data_warga_import_nik_idx
    ON data_warga_import (nik);

-- Pencarian teks partial: nik, nama_art, nama_kk.
-- Batas inherent: trigram butuh minimal 3 karakter, jadi ILIKE '%a%' (1 huruf)
-- tetap seq scan. `cariSasaranWarga` sudah menolak query di bawah 3 karakter
-- (src/lib/utils.server.ts), jadi tidak ada user yang merasa lambat.
CREATE INDEX IF NOT EXISTS data_warga_import_nama_trgm_idx
    ON data_warga_import USING gin (
        nama_art gin_trgm_ops,
        nama_kk  gin_trgm_ops,
        nik      gin_trgm_ops
    );

-- Statistik untuk planner. Tanpa ini index baru dipakai setelah ANALYZE pertama.
ANALYZE data_warga_import;

COMMIT;