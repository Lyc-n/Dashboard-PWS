-- Rebuild desain form ke v2 (Form Builder): Opsi B — drop dan bangun ulang.
--
-- PENTING: file ini MENGHAPUS tabel form lama beserta isinya. Backup lengkap
-- ada di drizzle/backup/pre_optionB_20260928_151643.dump (pg_dump custom format).
-- Pulihkan dengan:
--   pg_restore --clean --if-exists -d "$DATABASE_URL" drizzle/backup/pre_optionB_<timestamp>.dump
--
-- Yang dihapus (isi ikut hilang, sudah dipastikan tidak ada data warga nyata):
--   questions            395 baris (definisi pertanyaan, seed)
--   form_field_options   155 baris (opsi jawaban, seed)
--   form_sections         17 baris (seed)
--   forms                  2 baris (seed)
--   kunjungan_records      1 baris (data dummy: isi "efef", "aRgeg", "eagervgarag")
--   kegiatan_records       1 baris (data demo)
--   surveys                0 baris
--   survey_images          0 baris
--   surveyor               1 baris
--
-- Yang SENGAJA TIDAK disentuh (memang data asli, 20.454 baris):
--   data_warga_import, riwayat_ks_import, data_warga, admin_items,
--   admin_priorities, admin_staff, valid_session
--
-- Catatan penamaan kolom:
--   * Kolom camelCase WAJIB di-quote. Postgres melipat identifier tanpa kutip
--     ke huruf kecil, sedangkan drizzle memakai camelCase. Tanpa kutip, kolomnya
--     jadi "createdat" dan query drizzle akan gagal.
--   * Tipe enum `jenis_fas_kes` TIDAK boleh dinamai `fasilitas_kesehatan`. Setiap
--     tabel di Postgres diam-diam punya composite type dengan nama yang sama,
--     jadi `create table fasilitas_kesehatan` akan gagal dengan "type already
--     exists". Nama enumnya dipisah, nama tabelnya tetap.

begin;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Buang tabel form lama
--
-- Drop dalam satu statement + cascade. Daftar children ditulis lebih dulu agar
-- tidak bergantung pada urutan cascade.
-- ─────────────────────────────────────────────────────────────────────────────
drop table if exists
  survey_images,
  form_field_options,
  questions,
  form_sections,
  forms,
  surveys,
  kunjungan_records,
  kegiatan_records,
  surveyor
cascade;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Enum baru
--
-- `pendidikan`, `hubungan_keluarga`, `status_kawin`, `agama`, `jenis_kelamin`
-- sudah ada dan nilainya sama persis dengan schema.ts, jadi tidak disentuh.
-- ─────────────────────────────────────────────────────────────────────────────
do $$
begin
  if not exists (select 1 from pg_type where typname = 'pekerjaan') then
    create type pekerjaan as enum (
      'Petani', 'Buruh', 'Nelayan', 'PNS', 'Pedagang', 'SWASTA', 'IRT',
      'Pelajar/Mahasiswa', 'Tidak Bekerja', 'Lainnya'
    );
  end if;
  if not exists (select 1 from pg_type where typname = 'jenis_fas_kes') then
    create type jenis_fas_kes as enum ('Posyandu', 'Pustu');
  end if;
  if not exists (select 1 from pg_type where typname = 'role') then
    create type role as enum ('admin', 'staff');
  end if;
  if not exists (select 1 from pg_type where typname = 'form_field_type') then
    create type form_field_type as enum (
      'text', 'textarea', 'number', 'select', 'radio', 'checkbox',
      'date', 'time', 'image', 'file'
    );
  end if;
  if not exists (select 1 from pg_type where typname = 'form_field_rule_type') then
    create type form_field_rule_type as enum ('option', 'visibility');
  end if;
  if not exists (select 1 from pg_type where typname = 'form_field_rule_operator') then
    create type form_field_rule_operator as enum ('equals', 'not_equals');
  end if;
  if not exists (select 1 from pg_type where typname = 'audit_action') then
    create type audit_action as enum (
      'create', 'read', 'update', 'delete', 'publish', 'login', 'logout'
    );
  end if;
