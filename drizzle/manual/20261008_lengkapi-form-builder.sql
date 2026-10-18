-- Lengkapi skema form-builder yang belum ada di database ini.
--
-- Latar belakang: database yang ditunjuk DATABASE_URL (Supabase yang dipakai
-- bersama) kehilangan setengah skema v2. Tabel di bawah tidak pernah dibuat di
-- sana, sementara kode aplikasi membacanya. Hampir semua halaman (Kunjungan
-- Rumah, Kegiatan, Form Builder, dan Notifikasi) gagal dengan
-- "relation ... does not exist".
--
-- File sumbernya adalah drizzle/manual/20260928_form-builder-v2.sql, tapi file
-- itu TIDAK dijalankan ulang: dia men-drop `forms`, `surveys`, `users`, dan di
-- database ini isinya sudah ada (users 5 baris, forms 3 baris). Jadi tabel yang
-- hilang dibangun kembali di sini, dan definisinya disalin dari
-- src/lib/schema/schema.ts, bukan dari v2 yang lebih tua.
--
-- Perbedaan dari v2 (inilah definisi yang harus terpasang):
--   * form_sections tanpa `parentId` - kolom itu sudah tidak ada di schema.ts.
--   * form_fields punya `jumlahKolom` - ditambahkan setelah v2, untuk tipe group.
--   * form_field_options, BUKAN form_field_rules - aturan visibility sudah
--     dihapus; lihat 20261005_hapus-aturan-visibility.sql dan
--     20261005_rename-tabel-pilihan.sql.
--   * setiap timestamp `timestamptz`, sesuai konvensi proyek (tanpa embel-embel).
--   * survey_files TIDAK dibuat - tidak ada satu pun kode yang membacanya.
--
-- Sifatnya ADITIF dan idempotent. Tidak ada drop/rename/alter yang menyentuh
-- tabel yang sudah ada. `surveys` tetap menyimpan kolom lama `jawaban`, dan
-- `form_versions` tetap menyimpan `schema` + `ui_schema`; merapikan kolom sisa
-- itu adalah pekerjaan terpisah yang berisiko pada data asli.
--
-- File ini SENGAJA tidak menulis `begin;` / `commit;`. Transaksinya dimiliki
-- runner (scripts/terapkan-migrasi-manual.mts, lewat `sql.begin()`), yang
-- memastikan seluruh file dibatalkan bila satu statement pun gagal. Runner
-- menolak file yang membawa `begin`/`commit` sendiri karena itu membuat
-- statement bisa diterapkan sebagian tanpa ada rollback.
--
-- Dijalankan lewat:
--   npx tsx scripts/terapkan-migrasi-manual.mts --dry-run drizzle/manual/20261008_lengkapi-form-builder.sql
--   npx tsx scripts/terapkan-migrasi-manual.mts drizzle/manual/20261008_lengkapi-form-builder.sql

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Enum `form_field_type`
--
-- Nilai dan urutan mengikuti `formFieldType` di type-enum.ts. Tipe `group`
-- menyimpan baris berulang sebagai array of object di one baris
-- survey_entries.value, jadi unique index (surveyId, fieldId) tetap berlaku.
-- ─────────────────────────────────────────────────────────────────────────────
do $$
begin
  if not exists (select 1 from pg_type where typname = 'form_field_type') then
    create type form_field_type as enum (
      'text', 'textarea', 'number', 'select', 'radio', 'checkbox',
      'date', 'time', 'image', 'file', 'group'
    );
  end if;
end
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. form_sections
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists form_sections (
  id              uuid primary key default gen_random_uuid(),
  "formVersionId" uuid not null
    references form_versions(id) on delete cascade,
  nama            varchar(100) not null,
  deskripsi       text,
  urutan          integer not null,
  aktif           boolean not null default true,
  "createdAt"     timestamptz not null default now(),
  "updatedAt"     timestamptz not null default now()
);

-- Duplikat `uniqueIndex(...)` di schema.ts. Index ini yang mensyaratkan FK
-- komposit form_fields (sectionId, formVersionId) -> (id, formVersionId):
-- Postgres menolak FK yang menunjuk pasangan kolom target tanpa unique index.
create unique index if not exists form_sections_id_form_version_id
  on form_sections (id, "formVersionId");

