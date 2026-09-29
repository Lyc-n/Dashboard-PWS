-- ============================================================================
-- Field "NIK sasaran utama" pada Form Kunjungan Rumah
--
-- Tanpa field ini, UI tidak punya tempat memasukkan NIK warga yang dikunjungi.
-- Backend membaca NIK dari `record.info.nik`, sehingga semua submission baru
-- gagal dengan "NIK wajib diisi" meskipun form terlihat lengkap.
--
-- Field ini menunjuk satu warga di `data_warga`. Satu kunjungan dihitung untuk
-- NIK tersebut di dashboard, Data Sasaran, dan laporan.
--
-- Idempoten: bisa dijalankan berkali-kali. Kalau field sudah ada, tidak terjadi
-- perubahan apa pun.
-- ============================================================================

BEGIN;

DO $$
DECLARE
  v_version_id uuid;
  v_section_id uuid;
BEGIN
  SELECT fv.id, fs.id
    INTO v_version_id, v_section_id
    FROM forms f
    JOIN form_versions fv ON fv."formId" = f.id
    JOIN form_sections fs ON fs."formVersionId" = fv.id
   WHERE f.kode = 'CHECKLIST_KUNJUNGAN_RUMAH'
     AND fv.status = 'published'
     AND fs.nama = 'keluargaInfo'
   ORDER BY fv.version DESC
   LIMIT 1;

  IF v_version_id IS NULL OR v_section_id IS NULL THEN
    RAISE EXCEPTION 'Form kunjungan rumah versi published atau section keluargaInfo tidak ditemukan.';
  END IF;

  IF NOT EXISTS (
    SELECT 1
      FROM form_fields
     WHERE "formVersionId" = v_version_id
       AND nama = 'keluargaInfo::nik'
  ) THEN
    UPDATE form_fields
       SET "urutan" = "urutan" + 1
     WHERE "formVersionId" = v_version_id
       AND "sectionId" = v_section_id
       AND "urutan" >= 2;

    INSERT INTO form_fields (
      "formVersionId", "sectionId", nama, label, tipe, wajib, "urutan"
    ) VALUES (
      v_version_id,
      v_section_id,
      'keluargaInfo::nik',
      'NIK sasaran utama',
      'text',
      true,
      2
    );
  END IF;
END $$;

COMMIT;