end
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Wilayah kerja dan fasilitas kesehatan
--
-- unique index (kecamatan, kelurahan): satu kecamatan boleh punya banyak
-- kelurahan, tapi kombinasi yang sama tidak boleh dobel.
-- ─────────────────────────────────────────────────────────────────────────────
create table wilayah_kerja (
  id         smallint primary key generated always as identity,
  kecamatan  text   not null,
  kelurahan  text   not null,
  "createdAt" timestamp not null default now(),
  "updatedAt" timestamp not null default now()
);

create unique index wilayah_kerja_kecamatan_kelurahan
  on wilayah_kerja (kecamatan, kelurahan);

create table fasilitas_kesehatan (
  id            smallint primary key generated always as identity,
  "wilayahKerjaId" smallint not null
    references wilayah_kerja(id) on delete cascade on update cascade,
  "fasKesType"  jenis_fas_kes not null,
  nama          varchar(20) not null,
  alamat        text not null,
  rt            varchar(3),
  rw            varchar(3),
  "createdAt"   timestamp not null default now(),
  "updatedAt"   timestamp not null default now()
);

create index fasilitas_kesehatan_wilayah_kerja_id_idx
  on fasilitas_kesehatan ("wilayahKerjaId");

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Akun petugas
--
-- fasKesId ON DELETE RESTRICT: menghapus fasilitas tidak boleh ikut menghapus
-- akun petugas. Akun petugas tertaut dari audit_logs dan surveys, jadi harus
-- bertahan. Perilaku CASCADE yang lama bisa menghapus akun tanpa jejak.
-- ─────────────────────────────────────────────────────────────────────────────
create table users (
  id        uuid primary key default gen_random_uuid(),
  "fasKesId" smallint not null
    references fasilitas_kesehatan(id) on delete restrict on update cascade,
  "role"    role not null default 'staff',
  nama      varchar(255) not null,
  "pinHash" varchar(255) not null,
  phone     varchar(20),
  aktif     boolean not null default true,
  "createdAt" timestamp not null default now(),
  "updatedAt" timestamp not null default now()
);

create index users_fas_kes_id_idx on users ("fasKesId");

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. Selaraskan data_warga dengan schema baru
--
-- Kolom `petugas text` diganti `staff uuid` (relasi ke users), rt/rw dari
-- integer ke varchar(3), dan pekerjaan dari text ke enum. Tabel sedang kosong,
-- jadi tidak ada data yang perlu dikonversi.
--
-- Guard di bawah menolak migration kalau ternyata ada nilai yang tidak ada di
-- enum, supaya tidak gagal diam-diam dan nggak ada baris jadi null diam-diam.
-- ─────────────────────────────────────────────────────────────────────────────
do $$
declare
  buruk text;
begin
  select string_agg(distINCT pekerjaan, ', ') into buruk
  from data_warga
  where pekerjaan is not null and pekerjaan <> ''
    and pekerjaan <> all (select unnest(enum_range(null::pekerjaan))::text);

  if buruk is not null then
    raise exception
      'data_warga.pekerjaan punya nilai di luar enum pekerjaan: %', buruk;
  end if;
end
$$;

alter table data_warga
  add column staff uuid references users(id);

alter table data_warga
  alter column rt type varchar(3) using rt::text;

alter table data_warga
  alter column rw type varchar(3) using rw::text;

alter table data_warga
  alter column pekerjaan type public.pekerjaan
  using (case when pekerjaan is null or pekerjaan = '' then null
              else pekerjaan::public.pekerjaan end);

-- NOT NULL baru dipasang setelah kolom terisi, supaya data_warga yang sudah
-- punya baris tidak gagal di tengah jalan.
alter table data_warga alter column staff set not null;
alter table data_warga drop column petugas;

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. Form, versi, section
--
-- `nama` di forms unik global, sesuai keputusan proyek.
-- ─────────────────────────────────────────────────────────────────────────────
create table forms (
  id          smallint primary key generated always as identity,
  nama        varchar(100) not null,
  deskripsi   text,
  aktif       boolean not null default true,
  "createdAt" timestamp not null default now(),
  "updatedAt" timestamp not null default now(),
  constraint forms_nama_key unique (nama)
);

