-- Uji constraint form builder v2. Semua dijalankan di dalam transaksi yang di-rollback,
-- jadi tidak mengubah data. Jalankan: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f file ini
begin;

do $$
declare
  v_form smallint;
  v_wil smallint;
  v_fas smallint;
  v_user uuid;
  v_ver uuid;
  v_ver2 uuid;
  v_sec uuid;
  v_field uuid;
  v_field_sumber uuid;
  v_rule uuid;
  v_sec2 uuid;
  gagal text := '';
begin
  -- setup minimal
  insert into wilayah_kerja (kecamatan, kelurahan)
  values ('Kec A', 'Kel A') returning id into v_wil;

  insert into fasilitas_kesehatan ("wilayahKerjaId", "fasKesType", nama, alamat)
  values (v_wil, 'Posyandu', 'Posyandu 1', 'Jl. 1') returning id into v_fas;

  -- `users` adalah daftar kader murni: tanpa kolom `role` maupun `pinHash`.
  insert into users ("fasKesId", nama)
  values (v_fas, 'Petugas 1') returning id into v_user;

  insert into forms (nama) values ('Form Uji') returning id into v_form;
  insert into form_versions ("formId", version) values (v_form, 1) returning id into v_ver;
  insert into form_sections ("formVersionId", nama, urutan)
  values (v_ver, 'Sec 1', 0) returning id into v_sec;

  -- (1) forms.nama harus unik global
  begin
    insert into forms (nama) values ('Form Uji');
    raise notice 'GAGAL: nama form dobel diterima';
  exception when unique_violation then
    raise notice 'OK  : forms.nama unik_global';
  end;

  -- (2) form_versions.version minimal 1
  begin
    insert into form_versions ("formId", version) values (v_form, 0);
    raise notice 'GAGAL: version 0 diterima';
  exception when check_violation then
    raise notice 'OK  : version >= 1';
  end;

  -- (3) hanya satu versi published per form
  --
  -- Tidak ditegakkan database. Aturan ini dijaga `terbitkanVersiForm()` di
  -- backend: versi published lama di-archive dalam transaksi yang sama sebelum
  -- versi baru ditulis. Yang bisa diuji di sini hanyalah bahwa penomoran versi
  -- unik per form, jadi dua versi published boleh ada tapi tidak boleh memakai
  -- nomor yang sama.
  begin
    insert into form_versions ("formId", version, status, "publishedAt")
    values (v_form, 1, 'published', now());
    raise notice 'GAGAL: nomor versi dobel diterima';
  exception when unique_violation then
    raise notice 'OK  : form_versions_version_unik_per_form';
  end;

  -- (3b) published wajib punya publishedAt
  begin
    update form_versions set status = 'published', "publishedAt" = null
    where id = v_ver;
    raise notice 'GAGAL: published tanpa publishedAt diterima';
  exception when check_violation then
    raise notice 'OK  : published_wajib_punya_publishedAt';
  end;

  -- (4) form_fields.nama unik per formVersionId
  insert into form_fields ("formVersionId", "sectionId", nama, label, tipe)
  values (v_ver, v_sec, 'tekanan_darah', 'Tekanan Darah', 'number');

  begin
    insert into form_fields ("formVersionId", "sectionId", nama, label, tipe)
    values (v_ver, v_sec, 'tekanan_darah', 'Duplikat', 'number');
    raise notice 'GAGAL: nama field dobel dalam satu versi diterima';
  exception when unique_violation then
    raise notice 'OK  : field_nama_unik_per_formVersionId';
  end;

  -- nama yang sama BOLEH dipakai di versi lain
  insert into form_versions ("formId", version) values (v_form, 3) returning id into v_ver2;
  insert into form_sections ("formVersionId", nama, urutan)
  values (v_ver2, 'Sec 1', 0) returning id into v_sec2;
  insert into form_fields ("formVersionId", "sectionId", nama, label, tipe)
  values (v_ver2, v_sec2, 'tekanan_darah', 'Tekanan Darah', 'number');
  raise notice 'OK  : nama_field_boleh_sama_di_versi_lain';

  -- (5) FK komposit: field harus versi yang sama dengan section-nya
  begin
    insert into form_fields ("formVersionId", "sectionId", nama, label, tipe)
    values (v_ver2, v_sec, 'bukti_beda', 'Beda Versi', 'text');
    raise notice 'GAGAL: field versi lain di section diterima';
  exception when foreign_key_violation then
    raise notice 'OK  : field_wajib_satu_versi_dengan_section';
  end;

  select id into v_field from form_fields where nama = 'tekanan_darah' and "formVersionId" = v_ver;

  -- (6) form_field_options: satu baris = satu pilihan jawaban, `value` wajib ada
  begin
    insert into form_field_options ("fieldId", value)
    values (v_field, null);
    raise notice 'GAGAL: opsi jawaban tanpa nilai diterima';
  exception when not_null_violation then
    raise notice 'OK  : opsi_jawaban_wajib_punya_nilai';
  end;

  -- (7) pilihan jawaban ikut terhapus bersama field-nya (ON DELETE CASCADE)
  insert into form_fields ("formVersionId", "sectionId", nama, label, tipe)
  values (v_ver, v_sec, 'sumber_dihapus', 'Sumber', 'text')
  returning id into v_field_sumber;

  insert into form_field_options ("fieldId", value)
  values (v_field_sumber, 'Ya')
  returning id into v_rule;

  delete from form_fields where id = v_field_sumber;

  if exists (select 1 from form_field_options where id = v_rule) then
    raise notice 'GAGAL: opsi ikutnya tidak terhapus';
  else
    raise notice 'OK  : opsi_ikut_terhapus_bersama_field';
  end if;

  -- (8) users.fasKesId ON DELETE RESTRICT
  --
  -- `restrict_violation` hanya ada di Postgres 18 ke atas; di versi lama RESTRICT
  -- dilaporkan sebagai `foreign_key_violation`. Tangkap keduanya supaya skrip ini
  -- tidak gagal karena versi server, bukan karena constraint-nya.
  begin
    delete from fasilitas_kesehatan where id = v_fas;
    raise notice 'GAGAL: hapus fasilitas cascade ke user';
  exception when restrict_violation or foreign_key_violation then
    raise notice 'OK  : users_fasKesId_restrict';
  end;

  -- (9) survey_entries unik per (surveyId, fieldId)
  insert into surveys ("formVersionId", "wargaNik", "petugasId", tanggal)
  select v_ver, '0000000000000001', v_user, current_date
  where exists (select 1 from data_warga where nik = '0000000000000001');

  if exists (select 1 from data_warga) then
    insert into surveys ("formVersionId", "wargaNik", "petugasId", tanggal)
    values (v_ver, (select nik from data_warga limit 1), v_user, current_date);
    insert into survey_entries ("surveyId", "fieldId", value)
    values ((select id from surveys limit 1), v_field, '130');
    begin
      insert into survey_entries ("surveyId", "fieldId", value)
      values ((select id from surveys limit 1), v_field, '131');
      raise notice 'GAGAL: jawaban dobel untuk field yang sama';
    exception when unique_violation then
      raise notice 'OK  : survey_entries_unik_per_field';
    end;
  else
    raise notice 'SKIP: survey_entries unik (data_warga kosong)';
  end if;

  -- (10) updatedAt terisi otomatis saat UPDATE
  update wilayah_kerja set kecamatan = 'Kec B' where id = v_wil;
  if (select "updatedAt" from wilayah_kerja where id = v_wil) > now() - interval '1 second' then
    raise notice 'OK  : updatedAt_trigger';
  else
    raise notice 'GAGAL: updatedAt tidak berubah';
  end if;
end
$$;

rollback;
