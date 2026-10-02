import { date, index, pgPolicy, pgTable, text, varchar, boolean, smallint, numeric } from "drizzle-orm/pg-core";
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
}, (t) => [
  // 20.454 baris, dan sampai sekarang satu-satunya index adalah primary key
  // `raw_id`. Tanpa ini `WHERE nik = $1` (dipakai saat menyimpan warga dari form
  // Kunjungan Rumah) scan seluruh tabel.
  index("data_warga_import_nik_idx").on(t.nik),
  // Pencarian partial `nama_art`/`nama_kk`/`nik` ILIKE '%q%' butuh operator class
  // trigram, yang tidak bisa ditulis di sini — `IndexBuilder` hanya menerima
  // PgIndexMethod dan kolom, bukan opclass bebas. Index GIN-nya dibuat lewat
  // drizzle/manual/20261001_data_warga_import-index.sql.
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