import { date, pgPolicy, pgTable, text, varchar, boolean, smallint, numeric } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { hubunganKeluargaEnum, jenisKelaminEnum, statusKawinEnum, agama, pendidikanEnum } from "./type-enum";

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
}, () => [
  pgPolicy("Allow read-only access", {
    as: "restrictive",
    for: "select",
    to: ["authenticated"],
    using: sql`true`,
  }),
]);

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
}, () => [
  pgPolicy("Allow read-only access", {
    as: "restrictive",
    for: "select",
    to: ["authenticated"],
    using: sql`true`,
  }),
]);