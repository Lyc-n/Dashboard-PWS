import { date, integer, pgTable, pgEnum,text, varchar, boolean, timestamp, uuid, jsonb, smallint, numeric} from "drizzle-orm/pg-core";
import type { AnyPgColumn } from "drizzle-orm/pg-core";

export const statusKawinEnum = pgEnum('status_kawin', [
  'belum kawin',
  'kawin',
  'cerai mati',
  'cerai hidup',
])
export const jenisKelaminEnum = pgEnum('jenis_kelamin', [
  'laki-laki',
  'perempuan',
])
export const hubunganKeluargaEnum = pgEnum('hubungan_keluarga', [
  'Anak',
  'Istri',
  'Orang Tua',
  'Kepala Keluarga',
  'Cucu',
  'Famili lain',
  'Mertua',
  'Menantu',
  'Pembantu',
  'Lainnya',
  'Suami',
])
export const pendidikanEnum = pgEnum('pendidikan', [
  'SLTA/Sederajat',
  'Tidak/Belum Sekolah',
  'Belum Tamat SD/Sederajat',
  'SLTP/Sederajat',
  'Strata III',
  'Diploma IV/Strata I',
  'Akademi/Diploma III/ Sarjana Muda',
  'Tamat SD/Sederajat',
  'Strata-II',
  'Diploma I/II',
])

export const agama = pgEnum('agama', ['Budha', 'Hindu', 'Islam', 'Katholik', 'Kristen', 'Konghucu']);

export const dataWargaTable = pgTable("data_warga", {
    // id: integer().primaryKey().generatedAlwaysAsIdentity(),
    nik: varchar({ length: 16 }).notNull().primaryKey(),
    nama_art: varchar({ length: 255 }).notNull(),
    nama_kk: varchar({ length: 255 }).notNull(),
    hubungan_keluarga: hubunganKeluargaEnum().notNull(),
    alamat:text().notNull(),
    tgl_lahir: date().notNull(),
    rt: integer().notNull(),
    rw: integer().notNull(),
    kecamatan: text().notNull(),
    kelurahan: text().notNull(),
    kota: text().notNull(),
    status_kawin: statusKawinEnum().notNull(),
    petugas: text().notNull(),
    jenis_kelamin: jenisKelaminEnum().notNull(),
    wanita_usia_hamil:boolean().notNull(),
    agama: agama().notNull(),
    pendidikan: pendidikanEnum().notNull(),
    pekerjaan: text().notNull(),
});

export const dataWargaImport = pgTable("data_warga_import", {
  rawId: varchar("raw_id").primaryKey(),
  namaKk: varchar("nama_kk"),
  nik: varchar("nik"),
  jumlahArt: smallint("jumlah_art"),
  namaArt: varchar("nama_art"),
  hubunganKeluarga: hubunganKeluargaEnum(),
  tglLahir: date("tgl_lahir", { mode: "string", }),
  jenisKelamin: jenisKelaminEnum(),
  statusKawin: statusKawinEnum(),
  agama: agama(),
  pendidikan: pendidikanEnum(),
  pekerjaan: text(),
  alamat: text(),
  provinsi: text(),
  kabKota: text(),
  kecamatan: text(),
  kelurahan: text(),
  rw: smallint(),
  rt: smallint(),
  iksBesar: numeric(),
});

export const riwayatKsImport = pgTable("riwayat_ks_import", {
  rawId: varchar("raw_id").primaryKey().references(() => dataWargaImport.rawId, { onUpdate: "cascade", onDelete: "cascade", }),
  kepesertaanJkn: boolean(),
  merokok: boolean(),
  tersediaSaranaAirBersih: boolean(),
  jenisSumberAirTerlindung: text(),
  tersediaJambanKeluarga: boolean(),
  jenisJambanSaniter: text(),
  diagnosisOdgj: boolean(),
  minumObatOdgjTeratur: boolean(),
  adaArtDipasung: boolean(),
  perilakuBabDijamban: text(),
  perilakuPenggunaanAirBersih: text(),
  diagnosisTbParu: boolean(),
  minumObatTbTeratur: boolean(),
  batukBerdahakLebihDari2Minggu: boolean(),
  diagnosisHipertensi: boolean(),
  pengkuranTekananDarah: boolean(),
  minumObatHipertensiTeratur: boolean(),
  sistolik: smallint(),
  diastolik: smallint(),
  pakaiKb: boolean(),
  ketKb: text(),
  persalinanDiFaskes: boolean(),
  asiEksklusif: boolean(),
  imunisasiLengkap: boolean(),
});

export const surveyor = pgTable("surveyor", {
    id: uuid().primaryKey().defaultRandom(),
    nama: varchar({ length: 255 }).notNull(),
});

/*
export const riwayatSurvey = pgTable("riwayat_survey", {
    id: uuid().primaryKey().defaultRandom(),
    nama: varchar({ length: 255 }).notNull(),
    tgl_survei: date().notNull() ,
    nik_warga: integer().references(():AnyPgColumn => dataWargaTable.nik),
    iks_inti: numeric({ scale: 2 }).notNull(),
    iks_besar: numeric({ scale: 2 }).notNull(),
    petugas_id: integer().references(():AnyPgColumn => surveyor.id),
    jumlah_art_di_wawancara: integer().notNull(),
    ada_air_bersih: boolean().notNull(),
    sumber_air_terlindung: boolean().notNull(),
    ada_jamban_keluarga: boolean().notNull(),
    jamban_saniter: boolean().notNull(),
    ada_art_gangguan_jiwa: boolean().notNull(),
    minum_obat_gangguan_jiwa_teratur: boolean().notNull(),
    ada_art_dipasung: boolean().notNull(),

});
*/