create index if not exists form_sections_form_version_urutan_idx
  on form_sections ("formVersionId", urutan);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. form_fields
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists form_fields (
  id                 uuid primary key default gen_random_uuid(),
  "formVersionId"    uuid not null
    references form_versions(id) on delete cascade,
  -- Denormalisasi disengaja: unique index (formVersionId, nama) hanya sah bila
  -- formVersionId milik field sama dengan milik section-nya. FK komposit di
  -- bawah yang memaksa itu.
  "sectionId"        uuid not null,
  nama               varchar(100) not null,
  label              varchar(255) not null,
  tipe               form_field_type not null,
  "optionSourceType" varchar(30),
  "optionSourceKey"  varchar(100),
  deskripsi          text,
  placeholder        varchar(255),
  wajib              boolean not null default false,
  urutan             integer not null default 0,
  -- Hanya dipakai tipe 'group' (jumlah kolom anggota keluarga, misalnya 3).
  "jumlahKolom"      integer,
  aktif              boolean not null default true,
  "createdAt"        timestamptz not null default now(),
  "updatedAt"        timestamptz not null default now()
);

-- FK komposit, bukan FK ke sectionId saja. Tanpa itu, formVersionId milik field
-- bisa diisi versi lain daripada section-nya dan unique index jadi bohong.
--
-- `add constraint` tidak punya IF NOT EXISTS, jadi dijaga DO block supaya file
-- ini aman dijalankan ulang tanpa membuat constraint kembar.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'form_fields_section_version_fk'
      and conrelid = 'form_fields'::regclass
  ) then
    alter table form_fields
      add constraint form_fields_section_version_fk
      foreign key ("sectionId", "formVersionId")
      references form_sections (id, "formVersionId")
      on delete cascade;
  end if;
end
$$;

-- `nama` = identifier teknis, mis. "tekanan_darah", dipanggil kode saat
-- menyimpan jawaban. Unik per versi form, boleh sama di versi berbeda karena
-- jawaban lama dipin ke formVersionId lewat survey_entries.
create unique index if not exists form_fields_form_version_nama_key
  on form_fields ("formVersionId", nama);

create index if not exists form_fields_section_urutan_idx
  on form_fields ("sectionId", urutan);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. form_field_options
--
-- Satu baris = satu pilihan jawaban milik satu field. `value` yang tersimpan di
-- payload jawaban; `label` yang dibaca petugas, mis. "Tidak/Belum Sekolah".
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists form_field_options (
  id          uuid primary key default gen_random_uuid(),
  "fieldId"   uuid not null references form_fields(id) on delete cascade,
  value       text not null,
  label       varchar(255),
  urutan      integer not null default 0,
  aktif       boolean not null default true,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create index if not exists form_field_options_field_urutan_idx
  on form_field_options ("fieldId", urutan);

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. survey_entries
--
-- Satu baris = satu jawaban milik satu field di satu submission. Payload lama
-- Form Kunjungan Rumah menaruh SELURUH form di satu baris bernama
-- `penyimpanan::record_legacy`; form lain menyimpan satu baris per field.
-- Keduanya isi kolom `value` yang sama.
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists survey_entries (
  id          uuid primary key default gen_random_uuid(),
  "surveyId"  uuid not null references surveys(id) on delete cascade,
  -- FK ini hanya memastikan field ADA. Aturan "field milik versi survey ini?"
  -- divalidasi di backend sebelum insert; database tidak bisa memastikannya
  -- tanpa join ke form_versions.
  "fieldId"   uuid not null references form_fields(id),
  value       jsonb,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

-- Kunci (surveyId, fieldId) yang memaksa "satu baris per field per submission"
-- diambil alih database, bukan hanya disepakati backend.
create unique index if not exists survey_entries_survey_id_field_id
  on survey_entries ("surveyId", "fieldId");

-- Rekap per field ("berapa warga dengan TD tinggi?") memfilter lewat fieldId.
create index if not exists survey_entries_field_id_idx
  on survey_entries ("fieldId");