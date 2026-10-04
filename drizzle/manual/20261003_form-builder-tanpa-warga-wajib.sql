-- Form buatan Form Builder tidak lagi menunjuk warga per-submission.
--
-- Alasan: `forms.subjekWargaWajib` yang dulu selalu true untuk form yang dibuat
-- dari Form Builder membuat dua hal sekaligus:
--   1. Halaman isi memaksa petugas memilih NIK warga untuk form yang isinya
--      boleh tentang apa saja, padahal blok pencatatan sudah tidak lagi
--      ditampilkan sebagai section form.
--   2. Record-nya otomatis punya `surveys.wargaNik`, jadi ikut terhitung di
--      hitungan cakupan warga (dashboard, /sasaran, laporan) dan tidak bisa
--      dibedakan dari Form Kunjungan Rumah.
--
-- Yang DISENTUH hanya form tanpa `kode`, yaitu form yang dibuat lewat
-- Form Builder (pola yang sama dengan `listFormBaru` di
-- src/features/form-builder/services/form.server.ts). Form bawaan seeder punya
-- `kode` terisi — CHECKLIST_KUNJUNGAN_RUMAH dan KEGIATAN_PEMBERDAYAAN — dan
-- nilai `subjek_warga_wajib`-nya tidak diubah, jadi Form Kunjungan Rumah tetap
-- menanyakan warga seperti seharusnya.
--
-- Aman dijalankan berulang: hanya mengubah baris yang masih bernilai true.
--
-- Catatan penamaan kolom:
--   * Kolom camelCase WAJIB di-quote (drizzle memakai camelCase; Postgres
--     melipat identifier tanpa kutip ke huruf kecil).

UPDATE forms
SET subjek_warga_wajib = false
WHERE kode IS NULL
  AND subjek_warga_wajib = true;

-- Cek hasil: expect 0 baris tersisa untuk form Form Builder.
SELECT id, nama, kode, subjek_warga_wajib
FROM forms
ORDER BY kode NULLS LAST, nama;