create table form_versions (
  id           uuid primary key default gen_random_uuid(),
  "formId"     smallint not null references forms(id),
  version      integer not null,
  status       varchar(20) not null default 'draft',
  "publishedAt" timestamp,
  "createdAt"  timestamp not null default now(),
  "updatedAt"  timestamp not null default now(),
  constraint form_versions_form_id_version unique ("formId", version),
  constraint form_versions_status_check
    check (status in ('draft', 'published', 'archived')),
  constraint form_versions_version_check check (version >= 1),
  constraint form_versions_published_at_check
    check (status <> 'published' or "publishedAt" is not null)
);

-- Satu form hanya boleh punya SATU versi published. Partial unique index
-- menahan dua request publish paralel yang lolos validasi backend.
create unique index form_versions_one_published_per_form
  on form_versions ("formId") where status = 'published';

create index form_versions_form_id_status_idx
  on form_versions ("formId", status);

create table form_sections (
  id              uuid primary key default gen_random_uuid(),
  "formVersionId" uuid not null
    references form_versions(id) on delete cascade,
  -- Hanya FK ke id: parent dari versi form lain TIDAK ditolak database.
  -- Aturan "parent satu versi" divalidasi di backend.
  "parentId"      uuid references form_sections(id) on delete cascade,
  nama            varchar(100) not null,
  deskripsi       text,
  urutan          integer not null,
  aktif           boolean not null default true,
  "createdAt"     timestamp not null default now(),
  "updatedAt"     timestamp not null default now(),
  -- Syarat FK komposit form_fields (sectionId, formVersionId) -> (id, formVersionId).
  constraint form_sections_id_form_version_id unique (id, "formVersionId")
);

create index form_sections_form_version_urutan_idx
  on form_sections ("formVersionId", urutan);

create index form_sections_parent_id_idx on form_sections ("parentId");

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. Field
--
-- `formVersionId` didenormalisasi dari section supaya `nama` (identifier teknis)
-- bisa dijamin unik per versi form. Konsistensinya dengan section dijamin FK
-- komposit di bawah, jadi kolom ini tidak bisa menyimpang dari section-nya.
-- ─────────────────────────────────────────────────────────────────────────────
create table form_fields (
  id                 uuid primary key default gen_random_uuid(),
  "formVersionId"    uuid not null references form_versions(id) on delete cascade,
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
  aktif              boolean not null default true,
  "createdAt"        timestamp not null default now(),
  "updatedAt"        timestamp not null default now(),
  constraint form_fields_section_version_fk
    foreign key ("sectionId", "formVersionId")
    references form_sections (id, "formVersionId") on delete cascade,
  constraint form_fields_form_version_nama_key
    unique ("formVersionId", nama)
);

create index form_fields_section_urutan_idx on form_fields ("sectionId", urutan);

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. Aturan field (opsi jawaban + aturan visibility dalam satu tabel)
--
-- sourceFieldId ON DELETE SET NULL: menghapus field sumber tidak boleh
-- diam-diam menghapus aturan milik field lain. CASCADE yang lama bisa melakukan
-- itu, dan aturan ikut hilang tanpa jejak.
--
-- sourceFieldId sengaja BOLEH null. Postgres menjalankan SET NULL sebelum baris
-- sumber hilang, jadi kalau check constraint di bawah ikut mensyaratkan
-- sourceFieldId not null, field sumber jadi tidak bisa dihapus sama sekali.
-- Aturan dibiarkan yatim supaya bisa diperbaiki/nonaktifkan sendiri di editor.
-- ─────────────────────────────────────────────────────────────────────────────
create table form_field_rules (
  id             uuid primary key default gen_random_uuid(),
  "fieldId"      uuid not null references form_fields(id) on delete cascade,
  tipe           form_field_rule_type not null,
  "sourceFieldId" uuid references form_fields(id) on delete set null,
  operator       form_field_rule_operator,
  value          text,
  label          varchar(255),
  urutan         integer not null default 0,
  aktif          boolean not null default true,
  "createdAt"    timestamp not null default now(),
  "updatedAt"    timestamp not null default now(),
  constraint form_field_rules_visibility_check check (
    tipe <> 'visibility' or operator is not null
  ),
  constraint form_field_rules_option_check check (
    tipe <> 'option' or value is not null
  )
);

create index form_field_rules_field_urutan_idx
  on form_field_rules ("fieldId", urutan);

create index form_field_rules_source_field_id_idx
  on form_field_rules ("sourceFieldId");

