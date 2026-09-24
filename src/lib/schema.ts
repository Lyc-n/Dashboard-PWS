import { date, integer, pgTable, pgEnum,text, varchar, numeric, boolean, uuid} from "drizzle-orm/pg-core";
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
])

export const dataWargaTable = pgTable("data_warga", {
    // id: integer().primaryKey().generatedAlwaysAsIdentity(),
    nik: integer().notNull().primaryKey(),
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
    agama: text().notNull(),
    pendidikan: pendidikanEnum().notNull(),
    pekerjaan: text().notNull(),
});

export const surveyor = pgTable("surveyor", {
    id: uuid().primaryKey().defaultRandom(),
    nama: varchar({ length: 255 }).notNull(),
});

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

export const validSession = pgTable("valid_session",{
    uid: uuid().primaryKey().defaultRandom(),
    token: text().notNull(),
})