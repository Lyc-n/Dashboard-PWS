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
  // BUKAN enum `pekerjaan`. Data mentah dari Kemenkes memakai kosakata sendiri:
  // ada 53 nilai berbeda ("Belum/Tidak Bekerja", "Karyawan Swasta",
  // "Buruh Harian Lepas", "Tukang Las/Pandai Besi", ...) sedangkan enum `pekerjaan`
  // cuma punya 11 nilai dan tidak ada satu pun yang cocok. Karena itu kolom ini
  // diserialisasi sebagai text. Jangan diubah jadi enum: 20.454 baris yang sudah
  // masuk tidak akan bisa di-cast.
  //
  // Perhatikan bahwa data_warga.pekerjaan tetap enum. Artinya langkah pemetaan
  // dari 53 nilai mentah ini ke 11 nilai enum belum diputuskan, dan itu keputusan
  // bisnis, bukan sekadar pekerjaan teknis.
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
  // RLS aktif di database dengan satu policy read-only untuk peran `authenticated`.
  // Dicatat di sini supaya `drizzle-kit generate` tidak mengira policy ini asing
  // dan tidak proposing untuk menghapusRLS-nya. Policy `restrictive` berarti tabel
  // hanya bisa dibaca lewat peran yang sudah login, dan tidak ada policy INSERT /
  // UPDATE / DELETE sama sekali.
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
  // Sama seperti data_warga_import: RLS read-only untuk peran `authenticated`.
  pgPolicy("Allow read-only access", {
    as: "restrictive",
    for: "select",
    to: ["authenticated"],
    using: sql`true`,
  }),
]);