-- Hapus partial unique index `form_versions_one_published_per_form`.
--
-- Latar belakang: index ini adalah salah satu dari dua mekanisme yang menjaga
-- aturan "satu form hanya boleh punya satu versi berstatus 'published'".
-- Mekanisme satunya ada di `terbitkanVersiForm()`
-- (src/features/form-builder/services/form-version.server.ts): archive versi
-- published yang lama lalu tulis versi baru, semuanya dalam satu transaksi.
-- Index + row lock + archive berarti tiga lapis untuk satu aturan.
--
-- Setelah index ini dihapus, aturan itu tetap dijaga satu kali saja: di dalam
-- transaksi publish. Yang hilang hanya jaring pengaman di database, bukan
-- ketiadaan penetration nya.
--
-- Kalau aturan ini nanti perlu ditegakkan database lagi, index partial-nya
-- satu baris: `create unique index form_versions_one_published_per_form on
-- form_versions (formId) where status = 'published';`

begin;

drop index if exists form_versions_one_published_per_form;

commit;