-- Role disederhanakan: hanya 'admin' dan 'kader'.
--
-- Bidan/Perawat yang dulu ber-role 'staff' adalah pencatat lapangan, jadi
-- digabung ke 'kader'. Label jabatan (Bidan/Perawat/Kader) tidak lagi disimpan
-- di `users.jabatan`; tersedia dua peran, dan hak akses tidak membedakan keduanya.
--
-- Kolom `jabatan` dihapus permanen. Simpan salinan dulu bila masih diperlukan:
--   CREATE TABLE users_jabatan_backup AS SELECT id, nama, jabatan FROM users;
--
-- Tidak ada eskalasi hak akses: `requireAdmin` hanya memeriksa 'admin', dan
-- nilai 'admin' tidak tersentuh di sini.
BEGIN;

-- Staf lama (Bidan/Perawat) menjadi pencatat = kader, sebelum kolom diketik ulang.
UPDATE users SET role = 'kader' WHERE role = 'staff';

-- Default mengacu ke nilai enum, lepas dulu sebelum tipe diubah.
ALTER TABLE users ALTER COLUMN role DROP DEFAULT;

ALTER TYPE role RENAME TO role_lama;
CREATE TYPE role AS ENUM ('admin', 'kader');
ALTER TABLE users ALTER COLUMN role TYPE role USING role::text::role;
ALTER TABLE users ALTER COLUMN role SET DEFAULT 'kader';

ALTER TABLE users DROP COLUMN jabatan;

COMMIT;

DROP TYPE role_lama;