// tabel untuk pilihan form, sehingga user bisa membuat atau menghapus form 
export const forms = pgTable("forms", {
    id: uuid().primaryKey().notNull().defaultRandom(),
    nama: varchar({ length: 100 }).notNull(), // form default saat ini ada Form Kunjungan Rumah | Form Kegiatan Pemberdayaan
    deskripsi: text(), // deskripsi form
    aktif: boolean().notNull().default(true), // tampilkan form atau tidak, agar user bisa menonaktifkan form sementara sebelum hapus total
    createdAt: timestamp().defaultNow().notNull(),
    updatedAt: timestamp().defaultNow().notNull(),
})

// tabel untuk membagi form jadi beberapa bagian
export const formSections = pgTable("form_sections", {
    id: uuid().primaryKey().defaultRandom(),
    formId: uuid().notNull().references(() => forms.id, { onDelete: "cascade", }), // selalu terhubung dengan form 
    nama: varchar({ length: 100 }).notNull(), // contoh section Identitas | Sasaran | Tindak Lanjut | Dokumentasi 
    deskripsi: text(),
    urutan: integer().notNull(),
    createdAt: timestamp().defaultNow().notNull(),
    updatedAt: timestamp().defaultNow().notNull(),
})

// tabel pertanyaan tiap section 
export const questions = pgTable("questions", {
    id: uuid().primaryKey().defaultRandom(),
    sectionId: uuid().notNull().references(() => formSections.id, { onDelete: "cascade", }), // selalu terhubung dengan section
    parentId: uuid().references((): AnyPgColumn => questions.id, { onDelete: "cascade", }), // id untuk sub questions
    /* Misalkan 
      Q1. Apakah ada ibu hamil?
        ├── { kosong }                      jika tanpa parentId
        ├── Q2. Siapa nama ibu hamil?       muncul jika parentId Q1
        ├── Q3. Berapa usia kehamilan?      muncul jika parentId Q1
        └── Q4. Apakah rutin periksa?       muncul jika parentId Q1
    */
    pertanyaan: text().notNull(),
    tipe: varchar({ length: 30 }).notNull(), // text | number | date | select | radio | checkbox
    wajib: boolean().notNull().default(false), // wajib diisi atau tidak
    urutan: integer().notNull(), // urutan tampilan
    aktif: boolean().notNull().default(true), // tampilkan atau tidak
    createdAt: timestamp().defaultNow().notNull(),
    updatedAt: timestamp().defaultNow().notNull(),
})

// tabel untuk menangani input image
export const surveyImages = pgTable("survey_images", {
    id: uuid().primaryKey().defaultRandom(),
    surveyId: uuid().notNull().references(() => surveys.id, { onDelete: "cascade", }), // penanda terhubung dengan survey yang mana
    questionId: uuid().notNull().references(() => questions.id, { onDelete: "cascade", }), // penanda terhubung dengan question apa
    fileUrl: text().notNull(), // simpan url, file disimpan di supabase storage
    fileName: varchar({ length: 255 }),
    mimeType: varchar({ length: 100 }),
    fileSize: integer(),
    createdAt: timestamp().defaultNow().notNull(),
});

// tabel riwayat survey
export const surveys = pgTable("surveys", {
    id: uuid().primaryKey().defaultRandom(),
    formId: uuid().notNull().references(() => forms.id), // penanda terhubung dengan form apa
    nik: varchar({ length: 16 }).notNull().references(() => dataWargaTable.nik), // penanda terhubung dengan data warga apa
    // [perbaikan] `petugasId` integer → uuid — expect: selaras `surveyor.id` uuid; tanpa ini
    //   constraint FK "surveys.petugasId → surveyor.id" gagal dibuat (tipe beda) saat migrate.
    petugasId: uuid().notNull().references(() => surveyor.id), // penanda terhubung dengan petugas atau surveyor
    tanggal: date().notNull(), // tanggal pelaksanaan survey
    jawaban: jsonb().notNull(), // jawaban survey
    createdAt: timestamp().defaultNow().notNull(),
    updatedAt: timestamp().defaultNow().notNull(),
});

// kunjungan rumah — pengganti localStorage `pws-kunjungan-rumah`.
// payload = KunjunganRumahRecord penuh (fotos berisi fileUrl Supabase Storage, bukan base64).
export const kunjunganRumahRecords = pgTable("kunjungan_records", {
    id: uuid().primaryKey().defaultRandom(),
    payload: jsonb().notNull(),
    createdAt: timestamp().defaultNow().notNull(),
    updatedAt: timestamp().defaultNow().notNull(),
});

// kegiatan pemberdayaan — pengganti localStorage `pws-kegiatan`.
// payload = KegiatanRecord + peserta[] (nama/kel/hadir) agar laporan bisa audit.
export const kegiatanRecords = pgTable("kegiatan_records", {
    id: uuid().primaryKey().defaultRandom(),
    payload: jsonb().notNull(),
    createdAt: timestamp().defaultNow().notNull(),
    updatedAt: timestamp().defaultNow().notNull(),
});

export const validSession = pgTable("valid_session",{
    uid: uuid().primaryKey().defaultRandom(),
    token: text().notNull().unique(),
    expiresAt: timestamp().notNull(),
})
