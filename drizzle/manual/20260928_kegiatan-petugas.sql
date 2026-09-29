-- ============================================================================
-- Field "petugas" pada Form Kegiatan Pemberdayaan
--
-- Mengganti field teks `pj` (Penanggung jawab) dengan field select `petugas`
-- yang nilainya adalah `users.id`, supaya officers yang dipilih bisa disimpan
-- ke `surveys.petugasId`.
--
-- Kenapa diganti, bukan ditambah sebagai field baru: `pj` baseada teks bebas,
-- sehingga nama yang ditulis petugas tidak pernah bisa dicocokkan dengan akun
-- mana pun. Akibatnya `surveys.petugasId` selalu harus diisi terpisah dari form,
-- dan form yang sudah terisi tidak bisa dipakai untuk tahu siapa yang mencatat.
-- Setelah penggantian ini, officers di form dan `surveys.petugasId` berasal dari
-- sumber yang sama.
--
-- TIDAK ADA DATA YANG HILANG: tabel `kegiatan_records` sudah dihapus dan belum
-- ada satu pun submission kegiatan pada form versi ini, jadi tidak ada nilai
-- `pj` lama yang perlu dimigrasikan.
--
-- Idempoten: bisa dijalankan berkali-kali. Kalau `pj` sudah tidak ada dan
-- `petugas` sudah ada, tidak terjadi perubahan apa pun.
-- ============================================================================

BEGIN;

-- Hapus `pj` beserta `form_field_rules`-nya lebih dulu, karena nama field tidak
-- lagi dibutuhkan. Baris `form_field_rules` tidak punya ON DELETE CASCADE di
-- DB ini, jadi harus dihapus eksplisit sebelum baris field-nya.
DELETE FROM form_field_rules
WHERE "fieldId" IN (
  SELECT ff.id
  FROM form_fields ff
  JOIN form_sections fs ON fs.id = ff."sectionId"
  JOIN form_versions fv ON fv.id = ff."formVersionId"
  JOIN forms f ON f.id = fv."formId"
  WHERE f.kode = 'KEGIATAN_PEMBERDAYAAN'
    AND ff.nama = 'identitas::pj'
);

DELETE FROM form_fields ff
USING form_sections fs, form_versions fv, forms f
WHERE fs.id = ff."sectionId"
  AND fv.id = ff."formVersionId"
  AND f.id = fv."formId"
  AND f.kode = 'KEGIATAN_PEMBERDAYAAN'
  AND ff.nama = 'identitas::pj';

-- Tambahkan `petugas` di urutan yang sama dengan `pj` sebelumnya (6), supaya
-- urutan field lain tidak bergeser.
INSERT INTO form_fields (
  "formVersionId", "sectionId", nama, label, tipe, wajib, "urutan",
  "optionSourceType", "optionSourceKey", "jumlahKolom", "createdAt"
)
SELECT
  fv.id,
  fs.id,
  'identitas::petugas',
  'Petugas',
  'select',
  true,
  6,
  'users',
  'petugas',
  NULL,
  now()
FROM forms f
JOIN form_versions fv ON fv."formId" = f.id
JOIN form_sections fs ON fs."formVersionId" = fv.id
WHERE f.kode = 'KEGIATAN_PEMBERDAYAAN'
  AND fs.nama = 'identitas'
  AND NOT EXISTS (
    SELECT 1
    FROM form_fields existing
    WHERE existing."formVersionId" = fv.id
      AND existing.nama = 'identitas::petugas'
  );

COMMIT;