-- ─────────────────────────────────────────────────────────────────────────────
-- 9. Survei, jawaban, lampiran
--
-- survey_entries hanya punya FK ke surveys dan ke form_fields. Database tidak
-- tahu apakah field yang dijawab milik form versi milik survei itu; itu
-- divalidasi di backend sebelum insert.
-- ─────────────────────────────────────────────────────────────────────────────
create table surveys (
  id             uuid primary key default gen_random_uuid(),
  "formVersionId" uuid not null references form_versions(id),
  "wargaNik"     varchar(16) not null references data_warga(nik),
  "petugasId"    uuid not null references users(id),
  tanggal        date not null,
  "createdAt"    timestamp not null default now(),
  "updatedAt"    timestamp not null default now()
);

create index surveys_form_version_id_idx on surveys ("formVersionId");
create index surveys_warga_nik_idx on surveys ("wargaNik");
create index surveys_petugas_id_idx on surveys ("petugasId");
create index surveys_tanggal_idx on surveys (tanggal);
create index surveys_petugas_tanggal_idx on surveys ("petugasId", tanggal);

create table survey_entries (
  id         uuid primary key default gen_random_uuid(),
  "surveyId" uuid not null references surveys(id) on delete cascade,
  "fieldId"  uuid not null references form_fields(id),
  value      jsonb,
  "createdAt" timestamp not null default now(),
  "updatedAt" timestamp not null default now(),
  constraint survey_entries_survey_id_field_id unique ("surveyId", "fieldId")
);

create index survey_entries_field_id_idx on survey_entries ("fieldId");

create table survey_files (
  id         uuid primary key default gen_random_uuid(),
  "surveyId" uuid not null references surveys(id) on delete cascade,
  "fieldId"  uuid not null references form_fields(id),
  "fileUrl"  text not null,
  "fileName" varchar(255),
  "mimeType" varchar(100),
  "fileSize" integer,
  "createdAt" timestamp not null default now(),
  constraint survey_files_survey_id_field_id unique ("surveyId", "fieldId")
);

create index survey_files_survey_id_idx on survey_files ("surveyId");

-- ─────────────────────────────────────────────────────────────────────────────
-- 10. Jejak audit
--
-- NIK disimpan SUDAH DIMASKING (kolom nikMasked varchar(16)). NIK mentah tidak
-- boleh masuk tabel ini karena kolomnya dibaca siapa pun yang punya akses DB,
-- termasuk saat backup. Masking dilakukan di backend sebelum insert.
-- ─────────────────────────────────────────────────────────────────────────────
create table audit_logs (
  id          uuid primary key default gen_random_uuid(),
  "userId"    uuid references users(id) on delete set null,
  aksi        audit_action not null,
  entitas     varchar(40) not null,
  "entitasId" varchar(64),
  "nikMasked" varchar(16),
  sebelum     jsonb,
  sesudah     jsonb,
  ip          varchar(64),
  "createdAt" timestamp not null default now()
);

create index audit_logs_user_created_idx on audit_logs ("userId", "createdAt");
create index audit_logs_entitas_idx on audit_logs (entitas, "entitasId");
create index audit_logs_created_idx on audit_logs ("createdAt");

-- ─────────────────────────────────────────────────────────────────────────────
-- 11. updatedAt diisi otomatis
--
-- Kolom updatedAt punya default now() yang hanya berlaku saat INSERT. Tanpa
-- trigger, setiap UPDATE diam-diam meninggalkan updatedAt lama, sehingga
-- "kapan form ini terakhir diubah" jadi tidak bisa dipercaya.
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function set_updated_at() returns trigger
language plpgsql as $$
begin
  new."updatedAt" = now();
  return new;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'wilayah_kerja', 'fasilitas_kesehatan', 'users', 'forms', 'form_versions',
    'form_sections', 'form_fields', 'form_field_rules', 'surveys', 'survey_entries'
  ] loop
    execute format(
      'create trigger %I_set_updated_at before update on %I
       for each row execute function set_updated_at()',
      t, t
    );
  end loop;
end
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 12. valid_session
--
-- Dipakai sebagai kolom unique di schema.ts; dijamin di sini kalau versi
-- sebelumya belum punya.
-- ─────────────────────────────────────────────────────────────────────────────
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'valid_session'::regclass and contype = 'u'
  ) then
    alter table valid_session add constraint valid_session_token_key unique (token);
  end if;
end
$$;

commit;
