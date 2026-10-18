-- Lengkapi kolom `users.role` dan `users.pinHash` yang belum ada di database.
--
-- Latar belakang: `schema.ts` (sumber kebenaran) mendeklarasikan dua kolom ini
-- wajib (NOT NULL), sedangkan di database dua-duanya tidak pernah dibuat.
-- Akibatnya halaman Kelola Kader gagal saat membaca/insert pengguna.
--
-- Sifatnya ADITIF ke tabel `users` yang sudah ada isinya (5 baris, jangan
-- disentuh isinya selain mengisi kolom baru). Tidak ada drop/rename.
--
-- Keputusan isi:
--   * role    : baris lama diisi 'kader'. Peran admin belum pernah dipetakan
--               per-baris (SESSION_PROFILE hard-coded), jadi menandai baris
--               lama 'admin' hanya menebak; 'kader' adalah default schema.ts.
--   * pinHash : diisi PENANDA_PIN_TIDAK_DIGUNAKAN ("!belum-diatur"), marker yang
--               sama dengan yang dipakai user-registry.server.ts untuk akun
--               baru. Kolom ini tidak pernah dipakai verifikasi login.
--
-- File ini SENGAJA tidak menulis BEGIN / COMMIT. Transaksinya dimiliki runner
-- (scripts/terapkan-migrasi-manual.mts, lewat `sql.begin()`), yang memastikan
-- seluruh file dibatalkan bila satu statement pun gagal. Runner menolak file
-- yang membawa control transaction sendiri.
--
-- Dijalankan lewat:
--   npx tsx scripts/terapkan-migrasi-manual.mts --dry-run drizzle/manual/20261008_users-role-pinhash.sql
--   npx tsx scripts/terapkan-migrasi-manual.mts drizzle/manual/20261008_users-role-pinhash.sql

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Enum `role`
--
-- Dua nilai saja: 'admin' mengelola aplikasi, 'kader' mencatat kunjungan.
-- Sesuai `role` di type-enum.ts dan drizzle/manual/20260930_role-admin-kader.sql
-- yang tidak pernah sampai dijalankan ke database ini.
-- ─────────────────────────────────────────────────────────────────────────────
do $$
begin
  if not exists (select 1 from pg_type where typname = 'role') then
    create type role as enum ('admin', 'kader');
  end if;
end
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Kolom `users.role`
-- ─────────────────────────────────────────────────────────────────────────────
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'users'
      and column_name = 'role'
  ) then
    alter table users
      add column role role not null default 'kader';
  end if;
end
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Kolom `users.pinHash`
--
-- Ditambah dengan default sementara supaya 5 baris lama langsung terisi, lalu
-- default-nya dilepas kembali: schema.ts mendeklarasikan kolom ini NOT NULL
-- TANPA default, dan aplikasi selalu menuliskannya sendiri (marker
-- PENANDA_PIN_TIDAK_DIGUNAKAN).
--
-- PENTING soal guard: information_schema menyimpan nama kolom persis seperti
-- hasil pelipatan Postgres (`pinhash`, huruf kecil), bukan ejaan drizzle
-- (`"pinHash"`). Pencocokannya memakai lower() supaya file ini aman dijalankan
-- ulang — membandingkan dengan 'pinHash' camelCase selalu tidak ketemu dan
-- blok add column-nya dijalankan berulang, yang justru gagal "already exists".
-- ─────────────────────────────────────────────────────────────────────────────
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'users'
      and lower(column_name) = 'pinhash'
  ) then
    alter table users
      add column pinHash varchar(255) not null default '!belum-diatur';
  else
    -- Baris yang kebetulan masih NULL (seharusnya tidak ada, tapi jangan biarkan
    -- kolom NOT NULL gagal di tengah jalan): isi dengan marker yang sama.
    update users set pinHash = '!belum-diatur' where pinHash is null;
  end if;
end
$$;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'users'
      and lower(column_name) = 'pinhash'
      and column_default is not null
  ) then
    alter table users alter column pinHash drop default;
  end if;
end
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Koreksi ejaan kolom
--
-- `alter table ... add column pinHash` yang ditulis TANPA tanda kutip membuat
-- Postgres melipatnya menjadi `pinhash` (huruf kecil), sedangkan drizzle selalu
-- mengutip nama kolom camelCase (`"pinHash"`). Tanpa rename ini, kode yang
-- membaca `"pinHash"` akan gagal dengan "column does not exist" padahal
-- kolomnya ada. `role` tidak bermasalah karena satu kata kecil semua.
-- ─────────────────────────────────────────────────────────────────────────────
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'users'
      and column_name = 'pinHash'
  ) and exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'users'
      and lower(column_name) = 'pinhash'
  ) then
    alter table users rename column pinhash to "pinHash";
  end if;
end
$$;
