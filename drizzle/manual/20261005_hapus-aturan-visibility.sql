-- Hapus aturan visibility dari `form_field_rules`.
--
-- Latar belakang: `form_field_rules` awalnya menampung dua jenis baris lewat kolom
-- `tipe` enum — 'option' (pilihan jawaban) dan 'visibility' (aturan tampil/sembunyi
-- sebuah field bergantung pada nilai field lain). Di database tidak ada satu pun
-- baris bertipe 'visibility' (0 dari 143), jadi seluruh kolom, index, constraint,
-- dan enum yang hanya untuk fitur itu dihapus.
--
-- Setelah migrasi ini `form_field_rules` hanya menyimpan pilihan jawaban:
-- satu baris = satu opsi milik satu field. Kolom `value` jadi NOT NULL karena
-- tidak ada lagi baris yang boleh punya `value` kosong.
--
-- Tidak ada data yang hilang: yang dihapus hanya baris dengan tipe 'visibility'
-- dan jumlahnya nol.

begin;

alter table form_field_rules
  drop constraint if exists form_field_rules_option_check;
alter table form_field_rules
  drop constraint if exists form_field_rules_visibility_check;
alter table form_field_rules
  drop constraint if exists form_field_rules_source_field_id_fkey;

drop index if exists form_field_rules_source_field_id_idx;

alter table form_field_rules drop column if exists tipe;
alter table form_field_rules drop column if exists "sourceFieldId";
alter table form_field_rules drop column if exists operator;

drop type if exists form_field_rule_type;
drop type if exists form_field_rule_operator;

-- `value` sekarang wajib terisi di setiap baris.
alter table form_field_rules
  alter column value set not null;

commit;