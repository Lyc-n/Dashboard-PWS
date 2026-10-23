-- Buang kolom `users.role` dan `users.pinHash`: tabel `users` jadi daftar
-- kader murni, bukan tabel akun.
--
-- Latar: login aplikasi cuma satu PIN global dari environment (`isValidPin` di
-- src/lib/utils.server.ts), jadi tidak ada kredensial per-kader yang perlu
-- disimpan. `pinHash` lama hanya berisi penanda yang tidak pernah dibaca, dan
-- `role` hanya mengklasifikasi jenis petugas tanpa pernah membatasi halaman
-- mana yang boleh dibuka — semua sesi valid setara (lihat catatan di
-- src/lib/auth.ts). Keduanya dihapus, bukan dibiarkan, supaya tidak ada kolom
-- yang terlihat seperti kredensial padahal mati.
--
-- Baris yang dulu berperan 'admin' ikut dihapus: dia mengelola aplikasi, bukan
-- mencatat kunjungan, jadi tidak punya tempat di daftar kader.
--
-- Memperhatikan foreign key yang menunjuk `users.id`:
--   - surveys.petugasId  NOT NULL, tanpa ON DELETE -> harus diganti dulu
--   - data_warga.staff   NOT NULL, tanpa ON DELETE -> harus diganti dulu
--   - audit_logs.userId  ON DELETE SET NULL       -> otomatis jadi NULL
-- Kalau ternyata ada submission yang mencatat petugas admin, petugasnya
-- diarahkan ke kader pertama yang ada; kalau tidak ada kader sama sekali,
-- script berhenti dengan pesan, bukan diam-diam mengarang-petugas.
--
-- Idempoten: bisa dijalankan ulang di database yang kolomnya sudah hilang.
--
-- Kenapa di `manual/` dan bukan hasil `pnpm db:sql`: `drizzle-kit generate`
-- berhenti di "Non-commutative migrations detected / 6 conflicts" yang berasal
-- dari histori lama repo (create_enum `agama` tercatat di beberapa migrasi
-- berbeda), bukan dari perubahan ini. Perbaikannya ada di sisi histori
-- migrasi, di luar cakupan. Snapshot di `drizzle/<timestamp>_*/snapshot.json`
-- karena itu tidak ikut menyebut bahwa kolom `role`/`pinHash` hilang — kalau
-- nanti histori itu dirapikan dan `db:sql` dijalankan lagi, ensure baris
-- `DROP COLUMN` untuk kedua kolom tidak terduplikasi di migrasi baru.
BEGIN;

DO $$
DECLARE
  v_pengganti uuid;
  v_admin     uuid;
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'users'
      AND column_name = 'role'
  ) THEN
    SELECT id INTO v_pengganti
    FROM users
    WHERE role <> 'admin'
    ORDER BY nama
    LIMIT 1;

    FOR v_admin IN SELECT id FROM users WHERE role = 'admin' LOOP
      IF v_pengganti IS NULL THEN
        RAISE EXCEPTION
          'Tidak ada kader tersisa untuk menggantikan petugas admin (id=%). Tambahkan kader dulu, atau hapus baris surveys/data_warga yang menunjuk akun ini sebelum menjalankan ulang.',
          v_admin;
      END IF;

      UPDATE surveys SET "petugasId" = v_pengganti WHERE "petugasId" = v_admin;
      UPDATE data_warga SET staff = v_pengganti WHERE staff = v_admin;
    END LOOP;

    DELETE FROM users WHERE role = 'admin';
  END IF;
END $$;

ALTER TABLE users DROP COLUMN IF EXISTS "role";
ALTER TABLE users DROP COLUMN IF EXISTS "pinHash";

-- Tipe enum `role` tidak dipakai kolom mana pun lagi. Sama seperti enum
-- `jamban_keluarga`/`sarana_air_bersih` yang sudah dihapus lebih dulu: dibiarkan,
-- `drizzle-kit generate` akan membuat `CREATE TYPE` untuk enum yang tidak pernah
-- dipakai lagi.
DROP TYPE IF EXISTS role;

COMMIT;