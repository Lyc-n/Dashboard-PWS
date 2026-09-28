-- Migration manual (bukan hasil `drizzle-kit generate`).
-- Repo ini tidak punya drizzle/meta/_journal.json dan DB tidak punya tabel
-- migration tracking, jadi `drizzle-kit migrate` tidak bisa dipakai. Jalankan file
-- ini manual lewat psql / editor SQL Supabase.
--
-- DAMPAK: `truncate forms cascade` ikut mengosongkan `surveys` dan `survey_images`
-- karena keduanya punya FK ke `forms` (TRUNCATE CASCADE mengabaikan aturan ON DELETE).
-- Ketiganya sedang kosong saat file ini dibuat, jadi tidak ada data hilang.
--
-- Setelah file ini: `pnpm db:seed` membangun ulang seluruh definisi form.

begin;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. questions — identitas field + bucket layout
--
-- Kenapa kolom ini perlu: sebelumnya satu question cuma punya `pertanyaan`
-- (teks yang boleh diedit admin), jadi tidak ada key stabil untuk menyimpan
-- jawaban. Key dipakai kode, bukan teks, supaya jawaban lama tetap resolve
-- walau label diubah.
-- ─────────────────────────────────────────────────────────────────────────────
alter table questions
  add column if not exists kode text,              -- key stabil, mis. k1Tempat / tglPengumpulan
  add column if not exists bucket varchar(20),     -- bucket layout di panel sasaran
  add column if not exists hint text;             -- teks placeholder di bawah field

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. form_field_options — pilihan untuk tipe select/radio
--
-- Kenapa tabel terpisah dan bukan jsonb: aplikasi jadi multi-form, daftar pilihan
-- akan dipakai lintas form. Tabel ini juga yang menegakkan `UNIQUE (questionId,
-- value)` sehingga opsi dobel tidak bisa masuk — jsonb tidak bisa menegakkan apa pun.
--
-- `drop table` dipakai supaya file ini bisa dijalankan ulang. Tabel ini baru dibuat
-- oleh migration yang sama dan tidak pernah berisi data nyata, jadi tidak ada yang
-- hilang. Nama kolom WAJIB di-quote supaya camelCase tidak di-folds jadi lowercase
-- (Postgres folds identifier yang tidak di-quote ke huruf kecil).
-- ─────────────────────────────────────────────────────────────────────────────
drop table if exists form_field_options cascade;

create table form_field_options (
  id uuid primary key default gen_random_uuid(),
  "questionId" uuid not null references questions(id) on delete cascade,
  "label" text not null,          -- yang ditulis petugas
  "value" text not null,          -- yang disimpan di payload jawaban
  "urutan" integer not null,
  "createdAt" timestamp not null default now(),
  "updatedAt" timestamp not null default now(),
  constraint form_field_options_question_value_key unique ("questionId", value)
);

create index form_field_options_question_idx on form_field_options ("questionId");

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. forms + kunjungan_records — record harus tahu form mana yang dipakai
--
-- Kenapa: `surveys` sudah punya formId tapi `kunjungan_records` tidak. Tanpa
-- formVersion, begitu definisi form berubah, jawaban lama jadi tidak bisa
-- diinterpretasi dan rekap historis ikut bergeser tanpa jejak.
-- ─────────────────────────────────────────────────────────────────────────────
alter table forms
  add column if not exists version integer not null default 1;

alter table kunjungan_records
  add column if not exists "formId" uuid references forms(id) on delete set null,
  add column if not exists "formVersion" integer;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Bersihkan data lama
--
-- Isi lama dibangun tanpa `kode` dan tanpa opsi select, jadi tidak bisa di-convert
-- (label `tempat` muncul 8x dalam satu section — tidak bisa dibedakan mana k1 vs k6).
-- Dibangun ulang dari scripts/seed.ts yang sekarang sudah membawa `kode`.
-- ─────────────────────────────────────────────────────────────────────────────
truncate table questions, form_sections, forms cascade;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. Constraint — baru berlaku setelah truncate + seed
--
-- Unique per section, bukan per form: `nama` dipakai di section `anggota`,
-- `masalah`, dan section identitas tiap sasaran, jadi unik per form akan salah.
-- `kode` dijamin unik per section oleh index di bawah.
-- ─────────────────────────────────────────────────────────────────────────────
alter table questions alter column kode set not null;

create unique index if not exists questions_section_kode_key on questions ("sectionId", kode);

alter table questions
  drop constraint if exists questions_tipe_check,
  add constraint questions_tipe_check check (
    tipe in ('text', 'number', 'date', 'select', 'radio', 'checkbox', 'time', 'group')
  );

alter table questions
  drop constraint if exists questions_bucket_check,
  add constraint questions_bucket_check check (
    bucket is null or bucket in ('identitas', 'kolom', 'bools', 'baha')
  );

commit;
