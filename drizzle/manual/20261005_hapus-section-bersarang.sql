-- Hapus dukungan section bersarang dari `form_sections`.
--
-- Latar belakang: kolom `parentId` membuat section bisa punya section anak, jadi
-- editor harus menampilkan pohon, menyimpan tingkat kedalaman, dan menjaga agar
-- tidak ada siklus. Semua itu tidak pernah dipakai: 0 dari 16 baris
-- `form_sections` punya `parentId` terisi. Setelah kolom ini dihapus, section
-- selalu berurutan datar di dalam satu versi form, dan `urutan` sudah cukup untuk
-- menentukan tampilannya.
--
-- `form_sections` sekarang jadi daftar biasa: semua section milik satu versi
-- form, diurutkan `urutan`, tanpa konsep anak.
--
-- Tidak ada data yang hilang: kolom yang dihapus semua NULL.

begin;

drop index if exists form_sections_parent_id_idx;

alter table form_sections drop column if exists "parentId";

commit;