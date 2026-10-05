-- Rename `form_field_rules` menjadi `form_field_options`.
--
-- Latar belakang: setelah aturan visibility dihapus (lihat
-- 20261005_hapus-aturan-visibility.sql), tabel ini tidak lagi berisi "aturan"
-- apa pun. Satu baris = satu pilihan jawaban milik satu field. Nama `rules`
-- sekarang menyesatkan: pembaca mengira masih ada dua jenis isi, padahal tidak.
--
-- Yang berubah hanya nama. Kolom, index, dan constraint isinya sama persis;
-- `form_fields.sectionId` dan trigger `updatedAt` tetap menunjuk tabel yang sama.
--
-- CATATAN: `ALTER TABLE ... RENAME TO` tidak me-rename constraint, index, dan
-- trigger. Semuanya ditulis eksplisit di bawah supaya tidak ada nama warisan
-- yang masih sebut `form_field_rules`.
--
-- Tabel dibuat di drizzle/manual/20260928_form-builder-v2.sql. File itu tidak
-- diubah: kalau ikut di-rename, putar ulang file lama akan gagal karena nama
-- yang sudah dipakai tabel baru.

begin;

alter table form_field_rules rename to form_field_options;

alter index form_field_rules_field_urutan_idx rename to form_field_options_field_urutan_idx;

-- Nama constraint FK memuat huruf besar ("fieldId"), jadi harus ditulis dalam
-- kutip dua. Tanpa itu Postgres mengubahnya jadi huruf kecil dan rename-nya gagal.
alter table form_field_options
  rename constraint "form_field_rules_fieldId_form_fields_id_fkey"
  to "form_field_options_fieldId_form_fields_id_fkey";

alter table form_field_options
  rename constraint form_field_rules_pkey
  to form_field_options_pkey;

alter trigger form_field_rules_set_updated_at
  on form_field_options
  rename to form_field_options_set_updated_at;

commit;