import { eq, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db.server";
import { adminItems, adminPriorities, adminStaff, formFieldOptions, forms, formSections, questions } from "#/lib/schema/schema";

const KUNJUNGAN_RUMAH = "Form Kunjungan Rumah";
const PEMBERDAYAAN = "Form Kegiatan Pemberdayaan";

// Bentuk satu baris pertanyaan. Data di bawah dibekukan dari sumber kebenaran UI
// (createDefaultKunjunganRumahTemplates) oleh generator satu kali, lalu ditulis ulang
// sebagai literal di file ini. Seed sengaja tidak mengimpor modul UI: kalau template
// berubah, seeder harus ikut berubah eksplisit lewat file ini, bukan diam-diam lewat import.
interface SeedQuestion {
  // Key stabil untuk field. WAJIB diisi — ini yang jadi identitas jawaban di payload,
  // sedangkan `pertanyaan` cuma label yang boleh diedit admin. Karena itu `kode`, bukan
  // `pertanyaan`, yang dipakai sebagai kunci di UNIQUE (sectionId, kode) dan parentId.
  kode: string;
  pertanyaan: string;
  tipe: string;
  wajib: boolean;
  // Bucket layout di panel sasaran (identitas/kolom/bools/baha). Null untuk section
  // non-sasaran dan untuk form selain Kunjungan Rumah.
  bucket?: "identitas" | "kolom" | "bools" | "baha";
  // `kode` dari baris bertipe group. Dipakai untuk grouping struktural (mis. k1Tempat
  // anak dari k1). Bukan untuk mengatur field visibility — itu urusan ConditionalRule
  // di src/lib/kunjungan-rumah-form.ts.
  parent?: string;
  // Pilihan untuk tipe select/radio. Disimpan di tabel form_field_options, bukan jsonb,
  // supaya UNIQUE (questionId, value) bisa mencegah opsi dobel.
  opsi?: string[];
  hint?: string;
}

const KUNJUNGAN_RUMAH_SECTIONS = [
  { nama: "keluargaInfo", deskripsi: "Kartu keluarga, alamat, dan identitas pengumpulan data." },
  { nama: "anggota", deskripsi: "Data anggota rumah tangga." },
  { nama: "sanitasi", deskripsi: "Kondisi sanitasi, kesehatan, dan sarana air bersih." },
  { nama: "ibu-hamil", deskripsi: "Ibu hamil: K1-K6 per trimester, kelas ibu, skrining, edukasi." },
  { nama: "bersalin-nifas", deskripsi: "Ibu bersalin dan nifas: KF1-KF4, skrining, edukasi." },
  { nama: "bayi", deskripsi: "Bayi: kunjungan neonatus KN0-KN3, imunisasi, edukasi." },
  { nama: "balita", deskripsi: "Balita: pertumbuhan, imunisasi, vitamin A, obat cacing." },
  { nama: "remaja", deskripsi: "Remaja: pertumbuhan, imunisasi, skrining, edukasi." },
  { nama: "dewasa", deskripsi: "Dewasa: tekanan darah, gula darah, skrining, edukasi." },
  { nama: "lansia", deskripsi: "Lansia: tekanan darah, gula darah, aksesibilitas, skrining, edukasi." },
  { nama: "tbc", deskripsi: "TBC: diagnosis, pemeriksaan, kontak erat, edukasi." },
  { nama: "masalah", deskripsi: "Masalah kesehatan yang ditemukan beserta tindak pautannya." },
  { nama: "hasil", deskripsi: "Hasil kunjungan dan prioritas tindak lanjut." },
];

const PEMBERDAYAAN_SECTIONS = [
  { nama: "Identitas Kegiatan", deskripsi: "Data pokok kegiatan: nama, penanggung jawab, tanggal, jam." },
  { nama: "Kelurahan & Lokasi", deskripsi: "Jenis kegiatan, kelurahan, posyandu, lokasi, dan deskripsi." },
  { nama: "Peserta & Kehadiran", deskripsi: "Daftar peserta kegiatan dan status kehadiran." },
  { nama: "Dokumentasi", deskripsi: "Foto kegiatan beserta keterangan." },
];

const KUNJUNGAN_RUMAH_QUESTIONS: Record<string, SeedQuestion[]> = {
  "keluargaInfo": [
    { kode: "tglPengumpulan", pertanyaan: "Tanggal pengumpulan data", tipe: "date", wajib: true },
    { kode: "posyandu", pertanyaan: "Posyandu", tipe: "text", wajib: true },
    { kode: "kelurahan", pertanyaan: "Desa/Kelurahan", tipe: "text", wajib: false },
    { kode: "kecamatan", pertanyaan: "Kecamatan", tipe: "text", wajib: false },
    { kode: "puskesmas", pertanyaan: "Puskesmas", tipe: "text", wajib: false },
    { kode: "pustu", pertanyaan: "Pustu / posyandu prima", tipe: "text", wajib: false },
    { kode: "namaKK", pertanyaan: "Nama kepala keluarga", tipe: "text", wajib: false },
    { kode: "alamat", pertanyaan: "Alamat", tipe: "text", wajib: false },
    { kode: "hpKK", pertanyaan: "No. HP KK/anggota", tipe: "text", wajib: false },
    { kode: "kabKota", pertanyaan: "Kabupaten/Kota", tipe: "text", wajib: false },
    { kode: "provinsi", pertanyaan: "Provinsi", tipe: "text", wajib: false },
  ],
  "anggota": [
    { kode: "nama", pertanyaan: "Nama lengkap", tipe: "text", wajib: true },
    { kode: "nik", pertanyaan: "NIK", tipe: "text", wajib: true },
    { kode: "tglLahir", pertanyaan: "Tanggal lahir", tipe: "date", wajib: true },
    { kode: "jk", pertanyaan: "Jenis kelamin", tipe: "select", wajib: false, opsi: ["L", "P"] },
    { kode: "hubKK", pertanyaan: "Hubungan dengan KK", tipe: "select", wajib: false, opsi: ["Kepala Keluarga", "Istri", "Anak", "Menantu", "Cucu", "Orang tua", "Mertua", "Famili lain", "Lainnya"] },
    { kode: "statusKawin", pertanyaan: "Status perkawinan", tipe: "select", wajib: false, opsi: ["Kawin", "Belum kawin", "Cerai hidup", "Cerai mati"] },
    { kode: "pendidikan", pertanyaan: "Pendidikan terakhir", tipe: "select", wajib: false, opsi: ["Tidak sekolah", "SD", "SMP", "SMA", "D1/D3", "S1", "S2/S3"] },
    { kode: "pekerjaan", pertanyaan: "Pekerjaan", tipe: "select", wajib: false, opsi: ["Petani", "Buruh", "Nelayan", "PNS", "Pedagang", "Swasta", "IRT", "Pelajar/Mahasiswa", "Tidak bekerja", "Lainnya"] },
  ],
  "sanitasi": [
    { kode: "jkn", pertanyaan: "Jaminan kesehatan (JKN/JamKesDa)", tipe: "checkbox", wajib: false },
    { kode: "ventilasi", pertanyaan: "Ventilasi cukup", tipe: "checkbox", wajib: false },
    { kode: "odgj", pertanyaan: "Anggota dgn gangguan jiwa (ODGJ)", tipe: "checkbox", wajib: false },
    { kode: "tbc", pertanyaan: "Anggota terdiagnosa TBC", tipe: "checkbox", wajib: false },
    { kode: "hipertensi", pertanyaan: "Anggota terdiagnosa hipertensi", tipe: "checkbox", wajib: false },
    { kode: "dm", pertanyaan: "Anggota terdiagnosa DM", tipe: "checkbox", wajib: false },
    { kode: "jambanSaniter", pertanyaan: "- jamban keluarga -", tipe: "select", wajib: false, opsi: ["Kloset", "Leher angsa", "Plengseran", "Cemplung"] },
    { kode: "jenisAir", pertanyaan: "- sarana air bersih -", tipe: "select", wajib: false, opsi: ["Sumur terlindung", "Ledeng/PDAM", "Sumur pompa", "Mata air terlindung", "Sumur terbuka", "Air sungai", "Danau / telaga", "Lainnya"] },
  ],
  "masalah": [
    { kode: "nama", pertanyaan: "Nama", tipe: "text", wajib: false },
    { kode: "nik", pertanyaan: "NIK", tipe: "text", wajib: false },
    { kode: "tglLahir", pertanyaan: "Tanggal lahir", tipe: "date", wajib: false },
    { kode: "alamat", pertanyaan: "Alamat", tipe: "text", wajib: false },
    { kode: "telepon", pertanyaan: "No. telepon", tipe: "text", wajib: false },
    { kode: "masalah", pertanyaan: "Masalah kesehatan ditemukan", tipe: "text", wajib: false },
    { kode: "tindakLanjut", pertanyaan: "Tindak lanjut", tipe: "text", wajib: false },
  ],
  "ibu-hamil": [
    { kode: "nama", pertanyaan: "Nama", tipe: "text", wajib: false, bucket: "identitas" },
    { kode: "umur", pertanyaan: "Umur (thn)", tipe: "number", wajib: false, bucket: "identitas" },
    { kode: "kehamilanKe", pertanyaan: "Kehamilan anak ke-", tipe: "number", wajib: false, bucket: "identitas" },
    { kode: "jarakKehamilan", pertanyaan: "Jarak kehamilan sebelumnya", tipe: "text", wajib: false, bucket: "identitas" },
    { kode: "k1", pertanyaan: "K1 — Trimester 1", tipe: "group", wajib: false, bucket: "kolom" },
    { kode: "k1Tempat", pertanyaan: "tempat", tipe: "text", wajib: false, bucket: "kolom", parent: "k1" },
    { kode: "k1Tanggal", pertanyaan: "tanggal", tipe: "date", wajib: false, bucket: "kolom", parent: "k1" },
    { kode: "k1Petugas", pertanyaan: "petugas", tipe: "text", wajib: false, bucket: "kolom", parent: "k1" },
    { kode: "k2", pertanyaan: "K2 — Trimester 1", tipe: "group", wajib: false, bucket: "kolom" },
    { kode: "k2Tempat", pertanyaan: "tempat", tipe: "text", wajib: false, bucket: "kolom", parent: "k2" },
    { kode: "k2Tanggal", pertanyaan: "tanggal", tipe: "date", wajib: false, bucket: "kolom", parent: "k2" },
    { kode: "k2Petugas", pertanyaan: "petugas", tipe: "text", wajib: false, bucket: "kolom", parent: "k2" },
    { kode: "k3", pertanyaan: "K3 — Trimester 2", tipe: "group", wajib: false, bucket: "kolom" },
    { kode: "k3Tempat", pertanyaan: "tempat", tipe: "text", wajib: false, bucket: "kolom", parent: "k3" },
    { kode: "k3Tanggal", pertanyaan: "tanggal", tipe: "date", wajib: false, bucket: "kolom", parent: "k3" },
    { kode: "k3Petugas", pertanyaan: "petugas", tipe: "text", wajib: false, bucket: "kolom", parent: "k3" },
    { kode: "k4", pertanyaan: "K4 — Trimester 2", tipe: "group", wajib: false, bucket: "kolom" },
    { kode: "k4Tempat", pertanyaan: "tempat", tipe: "text", wajib: false, bucket: "kolom", parent: "k4" },
    { kode: "k4Tanggal", pertanyaan: "tanggal", tipe: "date", wajib: false, bucket: "kolom", parent: "k4" },
    { kode: "k4Petugas", pertanyaan: "petugas", tipe: "text", wajib: false, bucket: "kolom", parent: "k4" },
    { kode: "k5", pertanyaan: "K5 — Trimester 3", tipe: "group", wajib: false, bucket: "kolom" },
    { kode: "k5Tempat", pertanyaan: "tempat", tipe: "text", wajib: false, bucket: "kolom", parent: "k5" },
    { kode: "k5Tanggal", pertanyaan: "tanggal", tipe: "date", wajib: false, bucket: "kolom", parent: "k5" },
    { kode: "k5Petugas", pertanyaan: "petugas", tipe: "text", wajib: false, bucket: "kolom", parent: "k5" },
    { kode: "k6", pertanyaan: "K6 — Trimester 3", tipe: "group", wajib: false, bucket: "kolom" },
    { kode: "k6Tempat", pertanyaan: "tempat", tipe: "text", wajib: false, bucket: "kolom", parent: "k6" },
    { kode: "k6Tanggal", pertanyaan: "tanggal", tipe: "date", wajib: false, bucket: "kolom", parent: "k6" },
    { kode: "k6Petugas", pertanyaan: "petugas", tipe: "text", wajib: false, bucket: "kolom", parent: "k6" },
    { kode: "kelasIbu", pertanyaan: "Kelas Ibu", tipe: "group", wajib: false, bucket: "kolom" },
    { kode: "kelasIbuTempat", pertanyaan: "tempat", tipe: "text", wajib: false, bucket: "kolom", parent: "kelasIbu" },
    { kode: "kelasIbuTanggal", pertanyaan: "tanggal", tipe: "date", wajib: false, bucket: "kolom", parent: "kelasIbu" },
    { kode: "kelasIbuPetugas", pertanyaan: "petugas", tipe: "text", wajib: false, bucket: "kolom", parent: "kelasIbu" },
    { kode: "skriningJiwa", pertanyaan: "Skrining Jiwa", tipe: "group", wajib: false, bucket: "kolom" },
    { kode: "skriningJiwaTempat", pertanyaan: "tempat", tipe: "text", wajib: false, bucket: "kolom", parent: "skriningJiwa" },
    { kode: "skriningJiwaTanggal", pertanyaan: "tanggal", tipe: "date", wajib: false, bucket: "kolom", parent: "skriningJiwa" },
    { kode: "skriningJiwaPetugas", pertanyaan: "petugas", tipe: "text", wajib: false, bucket: "kolom", parent: "skriningJiwa" },
    { kode: "edukasiNakesMateri", pertanyaan: "materi", tipe: "text", wajib: false, bucket: "kolom" },
    { kode: "edukasiNakesTanggal", pertanyaan: "tanggal", tipe: "date", wajib: false, bucket: "kolom" },
    { kode: "paraf", pertanyaan: "Paraf (tulis nama sasaran)", tipe: "text", wajib: false, bucket: "kolom" },
    { kode: "laporNakesTanggal", pertanyaan: "Melaporkan ke nakes", tipe: "date", wajib: false, bucket: "kolom" },
    { kode: "suhu", pertanyaan: "Suhu tubuh >=37.5°C", tipe: "checkbox", wajib: false, bucket: "bools" },
    { kode: "isiPiringku", pertanyaan: "Isi piringku sesuai", tipe: "checkbox", wajib: false, bucket: "bools" },
    { kode: "pmtKek", pertanyaan: "ada PMT untuk Bumil KEK", tipe: "checkbox", wajib: false, bucket: "bools" },
    { kode: "bukuKia", pertanyaan: "Ada buku KIA", tipe: "checkbox", wajib: false, bucket: "bools" },
    { kode: "ttdAda", pertanyaan: "TTD tersedia", tipe: "checkbox", wajib: false, bucket: "bools" },
    { kode: "ttdMinum", pertanyaan: "TTD diminum hari ini (24 jam)", tipe: "checkbox", wajib: false, bucket: "bools" },
    { kode: "lilaRisiko", pertanyaan: "LiLA < 23,5 cm (risiko KEK)", tipe: "checkbox", wajib: false, bucket: "bools" },
    { kode: "demam", pertanyaan: "Demam > 2 hari", tipe: "checkbox", wajib: false, bucket: "baha" },
    { kode: "pusingKabur", pertanyaan: "Pusing / sakit kepala berat / pandangan kabur + bengkak", tipe: "checkbox", wajib: false, bucket: "baha" },
    { kode: "cemas", pertanyaan: "Sulit tidur / cemas berlebih", tipe: "checkbox", wajib: false, bucket: "baha" },
    { kode: "diare", pertanyaan: "Diare berulang", tipe: "checkbox", wajib: false, bucket: "baha" },
    { kode: "risikoTbc", pertanyaan: "Risiko TBC", tipe: "checkbox", wajib: false, bucket: "baha" },
    { kode: "gerakanJanin", pertanyaan: "Tidak ada gerakan janin", tipe: "checkbox", wajib: false, bucket: "baha" },
    { kode: "jantung", pertanyaan: "Jantung berdebar / nyeri dada", tipe: "checkbox", wajib: false, bucket: "baha" },
    { kode: "cairanJalanLahir", pertanyaan: "Keluar cairan dari jalan lahir", tipe: "checkbox", wajib: false, bucket: "baha" },
    { kode: "sakitKencing", pertanyaan: "Sakit saat kencing", tipe: "checkbox", wajib: false, bucket: "baha" },
    { kode: "nyeriPerut", pertanyaan: "Nyeri perut hebat", tipe: "checkbox", wajib: false, bucket: "baha" },
    { kode: "ingatPeriksa", pertanyaan: "Mengingatkan periksa ke Pustu/Fasyankes", tipe: "checkbox", wajib: false, bucket: "baha" },
  ],
  "bersalin-nifas": [
    { kode: "nama", pertanyaan: "Nama ibu", tipe: "text", wajib: false, bucket: "identitas" },
    { kode: "umur", pertanyaan: "Umur (thn)", tipe: "number", wajib: false, bucket: "identitas" },
    { kode: "kelahiranKe", pertanyaan: "Kelahiran anak ke-", tipe: "number", wajib: false, bucket: "identitas" },
    { kode: "tglPersalinan", pertanyaan: "Tanggal persalinan", tipe: "date", wajib: false, bucket: "kolom" },
    { kode: "pukul", pertanyaan: "Pukul", tipe: "text", wajib: false, bucket: "kolom" },
    { kode: "usiaKehamilan", pertanyaan: "Usia kehamilan saat persalinan (minggu)", tipe: "number", wajib: false, bucket: "kolom" },
    { kode: "penolong", pertanyaan: "Penolong persalinan", tipe: "select", wajib: false, bucket: "kolom", opsi: ["Bidan", "Dokter umum", "SpOG", "Lainnya"] },
    { kode: "tempat", pertanyaan: "Tempat persalinan", tipe: "select", wajib: false, bucket: "kolom", opsi: ["Posyandu prima", "Puskesmas", "RS", "Klinik", "PMB", "Lainnya"] },
    { kode: "namaTempat", pertanyaan: "Nama tempat persalinan", tipe: "text", wajib: false, bucket: "kolom" },
    { kode: "keadaanIbu", pertanyaan: "Keadaan ibu saat melahirkan", tipe: "select", wajib: false, bucket: "kolom", opsi: ["Sehat", "Sakit", "Lainnya"] },
    { kode: "jenisSakit", pertanyaan: "Jenis sakit", tipe: "select", wajib: false, bucket: "kolom", opsi: ["Pendarahan", "Kejang", "Demam", "Lokhia berbau", "Lainnya"] },
    { kode: "kunjunganTgl", pertanyaan: "Tanggal kunjungan", tipe: "date", wajib: false, bucket: "kolom" },
    { kode: "kbPasca", pertanyaan: "KB pasca persalinan", tipe: "select", wajib: false, bucket: "kolom", opsi: ["Pil", "Suntik", "Kondom", "Implan", "Lainnya"] },
    { kode: "kf1", pertanyaan: "KF1 — Kunjungan Nifas 1", tipe: "group", wajib: false, bucket: "kolom" },
    { kode: "kf1Tempat", pertanyaan: "tempat", tipe: "text", wajib: false, bucket: "kolom", parent: "kf1" },
    { kode: "kf1Tanggal", pertanyaan: "tanggal", tipe: "date", wajib: false, bucket: "kolom", parent: "kf1" },
    { kode: "kf1Petugas", pertanyaan: "petugas", tipe: "text", wajib: false, bucket: "kolom", parent: "kf1" },
    { kode: "kf2", pertanyaan: "KF2 — Kunjungan Nifas 2", tipe: "group", wajib: false, bucket: "kolom" },
    { kode: "kf2Tempat", pertanyaan: "tempat", tipe: "text", wajib: false, bucket: "kolom", parent: "kf2" },
    { kode: "kf2Tanggal", pertanyaan: "tanggal", tipe: "date", wajib: false, bucket: "kolom", parent: "kf2" },
    { kode: "kf2Petugas", pertanyaan: "petugas", tipe: "text", wajib: false, bucket: "kolom", parent: "kf2" },
    { kode: "kf3", pertanyaan: "KF3 — Kunjungan Nifas 3", tipe: "group", wajib: false, bucket: "kolom" },
    { kode: "kf3Tempat", pertanyaan: "tempat", tipe: "text", wajib: false, bucket: "kolom", parent: "kf3" },
    { kode: "kf3Tanggal", pertanyaan: "tanggal", tipe: "date", wajib: false, bucket: "kolom", parent: "kf3" },
    { kode: "kf3Petugas", pertanyaan: "petugas", tipe: "text", wajib: false, bucket: "kolom", parent: "kf3" },
    { kode: "kf4", pertanyaan: "KF4 — Kunjungan Nifas 4", tipe: "group", wajib: false, bucket: "kolom" },
    { kode: "kf4Tempat", pertanyaan: "tempat", tipe: "text", wajib: false, bucket: "kolom", parent: "kf4" },
    { kode: "kf4Tanggal", pertanyaan: "tanggal", tipe: "date", wajib: false, bucket: "kolom", parent: "kf4" },
    { kode: "kf4Petugas", pertanyaan: "petugas", tipe: "text", wajib: false, bucket: "kolom", parent: "kf4" },
    { kode: "vitATanggal", pertanyaan: "tanggal pemberian", tipe: "date", wajib: false, bucket: "kolom" },
    { kode: "edukasiNakesMateri", pertanyaan: "materi", tipe: "text", wajib: false, bucket: "kolom" },
    { kode: "edukasiNakesTanggal", pertanyaan: "tanggal", tipe: "date", wajib: false, bucket: "kolom" },
    { kode: "laporNakesTanggal", pertanyaan: "Melaporkan ke nakes", tipe: "date", wajib: false, bucket: "kolom" },
    { kode: "paraf", pertanyaan: "Paraf (tulis nama sasaran)", tipe: "text", wajib: false, bucket: "kolom" },
    { kode: "suhu", pertanyaan: "Suhu tubuh >=37.5°C", tipe: "checkbox", wajib: false, bucket: "bools" },
    { kode: "isiPiringku", pertanyaan: "Isi piringku ibu menyusui", tipe: "checkbox", wajib: false, bucket: "bools" },
    { kode: "bukuKia", pertanyaan: "Ada buku KIA", tipe: "checkbox", wajib: false, bucket: "bools" },
    { kode: "menyusui", pertanyaan: "Menyusui", tipe: "checkbox", wajib: false, bucket: "bools" },
    { kode: "riwayatImd", pertanyaan: "Riwayat IMD", tipe: "checkbox", wajib: false, bucket: "bools" },
    { kode: "skriningJiwa", pertanyaan: "Skrining kesehatan jiwa", tipe: "checkbox", wajib: false, bucket: "bools" },
    { kode: "demam", pertanyaan: "Demam", tipe: "checkbox", wajib: false, bucket: "baha" },
    { kode: "sedihDepresi", pertanyaan: "Perasaan sedih / mudah menangis / depresi", tipe: "checkbox", wajib: false, bucket: "baha" },
    { kode: "gangguanBak", pertanyaan: "Gangguan BAK", tipe: "checkbox", wajib: false, bucket: "baha" },
    { kode: "sesak", pertanyaan: "Napas pendek / sesak", tipe: "checkbox", wajib: false, bucket: "baha" },
    { kode: "sakitKepala", pertanyaan: "Sakit kepala", tipe: "checkbox", wajib: false, bucket: "baha" },
    { kode: "perdarahan", pertanyaan: "Perdarahan", tipe: "checkbox", wajib: false, bucket: "baha" },
    { kode: "kelaminBengkak", pertanyaan: "Area kelamin bengkak / nyeri / luka", tipe: "checkbox", wajib: false, bucket: "baha" },
    { kode: "cairanJalanLahir", pertanyaan: "Keluar cairan dari jalan lahir", tipe: "checkbox", wajib: false, bucket: "baha" },
    { kode: "nyeriUluHati", pertanyaan: "Nyeri ulu hati", tipe: "checkbox", wajib: false, bucket: "baha" },
    { kode: "pandanganKabur", pertanyaan: "Pandangan kabur", tipe: "checkbox", wajib: false, bucket: "baha" },
    { kode: "payudaraMerah", pertanyaan: "Payudara bengkak kemerahan", tipe: "checkbox", wajib: false, bucket: "baha" },
    { kode: "darahNifasBerbau", pertanyaan: "Darah nifas berbau", tipe: "checkbox", wajib: false, bucket: "baha" },
    { kode: "keputihan", pertanyaan: "Keputihan berlebihan", tipe: "checkbox", wajib: false, bucket: "baha" },
    { kode: "jantungBerdebar", pertanyaan: "Jantung berdebar", tipe: "checkbox", wajib: false, bucket: "baha" },
    { kode: "ingatPeriksa", pertanyaan: "Mengingatkan periksa", tipe: "checkbox", wajib: false, bucket: "baha" },
  ],
  "bayi": [
    { kode: "nama", pertanyaan: "Nama anak", tipe: "text", wajib: false, bucket: "identitas" },
    { kode: "tempatLahir", pertanyaan: "Tempat lahir", tipe: "text", wajib: false, bucket: "identitas" },
    { kode: "tglLahir", pertanyaan: "Tanggal lahir", tipe: "date", wajib: false, bucket: "identitas" },
    { kode: "jk", pertanyaan: "Jenis kelamin", tipe: "select", wajib: false, bucket: "identitas", opsi: ["L", "P"] },
    { kode: "tglTimbang", pertanyaan: "Tanggal terakhir ditimbang/diukur", tipe: "date", wajib: false, bucket: "kolom" },
    { kode: "bb", pertanyaan: "Hasil BB", tipe: "select", wajib: false, bucket: "kolom", opsi: ["Naik", "Tetap", "Turun"] },
    { kode: "pb", pertanyaan: "Hasil PB", tipe: "select", wajib: false, bucket: "kolom", opsi: ["Naik", "Tetap", "Turun"] },
    { kode: "lk", pertanyaan: "Hasil LK", tipe: "select", wajib: false, bucket: "kolom", opsi: ["Naik", "Tetap", "Turun"] },
    { kode: "kn0", pertanyaan: "KN0 — Kunjungan Neonatus 0", tipe: "group", wajib: false, bucket: "kolom" },
    { kode: "kn0Tanggal", pertanyaan: "tanggal", tipe: "date", wajib: false, bucket: "kolom", parent: "kn0" },
    { kode: "kn0Tempat", pertanyaan: "tempat", tipe: "text", wajib: false, bucket: "kolom", parent: "kn0" },
    { kode: "kn0Petugas", pertanyaan: "bidan/dokter", tipe: "text", wajib: false, bucket: "kolom", parent: "kn0" },
    { kode: "kn1", pertanyaan: "KN1 — Kunjungan Neonatus 1", tipe: "group", wajib: false, bucket: "kolom" },
    { kode: "kn1Tanggal", pertanyaan: "tanggal", tipe: "date", wajib: false, bucket: "kolom", parent: "kn1" },
    { kode: "kn1Tempat", pertanyaan: "tempat", tipe: "text", wajib: false, bucket: "kolom", parent: "kn1" },
    { kode: "kn1Petugas", pertanyaan: "bidan/dokter", tipe: "text", wajib: false, bucket: "kolom", parent: "kn1" },
    { kode: "kn2", pertanyaan: "KN2 — Kunjungan Neonatus 2", tipe: "group", wajib: false, bucket: "kolom" },
    { kode: "kn2Tanggal", pertanyaan: "tanggal", tipe: "date", wajib: false, bucket: "kolom", parent: "kn2" },
    { kode: "kn2Tempat", pertanyaan: "tempat", tipe: "text", wajib: false, bucket: "kolom", parent: "kn2" },
    { kode: "kn2Petugas", pertanyaan: "bidan/dokter", tipe: "text", wajib: false, bucket: "kolom", parent: "kn2" },
    { kode: "kn3", pertanyaan: "KN3 — Kunjungan Neonatus 3", tipe: "group", wajib: false, bucket: "kolom" },
    { kode: "kn3Tanggal", pertanyaan: "tanggal", tipe: "date", wajib: false, bucket: "kolom", parent: "kn3" },
    { kode: "kn3Tempat", pertanyaan: "tempat", tipe: "text", wajib: false, bucket: "kolom", parent: "kn3" },
    { kode: "kn3Petugas", pertanyaan: "bidan/dokter", tipe: "text", wajib: false, bucket: "kolom", parent: "kn3" },
    { kode: "edukasiNakesMateri", pertanyaan: "materi", tipe: "text", wajib: false, bucket: "kolom" },
    { kode: "edukasiNakesTanggal", pertanyaan: "tanggal", tipe: "date", wajib: false, bucket: "kolom" },
    { kode: "laporNakesTanggal", pertanyaan: "Melaporkan ke nakes", tipe: "date", wajib: false, bucket: "kolom" },
    { kode: "paraf", pertanyaan: "Paraf (tulis nama sasaran)", tipe: "text", wajib: false, bucket: "kolom" },
    { kode: "suhu", pertanyaan: "Suhu tubuh >=37.5°C", tipe: "checkbox", wajib: false, bucket: "bools" },
    { kode: "bukuKia", pertanyaan: "Ada buku KIA", tipe: "checkbox", wajib: false, bucket: "bools" },
    { kode: "asiEksklusif", pertanyaan: "ASI eksklusif", tipe: "checkbox", wajib: false, bucket: "bools" },
    { kode: "imun0HepB", pertanyaan: "Imunisasi 0 bln - Hepatitis B (0-24 jam)", tipe: "checkbox", wajib: false, bucket: "bools" },
    { kode: "imun0BCG", pertanyaan: "Imunisasi 0 bln - BCG", tipe: "checkbox", wajib: false, bucket: "bools" },
    { kode: "imun0Polio1", pertanyaan: "Imunisasi 0 bln - Polio Tetes 1", tipe: "checkbox", wajib: false, bucket: "bools" },
    { kode: "imun1BCG", pertanyaan: "Imunisasi 1 bln - BCG", tipe: "checkbox", wajib: false, bucket: "bools" },
    { kode: "imun1Polio1", pertanyaan: "Imunisasi 1 bln - Polio Tetes 1", tipe: "checkbox", wajib: false, bucket: "bools" },
    { kode: "imun2DPTHBHib1", pertanyaan: "Imunisasi 2 bln - DPT-HB-Hib 1", tipe: "checkbox", wajib: false, bucket: "bools" },
    { kode: "imun2Polio2", pertanyaan: "Imunisasi 2 bln - Polio Tetes 2", tipe: "checkbox", wajib: false, bucket: "bools" },
    { kode: "imun2PCV1", pertanyaan: "Imunisasi 2 bln - PCV 1", tipe: "checkbox", wajib: false, bucket: "bools" },
    { kode: "imun2RV1", pertanyaan: "Imunisasi 2 bln - RV 1", tipe: "checkbox", wajib: false, bucket: "bools" },
    { kode: "imun3DPTHBHib2", pertanyaan: "Imunisasi 3 bln - DPT-HB-Hib 2", tipe: "checkbox", wajib: false, bucket: "bools" },
    { kode: "imun3Polio3", pertanyaan: "Imunisasi 3 bln - Polio Tetes 3", tipe: "checkbox", wajib: false, bucket: "bools" },
    { kode: "imun3PCV2", pertanyaan: "Imunisasi 3 bln - PCV 2", tipe: "checkbox", wajib: false, bucket: "bools" },
    { kode: "imun3RV2", pertanyaan: "Imunisasi 3 bln - RV 2", tipe: "checkbox", wajib: false, bucket: "bools" },
    { kode: "imun4DPTHBHib3", pertanyaan: "Imunisasi 4 bln - DPT-HB-Hib 3", tipe: "checkbox", wajib: false, bucket: "bools" },
    { kode: "imun4Polio4", pertanyaan: "Imunisasi 4 bln - Polio Tetes 4", tipe: "checkbox", wajib: false, bucket: "bools" },
    { kode: "imun4IPV1", pertanyaan: "Imunisasi 4 bln - Polio Suntik 1 (IPV 1)", tipe: "checkbox", wajib: false, bucket: "bools" },
    { kode: "imun4RV3", pertanyaan: "Imunisasi 4 bln - RV 3", tipe: "checkbox", wajib: false, bucket: "bools" },
    { kode: "napas", pertanyaan: "Napas", tipe: "checkbox", wajib: false, bucket: "baha" },
    { kode: "aktivitas", pertanyaan: "Aktivitas", tipe: "checkbox", wajib: false, bucket: "baha" },
    { kode: "warnaKulit", pertanyaan: "Warna kulit", tipe: "checkbox", wajib: false, bucket: "baha" },
    { kode: "hisapan", pertanyaan: "Hisapan bayi", tipe: "checkbox", wajib: false, bucket: "baha" },
    { kode: "kejang", pertanyaan: "Kejang", tipe: "checkbox", wajib: false, bucket: "baha" },
    { kode: "suhuTubuh", pertanyaan: "Suhu tubuh", tipe: "checkbox", wajib: false, bucket: "baha" },
    { kode: "bab", pertanyaan: "BAB", tipe: "checkbox", wajib: false, bucket: "baha" },
    { kode: "kencing", pertanyaan: "Jumlah/warna kencing", tipe: "checkbox", wajib: false, bucket: "baha" },
    { kode: "taliPusat", pertanyaan: "Tali pusat", tipe: "checkbox", wajib: false, bucket: "baha" },
    { kode: "mata", pertanyaan: "Mata", tipe: "checkbox", wajib: false, bucket: "baha" },
    { kode: "kulit", pertanyaan: "Kulit", tipe: "checkbox", wajib: false, bucket: "baha" },
    { kode: "imunisasi", pertanyaan: "Imunisasi", tipe: "checkbox", wajib: false, bucket: "baha" },
    { kode: "ingatPeriksa", pertanyaan: "Mengingatkan periksa", tipe: "checkbox", wajib: false, bucket: "baha" },
  ],
  "balita": [
    { kode: "nama", pertanyaan: "Nama anak", tipe: "text", wajib: false, bucket: "identitas" },
    { kode: "tempatLahir", pertanyaan: "Tempat lahir", tipe: "text", wajib: false, bucket: "identitas" },
    { kode: "tglLahir", pertanyaan: "Tanggal lahir", tipe: "date", wajib: false, bucket: "identitas" },
    { kode: "jk", pertanyaan: "Jenis kelamin", tipe: "select", wajib: false, bucket: "identitas", opsi: ["L", "P"] },
    { kode: "tglTimbang", pertanyaan: "Tanggal terakhir menimbang & mengukur", tipe: "date", wajib: false, bucket: "kolom" },
    { kode: "bb", pertanyaan: "Hasil BB", tipe: "select", wajib: false, bucket: "kolom", opsi: ["Naik", "Tetap", "Turun"] },
    { kode: "pb", pertanyaan: "Hasil PB / TB", tipe: "select", wajib: false, bucket: "kolom", opsi: ["Naik", "Tetap", "Turun"] },
    { kode: "lk", pertanyaan: "Hasil LK", tipe: "select", wajib: false, bucket: "kolom", opsi: ["Naik", "Tetap", "Turun"] },
    { kode: "obatCacingTanggal", pertanyaan: "Obat cacing - tanggal minum", tipe: "date", wajib: false, bucket: "kolom" },
    { kode: "vitA6_11Bulan", pertanyaan: "Vitamin A 6-11 bln - bulan pemberian", tipe: "select", wajib: false, bucket: "kolom", opsi: ["Februari", "Agustus"] },
    { kode: "vitA12Bulan", pertanyaan: "Vitamin A >11 bln - bulan pemberian", tipe: "select", wajib: false, bucket: "kolom", opsi: ["Februari", "Agustus"] },
    { kode: "mtKepatuhan", pertanyaan: "MT pangan lokal - kepatuhan konsumsi", tipe: "select", wajib: false, bucket: "kolom", opsi: ["Patuh", "Tidak patuh"] },
    { kode: "edukasiNakesMateri", pertanyaan: "materi", tipe: "text", wajib: false, bucket: "kolom" },
    { kode: "edukasiNakesTanggal", pertanyaan: "tanggal", tipe: "date", wajib: false, bucket: "kolom" },
    { kode: "laporNakesTanggal", pertanyaan: "Melaporkan ke nakes", tipe: "date", wajib: false, bucket: "kolom" },
    { kode: "paraf", pertanyaan: "Paraf (tulis nama sasaran)", tipe: "text", wajib: false, bucket: "kolom" },
    { kode: "suhu", pertanyaan: "Suhu tubuh >=37.5°C", tipe: "checkbox", wajib: false, bucket: "bools" },
    { kode: "imun0HepB", pertanyaan: "Imunisasi 0 bln - Hepatitis B (0-24 jam)", tipe: "checkbox", wajib: false, bucket: "bools" },
    { kode: "imun0BCG", pertanyaan: "Imunisasi 0 bln - BCG", tipe: "checkbox", wajib: false, bucket: "bools" },
    { kode: "imun0Polio1", pertanyaan: "Imunisasi 0 bln - Polio Tetes 1", tipe: "checkbox", wajib: false, bucket: "bools" },
    { kode: "imun1BCG", pertanyaan: "Imunisasi 1 bln - BCG", tipe: "checkbox", wajib: false, bucket: "bools" },
    { kode: "imun1Polio1", pertanyaan: "Imunisasi 1 bln - Polio Tetes 1", tipe: "checkbox", wajib: false, bucket: "bools" },
    { kode: "imun2DPTHBHib1", pertanyaan: "Imunisasi 2 bln - DPT-HB-Hib 1", tipe: "checkbox", wajib: false, bucket: "bools" },
    { kode: "imun2Polio2", pertanyaan: "Imunisasi 2 bln - Polio Tetes 2", tipe: "checkbox", wajib: false, bucket: "bools" },
    { kode: "imun2PCV1", pertanyaan: "Imunisasi 2 bln - PCV 1", tipe: "checkbox", wajib: false, bucket: "bools" },
    { kode: "imun2RV1", pertanyaan: "Imunisasi 2 bln - RV 1", tipe: "checkbox", wajib: false, bucket: "bools" },
    { kode: "imun3DPTHBHib2", pertanyaan: "Imunisasi 3 bln - DPT-HB-Hib 2", tipe: "checkbox", wajib: false, bucket: "bools" },
    { kode: "imun3Polio3", pertanyaan: "Imunisasi 3 bln - Polio Tetes 3", tipe: "checkbox", wajib: false, bucket: "bools" },
    { kode: "imun3PCV2", pertanyaan: "Imunisasi 3 bln - PCV 2", tipe: "checkbox", wajib: false, bucket: "bools" },
    { kode: "imun3RV2", pertanyaan: "Imunisasi 3 bln - RV 2", tipe: "checkbox", wajib: false, bucket: "bools" },
    { kode: "imun4DPTHBHib3", pertanyaan: "Imunisasi 4 bln - DPT-HB-Hib 3", tipe: "checkbox", wajib: false, bucket: "bools" },
    { kode: "imun4Polio4", pertanyaan: "Imunisasi 4 bln - Polio Tetes 4", tipe: "checkbox", wajib: false, bucket: "bools" },
    { kode: "imun4IPV1", pertanyaan: "Imunisasi 4 bln - Polio Suntik 1 (IPV 1)", tipe: "checkbox", wajib: false, bucket: "bools" },
    { kode: "imun4RV3", pertanyaan: "Imunisasi 4 bln - RV 3", tipe: "checkbox", wajib: false, bucket: "bools" },
    { kode: "imun9CampakRubella", pertanyaan: "Imunisasi 9 bln - Campak Rubella", tipe: "checkbox", wajib: false, bucket: "bools" },
    { kode: "imun9IPV2", pertanyaan: "Imunisasi 9 bln - Polio Suntik (IPV 2)", tipe: "checkbox", wajib: false, bucket: "bools" },
    { kode: "imun10JE", pertanyaan: "Imunisasi 10 bln - Japanese Encephalitis (JE)", tipe: "checkbox", wajib: false, bucket: "bools" },
    { kode: "imun12PCV3", pertanyaan: "Imunisasi 12 bln - PCV 3", tipe: "checkbox", wajib: false, bucket: "bools" },
    { kode: "imun18DPTHBHibLanjut", pertanyaan: "Imunisasi 18 bln - DPT-HB-Hib lanjutan", tipe: "checkbox", wajib: false, bucket: "bools" },
    { kode: "imun18CampakRubellaLanjut", pertanyaan: "Imunisasi 18 bln - Campak Rubella lanjutan", tipe: "checkbox", wajib: false, bucket: "bools" },
    { kode: "bukuKia", pertanyaan: "Ada buku KIA", tipe: "checkbox", wajib: false, bucket: "bools" },
    { kode: "makanPokok", pertanyaan: "PMBA: makanan pokok", tipe: "checkbox", wajib: false, bucket: "bools" },
    { kode: "proteinHewani", pertanyaan: "PMBA: protein hewani", tipe: "checkbox", wajib: false, bucket: "bools" },
    { kode: "proteinNabati", pertanyaan: "PMBA: protein nabati", tipe: "checkbox", wajib: false, bucket: "bools" },
    { kode: "lemak", pertanyaan: "PMBA: lemak", tipe: "checkbox", wajib: false, bucket: "bools" },
    { kode: "buahSayur", pertanyaan: "PMBA: buah-sayur", tipe: "checkbox", wajib: false, bucket: "bools" },
    { kode: "napas", pertanyaan: "Napas", tipe: "checkbox", wajib: false, bucket: "baha" },
    { kode: "batukGrok", pertanyaan: "Batuk grok-grok", tipe: "checkbox", wajib: false, bucket: "baha" },
    { kode: "diare", pertanyaan: "Diare", tipe: "checkbox", wajib: false, bucket: "baha" },
    { kode: "kencing", pertanyaan: "Jumlah/warna kencing", tipe: "checkbox", wajib: false, bucket: "baha" },
    { kode: "warnaKulit", pertanyaan: "Warna kulit", tipe: "checkbox", wajib: false, bucket: "baha" },
    { kode: "aktivitas", pertanyaan: "Aktivitas", tipe: "checkbox", wajib: false, bucket: "baha" },
    { kode: "hisapan", pertanyaan: "Hisapan", tipe: "checkbox", wajib: false, bucket: "baha" },
    { kode: "makan", pertanyaan: "Pemberian makanan", tipe: "checkbox", wajib: false, bucket: "baha" },
    { kode: "ingatPeriksa", pertanyaan: "Mengingatkan periksa", tipe: "checkbox", wajib: false, bucket: "baha" },
  ],
  "remaja": [
    { kode: "nama", pertanyaan: "Nama", tipe: "text", wajib: false, bucket: "identitas" },
    { kode: "tempatLahir", pertanyaan: "Tempat lahir", tipe: "text", wajib: false, bucket: "identitas" },
    { kode: "tglLahir", pertanyaan: "Tanggal lahir", tipe: "date", wajib: false, bucket: "identitas" },
    { kode: "jk", pertanyaan: "Jenis kelamin", tipe: "select", wajib: false, bucket: "identitas", opsi: ["L", "P"] },
    { kode: "tglTimbang", pertanyaan: "Tanggal terakhir menimbang/mengukur", tipe: "date", wajib: false, bucket: "kolom" },
    { kode: "bb", pertanyaan: "Hasil BB", tipe: "select", wajib: false, bucket: "kolom", opsi: ["Naik", "Tetap", "Turun"] },
    { kode: "pbTb", pertanyaan: "Hasil PB/TB", tipe: "select", wajib: false, bucket: "kolom", opsi: ["Naik", "Tetap", "Turun"] },
    { kode: "merokok", pertanyaan: "Perilaku merokok", tipe: "select", wajib: false, bucket: "kolom", opsi: ["Aktif", "Pasif", "Tidak"] },
    { kode: "ptmTD", pertanyaan: "PTM ≥15: tekanan darah hasil", tipe: "text", wajib: false, bucket: "kolom" },
    { kode: "ptmGD", pertanyaan: "PTM ≥15: gula darah hasil", tipe: "text", wajib: false, bucket: "kolom" },
    { kode: "anemiaTanggal", pertanyaan: "Anemia (skrining Hb) 1 thn terakhir - tanggal", tipe: "date", wajib: false, bucket: "kolom" },
    { kode: "skriningJiwa", pertanyaan: "Skrining Jiwa", tipe: "group", wajib: false, bucket: "kolom" },
    { kode: "skriningJiwaTanggal", pertanyaan: "tanggal", tipe: "date", wajib: false, bucket: "kolom", parent: "skriningJiwa" },
    { kode: "skriningJiwaTempat", pertanyaan: "tempat", tipe: "text", wajib: false, bucket: "kolom", parent: "skriningJiwa" },
    { kode: "skriningJiwaPetugas", pertanyaan: "petugas", tipe: "text", wajib: false, bucket: "kolom", parent: "skriningJiwa" },
    { kode: "edukasiNakesMateri", pertanyaan: "materi", tipe: "text", wajib: false, bucket: "kolom" },
    { kode: "edukasiNakesTanggal", pertanyaan: "tanggal", tipe: "date", wajib: false, bucket: "kolom" },
    { kode: "paraf", pertanyaan: "Paraf (tulis nama sasaran)", tipe: "text", wajib: false, bucket: "kolom" },
    { kode: "suhu", pertanyaan: "Suhu tubuh >=37.5°C", tipe: "checkbox", wajib: false, bucket: "bools" },
    { kode: "bukuKia", pertanyaan: "Ada buku KIA", tipe: "checkbox", wajib: false, bucket: "bools" },
    { kode: "isiPiringku", pertanyaan: "Isi piringku sekolah/remaja", tipe: "checkbox", wajib: false, bucket: "bools" },
    { kode: "ttdAda", pertanyaan: "TTD remaja putri tersedia", tipe: "checkbox", wajib: false, bucket: "bools" },
    { kode: "ttdMinum", pertanyaan: "TTD diminum hari ini (1 minggu)", tipe: "checkbox", wajib: false, bucket: "bools" },
    { kode: "ptmTdCek", pertanyaan: "PTM ≥15: periksa tekanan darah setahun terakhir", tipe: "checkbox", wajib: false, bucket: "bools" },
    { kode: "ptmGdCek", pertanyaan: "PTM ≥15: periksa gula darah setahun terakhir", tipe: "checkbox", wajib: false, bucket: "bools" },
  ],
  "dewasa": [
    { kode: "nama", pertanyaan: "Nama", tipe: "text", wajib: false, bucket: "identitas" },
    { kode: "tempatLahir", pertanyaan: "Tempat lahir", tipe: "text", wajib: false, bucket: "identitas" },
    { kode: "tglLahir", pertanyaan: "Tanggal lahir", tipe: "date", wajib: false, bucket: "identitas" },
    { kode: "jk", pertanyaan: "Jenis kelamin", tipe: "select", wajib: false, bucket: "identitas", opsi: ["L", "P"] },
    { kode: "riwayatKeluarga", pertanyaan: "Riwayat penyakit keluarga", tipe: "select", wajib: false, bucket: "identitas", opsi: ["Hipertensi", "Diabetes Melitus", "Stroke", "Jantung", "Asma", "Kanker", "Kolesterol Tinggi"] },
    { kode: "tdDiagnosaTgl", pertanyaan: "TD: terdiagnosa hipertensi (tanggal)", tipe: "date", wajib: false, bucket: "kolom" },
    { kode: "tdPeriksaSetahun", pertanyaan: "TD — Pemeriksaan 1 tahun", tipe: "group", wajib: false, bucket: "kolom" },
    { kode: "tdPeriksaSetahunTanggal", pertanyaan: "TD periksa 1 thn - tanggal", tipe: "date", wajib: false, bucket: "kolom", parent: "tdPeriksaSetahun" },
    { kode: "tdPeriksaSetahunTempat", pertanyaan: "TD periksa 1 thn - tempat", tipe: "text", wajib: false, bucket: "kolom", parent: "tdPeriksaSetahun" },
    { kode: "tdPeriksaSetahunHasil", pertanyaan: "TD periksa 1 thn - hasil", tipe: "text", wajib: false, bucket: "kolom", parent: "tdPeriksaSetahun" },
    { kode: "gdDiagnosaTgl", pertanyaan: "Gula darah: terdiagnosa DM (tanggal)", tipe: "date", wajib: false, bucket: "kolom" },
    { kode: "gdPeriksaSetahun", pertanyaan: "GD — Pemeriksaan 1 tahun", tipe: "group", wajib: false, bucket: "kolom" },
    { kode: "gdPeriksaSetahunTanggal", pertanyaan: "Gula darah periksa 1 thn - tanggal", tipe: "date", wajib: false, bucket: "kolom", parent: "gdPeriksaSetahun" },
    { kode: "gdPeriksaSetahunTempat", pertanyaan: "Gula darah periksa 1 thn - tempat", tipe: "text", wajib: false, bucket: "kolom", parent: "gdPeriksaSetahun" },
    { kode: "gdPeriksaSetahunHasil", pertanyaan: "Gula darah periksa 1 thn - hasil", tipe: "text", wajib: false, bucket: "kolom", parent: "gdPeriksaSetahun" },
    { kode: "gdPeriksaSebulan", pertanyaan: "GD — Pemeriksaan 1 bulan", tipe: "group", wajib: false, bucket: "kolom" },
    { kode: "gdPeriksaSebulanTanggal", pertanyaan: "Gula darah periksa 1 bln - tanggal", tipe: "date", wajib: false, bucket: "kolom", parent: "gdPeriksaSebulan" },
    { kode: "gdPeriksaSebulanTempat", pertanyaan: "Gula darah periksa 1 bln - tempat", tipe: "text", wajib: false, bucket: "kolom", parent: "gdPeriksaSebulan" },
    { kode: "gdPeriksaSebulanHasil", pertanyaan: "Gula darah periksa 1 bln - hasil", tipe: "text", wajib: false, bucket: "kolom", parent: "gdPeriksaSebulan" },
    { kode: "skriningJiwa", pertanyaan: "Skrining Jiwa", tipe: "group", wajib: false, bucket: "kolom" },
    { kode: "skriningJiwaTanggal", pertanyaan: "Skrining kesehatan jiwa - tanggal", tipe: "date", wajib: false, bucket: "kolom", parent: "skriningJiwa" },
    { kode: "skriningJiwaTempat", pertanyaan: "Skrining kesehatan jiwa - tempat", tipe: "text", wajib: false, bucket: "kolom", parent: "skriningJiwa" },
    { kode: "skriningJiwaPetugas", pertanyaan: "Skrining kesehatan jiwa - petugas", tipe: "text", wajib: false, bucket: "kolom", parent: "skriningJiwa" },
    { kode: "merokok", pertanyaan: "Perilaku merokok", tipe: "select", wajib: false, bucket: "kolom", opsi: ["Aktif", "Pasif", "Tidak"] },
    { kode: "kb", pertanyaan: "KB", tipe: "select", wajib: false, bucket: "kolom", opsi: ["Pil", "Suntik", "Kondom", "Implan", "Lainnya", "Tidak memakai"] },
    { kode: "edukasiNakesMateri", pertanyaan: "materi", tipe: "text", wajib: false, bucket: "kolom" },
    { kode: "edukasiNakesTanggal", pertanyaan: "tanggal", tipe: "date", wajib: false, bucket: "kolom" },
    { kode: "paraf", pertanyaan: "Paraf (tulis nama sasaran)", tipe: "text", wajib: false, bucket: "kolom" },
    { kode: "suhu", pertanyaan: "Suhu tubuh >=37.5°C", tipe: "checkbox", wajib: false, bucket: "bools" },
    { kode: "tdAdaObat", pertanyaan: "TD: ada obat hipertensi", tipe: "checkbox", wajib: false, bucket: "bools" },
    { kode: "tdMinum24", pertanyaan: "TD: minum obat 24 jam terakhir", tipe: "checkbox", wajib: false, bucket: "bools" },
    { kode: "gdAdaObat", pertanyaan: "Gula darah: ada obat DM", tipe: "checkbox", wajib: false, bucket: "bools" },
    { kode: "gdMinum24", pertanyaan: "Gula darah: minum obat 24 jam", tipe: "checkbox", wajib: false, bucket: "bools" },
    { kode: "isiPiringku", pertanyaan: "Isi piringku dewasa", tipe: "checkbox", wajib: false, bucket: "bools" },
  ],
  "lansia": [
    { kode: "nama", pertanyaan: "Nama", tipe: "text", wajib: false, bucket: "identitas" },
    { kode: "tempatLahir", pertanyaan: "Tempat lahir", tipe: "text", wajib: false, bucket: "identitas" },
    { kode: "tglLahir", pertanyaan: "Tanggal lahir", tipe: "date", wajib: false, bucket: "identitas" },
    { kode: "jk", pertanyaan: "Jenis kelamin", tipe: "select", wajib: false, bucket: "identitas", opsi: ["L", "P"] },
    { kode: "tdDiagnosaTgl", pertanyaan: "TD: terdiagnosa hipertensi (tanggal)", tipe: "date", wajib: false, bucket: "kolom" },
    { kode: "tdPeriksaSetahun", pertanyaan: "TD — Pemeriksaan 1 tahun", tipe: "group", wajib: false, bucket: "kolom" },
    { kode: "tdPeriksaSetahunTanggal", pertanyaan: "TD periksa 1 thn - tanggal", tipe: "date", wajib: false, bucket: "kolom", parent: "tdPeriksaSetahun" },
    { kode: "tdPeriksaSetahunTempat", pertanyaan: "TD periksa 1 thn - tempat", tipe: "text", wajib: false, bucket: "kolom", parent: "tdPeriksaSetahun" },
    { kode: "tdPeriksaSetahunHasil", pertanyaan: "TD periksa 1 thn - hasil", tipe: "text", wajib: false, bucket: "kolom", parent: "tdPeriksaSetahun" },
    { kode: "gdDiagnosaTgl", pertanyaan: "Gula darah: terdiagnosa DM (tanggal)", tipe: "date", wajib: false, bucket: "kolom" },
    { kode: "gdPeriksaSetahun", pertanyaan: "GD — Pemeriksaan 1 tahun", tipe: "group", wajib: false, bucket: "kolom" },
    { kode: "gdPeriksaSetahunTanggal", pertanyaan: "Gula darah periksa 1 thn - tanggal", tipe: "date", wajib: false, bucket: "kolom", parent: "gdPeriksaSetahun" },
    { kode: "gdPeriksaSetahunTempat", pertanyaan: "Gula darah periksa 1 thn - tempat", tipe: "text", wajib: false, bucket: "kolom", parent: "gdPeriksaSetahun" },
    { kode: "gdPeriksaSetahunHasil", pertanyaan: "Gula darah periksa 1 thn - hasil", tipe: "text", wajib: false, bucket: "kolom", parent: "gdPeriksaSetahun" },
    { kode: "gdPeriksaSebulan", pertanyaan: "GD — Pemeriksaan 1 bulan", tipe: "group", wajib: false, bucket: "kolom" },
    { kode: "gdPeriksaSebulanTanggal", pertanyaan: "Gula darah periksa 1 bln - tanggal", tipe: "date", wajib: false, bucket: "kolom", parent: "gdPeriksaSebulan" },
    { kode: "gdPeriksaSebulanTempat", pertanyaan: "Gula darah periksa 1 bln - tempat", tipe: "text", wajib: false, bucket: "kolom", parent: "gdPeriksaSebulan" },
    { kode: "gdPeriksaSebulanHasil", pertanyaan: "Gula darah periksa 1 bln - hasil", tipe: "text", wajib: false, bucket: "kolom", parent: "gdPeriksaSebulan" },
    { kode: "skriningJiwa", pertanyaan: "Skrining Jiwa", tipe: "group", wajib: false, bucket: "kolom" },
    { kode: "skriningJiwaTanggal", pertanyaan: "Skrining kesehatan jiwa - tanggal", tipe: "date", wajib: false, bucket: "kolom", parent: "skriningJiwa" },
    { kode: "skriningJiwaTempat", pertanyaan: "Skrining kesehatan jiwa - tempat", tipe: "text", wajib: false, bucket: "kolom", parent: "skriningJiwa" },
    { kode: "skriningJiwaPetugas", pertanyaan: "Skrining kesehatan jiwa - petugas", tipe: "text", wajib: false, bucket: "kolom", parent: "skriningJiwa" },
    { kode: "aks", pertanyaan: "Aksesibilitas", tipe: "group", wajib: false, bucket: "kolom" },
    { kode: "aksTempat", pertanyaan: "Skrining geriatri AKS - tempat", tipe: "text", wajib: false, bucket: "kolom", parent: "aks" },
    { kode: "aksTanggal", pertanyaan: "Skrining geriatri AKS - tanggal", tipe: "date", wajib: false, bucket: "kolom", parent: "aks" },
    { kode: "skilas", pertanyaan: "Skilas", tipe: "group", wajib: false, bucket: "kolom" },
    { kode: "skilasTempat", pertanyaan: "Skrining geriatri SKILAS - tempat", tipe: "text", wajib: false, bucket: "kolom", parent: "skilas" },
    { kode: "skilasTanggal", pertanyaan: "Skrining geriatri SKILAS - tanggal", tipe: "date", wajib: false, bucket: "kolom", parent: "skilas" },
    { kode: "merokok", pertanyaan: "Perilaku merokok", tipe: "select", wajib: false, bucket: "kolom", opsi: ["Aktif", "Pasif", "Tidak"] },
    { kode: "edukasiNakesMateri", pertanyaan: "materi", tipe: "text", wajib: false, bucket: "kolom" },
    { kode: "edukasiNakesTanggal", pertanyaan: "tanggal", tipe: "date", wajib: false, bucket: "kolom" },
    { kode: "paraf", pertanyaan: "Paraf (tulis nama sasaran)", tipe: "text", wajib: false, bucket: "kolom" },
    { kode: "suhu", pertanyaan: "Suhu tubuh >=37.5°C", tipe: "checkbox", wajib: false, bucket: "bools" },
    { kode: "tdAdaObat", pertanyaan: "TD: ada obat", tipe: "checkbox", wajib: false, bucket: "bools" },
    { kode: "tdMinum24", pertanyaan: "TD: minum 24 jam", tipe: "checkbox", wajib: false, bucket: "bools" },
    { kode: "gdAdaObat", pertanyaan: "Gula darah: ada obat", tipe: "checkbox", wajib: false, bucket: "bools" },
    { kode: "gdMinum24", pertanyaan: "Gula darah: minum 24 jam", tipe: "checkbox", wajib: false, bucket: "bools" },
  ],
  "tbc": [
    { kode: "nama", pertanyaan: "Nama", tipe: "text", wajib: false, bucket: "identitas" },
    { kode: "tempatLahir", pertanyaan: "Tempat lahir", tipe: "text", wajib: false, bucket: "identitas" },
    { kode: "tglLahir", pertanyaan: "Tanggal lahir", tipe: "date", wajib: false, bucket: "identitas" },
    { kode: "jk", pertanyaan: "Jenis kelamin", tipe: "select", wajib: false, bucket: "identitas", opsi: ["L", "P"] },
    { kode: "tglDiagnosa", pertanyaan: "TBC: terdiagnosa (tanggal)", tipe: "date", wajib: false, bucket: "kolom" },
    { kode: "tempatDiagnosa", pertanyaan: "TBC: tempat diagnosa", tipe: "text", wajib: false, bucket: "kolom" },
    { kode: "periksaTgl", pertanyaan: "Pemeriksaan terakhir (tanggal)", tipe: "date", wajib: false, bucket: "kolom" },
    { kode: "tempatPeriksa", pertanyaan: "TBC: tempat periksa", tipe: "text", wajib: false, bucket: "kolom" },
    { kode: "namaPmo", pertanyaan: "Nama PMO", tipe: "text", wajib: false, bucket: "kolom" },
    { kode: "merokok", pertanyaan: "Merokok", tipe: "select", wajib: false, bucket: "kolom", opsi: ["Aktif", "Pasif", "Tidak"] },
    { kode: "kontakEratJenis", pertanyaan: "Kontak erat - jenis", tipe: "select", wajib: false, bucket: "kolom", opsi: ["Keluarga", "Tetangga", "ART"] },
    { kode: "edukasiNakesMateri", pertanyaan: "materi", tipe: "text", wajib: false, bucket: "kolom" },
    { kode: "edukasiNakesTanggal", pertanyaan: "tanggal", tipe: "date", wajib: false, bucket: "kolom" },
    { kode: "laporNakesTanggal", pertanyaan: "Melaporkan ke nakes", tipe: "date", wajib: false, bucket: "kolom" },
    { kode: "paraf", pertanyaan: "Paraf (tulis nama sasaran)", tipe: "text", wajib: false, bucket: "kolom" },
    { kode: "adaObat", pertanyaan: "Ada obat TBC", tipe: "checkbox", wajib: false, bucket: "bools" },
    { kode: "minum24", pertanyaan: "Minum obat 24 jam", tipe: "checkbox", wajib: false, bucket: "bools" },
    { kode: "ingatPeriksa", pertanyaan: "Mengingatkan periksa", tipe: "checkbox", wajib: false, bucket: "bools" },
    { kode: "batukTerus", pertanyaan: "Batuk terus menerus", tipe: "checkbox", wajib: false, bucket: "baha" },
    { kode: "demam", pertanyaan: "Demam ≥ 2 minggu", tipe: "checkbox", wajib: false, bucket: "baha" },
    { kode: "bbTurun", pertanyaan: "BB turun 2 bulan berturut-turut", tipe: "checkbox", wajib: false, bucket: "baha" },
  ],
  // Section `hasil` sengaja kosong: pilihan hasil kunjungan (`hasilOpsi`) masih
  // konstanta di src/lib/constants.ts, bukan baris question.
};

const KEGIATAN_QUESTIONS: Record<string, SeedQuestion[]> = {
  "Identitas Kegiatan": [
    { kode: "namaKegiatan", pertanyaan: "Nama kegiatan", tipe: "text", wajib: true },
    { kode: "penanggungJawab", pertanyaan: "Penanggung jawab", tipe: "text", wajib: true },
    { kode: "tanggal", pertanyaan: "Tanggal", tipe: "date", wajib: true },
    { kode: "jam", pertanyaan: "Jam", tipe: "time", wajib: false },
    { kode: "targetPeserta", pertanyaan: "Target peserta", tipe: "text", wajib: false },
    {
      kode: "jenisKegiatan",
      pertanyaan: "Jenis kegiatan",
      tipe: "select",
      wajib: false,
      opsi: ["Penyuluhan", "Posyandu", "Kelas ibu", "Senam", "Gotong royong", "Pelatihan kader"],
    },
  ],
  "Kelurahan & Lokasi": [
    {
      kode: "kelurahan",
      pertanyaan: "Kelurahan",
      tipe: "select",
      wajib: true,
      opsi: ["Trajeng", "Ngemplakrejo", "Tambaan", "Mayangan"],
    },
    {
      kode: "posyandu",
      pertanyaan: "Posyandu",
      tipe: "select",
      wajib: false,
      opsi: ["Melati 1", "Mawar 2", "Kenanga", "Flamboyan"],
    },
    { kode: "lokasi", pertanyaan: "Lokasi", tipe: "text", wajib: true },
    { kode: "deskripsiKegiatan", pertanyaan: "Deskripsi kegiatan", tipe: "text", wajib: false },
  ],
  "Peserta & Kehadiran": [
    { kode: "namaPeserta", pertanyaan: "Nama peserta", tipe: "text", wajib: true },
    {
      kode: "kelurahanPeserta",
      pertanyaan: "Kelurahan peserta",
      tipe: "select",
      wajib: false,
      opsi: ["Trajeng", "Ngemplakrejo", "Tambaan", "Mayangan"],
    },
    { kode: "hadir", pertanyaan: "Hadir", tipe: "checkbox", wajib: false },
  ],
  Dokumentasi: [
    { kode: "fotoKegiatan", pertanyaan: "Foto kegiatan", tipe: "text", wajib: false },
    { kode: "keteranganFoto", pertanyaan: "Keterangan foto", tipe: "text", wajib: false },
  ],
};

// `version` untuk form kunjungan rumah harus sama dengan
// KUNJUNGAN_RUMAH_TEMPLATE_VERSION di src/lib/kunjungan-rumah-templates.ts (sekarang 17).
// Nilainya ditulis ulang di sini, bukan di-import, karena seeder tidak boleh bergantung
// pada modul src/. Mapper di src akan menolak kalau versinya berbeda.
const FORM_DEFS = [
  {
    nama: KUNJUNGAN_RUMAH,
    deskripsi: "Catat kegiatan kunjungan rumah — GERMAS 2024.",
    version: 17,
    sections: KUNJUNGAN_RUMAH_SECTIONS,
  },
  {
    nama: PEMBERDAYAAN,
    deskripsi: "Catat kegiatan pemberdayaan masyarakat, kehadiran peserta, dan dokumentasi foto.",
    version: 1,
    sections: PEMBERDAYAAN_SECTIONS,
  },
];

// ── master data admin /kelola ──
// Data ini pernah hard-code di src/lib/seeds.ts. Yang dihapus di commit deb5f73 adalah
// password staf plaintext, bukan isi datanya — jadi datanya dipindah ke sini, ke tabel
// `admin_priorities` / `admin_items` / `admin_staff`.

const ADMIN_PRIORITIES = [
  { nama: "ODGJ", desk: "Orang dengan gangguan jiwa — pantau obat dan kontrol.", warna: "tag-odgj" },
  { nama: "Bumil Risti", desk: "Ibu hamil risiko tinggi — ANC dan tanda bahaya.", warna: "tag-bumil" },
  { nama: "Balita Risti", desk: "Balita berisiko gizi — timbang dan imunisasi.", warna: "tag-balita" },
  { nama: "TB", desk: "Pasien tuberkulosis — kepatuhan OAT.", warna: "tag-tb" },
  { nama: "Stunting", desk: "Balita stunting — tumbuh kembang dan gizi.", warna: "tag-stunt" },
];

// Item pemeriksaan per prioritas. `kode` dibuat dari slug `prio` + nomor urut supaya
// tetap stabil walau admin mengganti judulnya.
const ADMIN_ITEMS: Record<string, [judul: string, desk: string][]> = {
  ODGJ: [
    ["Minum obat rutin", "Obat diminum sesuai jadwal, sisa obat dihitung."],
    ["Kontrol terjadwal", "Jadwal kontrol berikutnya sudah dipegang keluarga."],
    ["Kebersihan diri", "Mandi, pakaian bersih, kuku pendek."],
    ["Pola tidur", "Tidur malam cukup, tidak begadang / gelisah."],
    ["Aktivitas harian", "Ada aktivitas ringan di rumah / luar."],
    ["Gejala gaduh gelisah", "Tidak ada marah, teriak, merusak, atau kabur minggu ini."],
    ["Dukungan keluarga", "Keluarga tahu jadwal obat dan tanda kambuh."],
  ],
  "Bumil Risti": [
    ["Kunjungan ANC", "Cek buku KIA, keluhan, dan usia kehamilan."],
    ["Tablet tambah darah", "Stok ada dan diminum tiap malam."],
    ["Tekanan darah", "Ukur tensi, waspadai ≥140/90."],
    ["Berat badan & TFU", "BB naik wajar, TFU sesuai usia kehamilan."],
    ["Lab / USG", "HB, protein urin, atau USG sesuai jadwal."],
    ["Tanda bahaya", "Edukasi perdarahan, bengkak, sakit kepala, rembes."],
    ["Rencana rujukan", "RS / Puskesmas PONED dan transportasi siap."],
  ],
  "Balita Risti": [
    ["Timbang & ukur", "BB, TB, LiLA dicatat dan diplot ke KMS."],
    ["Imunisasi", "Cek status imunisasi sesuai umur."],
    ["ASI / MPASI", "ASI eksklusif <6 bln, MPASI adekuat ≥6 bln."],
    ["Diare / ISPA", "Tanya BAB, batuk pilek, demam 2 minggu terakhir."],
    ["Tanda gizi buruk", "Cek edema, kurus ekstrem, rambut jarang."],
    ["Stimulasi", "Ajak bicara, main, pantau milestone."],
    ["Rujukan gizi", "Rujuk bila gizi kurang / buruk atau tidak naik BB."],
  ],
  TB: [
    ["Minum OAT tiap hari", "Pengawas menelan obat (PMO) aktif."],
    ["Batuk & dahak", "Lama batuk, dahak, sesak, demam malam."],
    ["Berat badan", "BB ditimbang, nafsu makan ditanya."],
    ["Kontak serumah", "Anggota serumah diskrining batuk."],
    ["Dahak ulang", "Jadwal cek dahak bulan berjalan jelas."],
    ["Etika batuk", "Masker, ventilasi, jemur kasur, ludah tertutup."],
  ],
  Stunting: [
    ["BB & TB diplot", "Diukur dan diplot ke kurva pertumbuhan."],
    ["ASI / MPASI adekuat", "Frekuensi, porsi, dan variasi cukup."],
    ["Suplementasi", "Vitamin A, taburia / zink bila program berjalan."],
    ["Sanitasi rumah", "Air bersih, jamban, cuci tangan pakai sabun."],
    ["Stimulasi & PAUD", "Anak aktif, diajak main dan bicara."],
    ["Kunjungan ulang", "Jadwal timbang bulan depan disepakati."],
  ],
};

// Hanya data profil. TIDAK ADA password: login aplikasi memakai PIN tunggal dari env,
// jadi kredensial per staf tidak pernah dibutuhkan dan tidak boleh disimpan.
const ADMIN_STAFF = [
  { nama: "dr. Ayu Rahmawati", peran: "Admin", kel: "Trajeng", posy: "—", hp: "0811-0000-01", username: "admin", on: true },
  { nama: "Siti Aminah", peran: "Kader", kel: "Trajeng", posy: "Melati 1", hp: "0812-0000-02", username: "siti.aminah", on: true },
  { nama: "Siti Nurhaliza", peran: "Bidan", kel: "Ngemplakrejo", posy: "Kenanga", hp: "0812-0000-03", username: "siti.nurhaliza", on: true },
  { nama: "Budi Santoso", peran: "Kader", kel: "Tambaan", posy: "Mawar 2", hp: "0812-0000-04", username: "budi.santoso", on: true },
  { nama: "Dewi Lestari", peran: "Perawat", kel: "Mayangan", posy: "Flamboyan", hp: "0812-0000-05", username: "dewi.lestari", on: true },
  { nama: "Agus Wijaya", peran: "Kader", kel: "Mayangan", posy: "Flamboyan", hp: "0812-0000-06", username: "agus.wijaya", on: false },
];

/** Slug untuk `admin_items.kode`: huruf kecil, spasi jadi tanda hubung. */
function itemKode(prio: string, index: number): string {
  const slug = prio
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${slug}-${index + 1}`;
}

async function seedAdminMaster() {
  for (const p of ADMIN_PRIORITIES) {
    await db
      .insert(adminPriorities)
      .values({ nama: p.nama, desk: p.desk, warna: p.warna, on: true })
      .onConflictDoUpdate({ target: adminPriorities.nama, set: { desk: p.desk, warna: p.warna, updatedAt: new Date() } });
  }
  console.log(`= ${ADMIN_PRIORITIES.length} prioritas`);

  let jumlahItem = 0;
  for (const [prio, rows] of Object.entries(ADMIN_ITEMS)) {
    for (const [i, [judul, desk]] of rows.entries()) {
      const kode = itemKode(prio, i);
      await db
        .insert(adminItems)
        .values({ kode, prio, judul, desk, on: true })
        .onConflictDoUpdate({ target: adminItems.kode, set: { prio, judul, desk, updatedAt: new Date() } });
      jumlahItem += 1;
    }
  }
  console.log(`= ${jumlahItem} item pemeriksaan`);

  // Seed ulang tidak boleh mengubah status `on` yang sudah disetel admin di UI, jadi
  // profil pakai onConflictDoNothing. Password memang tidak ada di tabel sejak awal.
  for (const s of ADMIN_STAFF) {
    await db.insert(adminStaff).values(s).onConflictDoNothing();
  }
  console.log(`= ${ADMIN_STAFF.length} staf (profil saja, tanpa password)`);
}

async function ensureFormId(nama: string, deskripsi: string, version: number): Promise<string> {
  const [existing] = await db.select({ id: forms.id, version: forms.version }).from(forms).where(eq(forms.nama, nama)).limit(1);
  if (existing) {
    // `version` ikut di-upsert: kalau definisi form berubah, versi ikut naik supaya
    // record lama tetap bisa dibedakan dari yang memakai definisi baru.
    if (existing.version !== version) {
      await db.update(forms).set({ version }).where(eq(forms.id, existing.id));
      console.log(`~ version form ${nama}: ${existing.version} -> ${version}`);
    }
    return existing.id;
  }

  const [inserted] = await db.insert(forms).values({ nama, deskripsi, aktif: true, version }).returning();
  if (!inserted) throw new Error(`Gagal menambahkan form ${nama}`);
  console.log(`+ form ${nama}`);
  return inserted.id;
}

async function ensureSections(
  formId: string,
  formNama: string,
  sections: { nama: string; deskripsi: string }[]
): Promise<Map<string, string>> {
  const expected = sections.map((section) => section.nama);

  const found = await db
    .select({ id: formSections.id, nama: formSections.nama })
    .from(formSections)
    .where(eq(formSections.formId, formId));

  const byName = new Map(found.map((row) => [row.nama, row.id]));

  for (const [index, section] of sections.entries()) {
    if (byName.has(section.nama)) continue;

    const [inserted] = await db
      .insert(formSections)
      .values({ formId, nama: section.nama, deskripsi: section.deskripsi, urutan: index + 1 })
      .returning();

    if (!inserted) throw new Error(`Gagal menambahkan section ${section.nama} pada ${formNama}`);
    byName.set(section.nama, inserted.id);
    console.log(`+ section ${formNama} / ${section.nama}`);
  }

  const orphans = found.filter((row) => !expected.includes(row.nama));
  if (orphans.length > 0) {
    console.log(
      `⚠️  Section lama pada ${formNama} tidak dihapus: ${orphans.map((row) => row.nama).join(", ")}`
    );
  }

  return byName;
}

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

type QuestionRow = {
  sectionId: string;
  kode: string;
  pertanyaan: string;
  tipe: string;
  bucket: string | null;
  hint: string | null;
  wajib: boolean;
  urutan: number;
  parentId: string | null;
};

// `set` ditulis eksplisit dengan `excluded` supaya satu statement bisa meng-update
// banyak baris sekaligus. Kalau memakai objek biasa, drizzle memakai satu objek yang
// sama untuk semua baris — artinya setiap question akan ditulis dengan pertanyaan
// milik baris terakhir. Dipakai per-section, bukan per-row, karena 395 round trip
// ke Supabase pooler dari luar jaringan terlalu lambat.
const UPSERT_SET = {
  pertanyaan: sql`excluded."pertanyaan"`,
  tipe: sql`excluded."tipe"`,
  bucket: sql`excluded."bucket"`,
  hint: sql`excluded."hint"`,
  wajib: sql`excluded."wajib"`,
  urutan: sql`excluded."urutan"`,
  parentId: sql`excluded."parentId"`,
  aktif: sql`excluded."aktif"`,
  updatedAt: sql`now()`,
};

async function upsertQuestions(
  tx: Tx,
  rows: QuestionRow[]
): Promise<Map<string, string>> {
  if (rows.length === 0) return new Map();

  const saved = await tx
    .insert(questions)
    .values(rows.map((row) => ({ ...row, aktif: true })))
    .onConflictDoUpdate({
      target: [questions.sectionId, questions.kode],
      set: UPSERT_SET,
    })
    .returning({ id: questions.id, kode: questions.kode });

  return new Map(saved.map((row) => [row.kode, row.id]));
}

// Opsi ditulis ulang penuh tiap kali seeder dijalankan: hapus dulu semua opsi milik
// question yang tersentuh, lalu insert ulang dari definisi. Karena `value` sekarang
// sama dengan `label`, tidak ada nilai jawaban lama yang jadi menggantung.
async function replaceOptions(
  tx: Tx,
  questionIds: string[],
  rows: { questionId: string; label: string; value: string; urutan: number }[]
): Promise<number> {
  if (questionIds.length === 0) return 0;
  await tx.delete(formFieldOptions).where(inArray(formFieldOptions.questionId, questionIds));
  if (rows.length === 0) return 0;
  await tx.insert(formFieldOptions).values(rows);
  return rows.length;
}

async function seedQuestions(
  formNama: string,
  sectionNama: string,
  sectionId: string,
  questionDefs: SeedQuestion[]
): Promise<{ questions: number; groups: number; options: number }> {
  if (questionDefs.length === 0) return { questions: 0, groups: 0, options: 0 };

  // Group di-upsert lebih dulu supaya anak-anaknya bisa menunjuk parentId-nya.
  // Parent dicocokkan lewat `kode`, bukan `pertanyaan`: label `tempat` muncul 8x
  // dalam satu section, jadi mencocokkan lewat teks akan salah.
  const groups = questionDefs.filter((def) => def.tipe === "group");
  const leaves = questionDefs.filter((def) => def.tipe !== "group");
  const groupKode = new Set(groups.map((def) => def.kode));

  for (const leaf of leaves) {
    if (leaf.parent !== undefined && !groupKode.has(leaf.parent)) {
      throw new Error(`Parent "${leaf.parent}" tidak ditemukan untuk ${leaf.kode} (${sectionNama})`);
    }
  }

  const toRow = (def: SeedQuestion, urutan: number, parentId: string | null): QuestionRow => ({
    sectionId,
    kode: def.kode,
    pertanyaan: def.pertanyaan,
    tipe: def.tipe,
    bucket: def.bucket ?? null,
    hint: def.hint ?? null,
    wajib: def.wajib,
    urutan,
    parentId,
  });

  return db.transaction(async (tx) => {
    const groupRows = groups.map((def, index) => toRow(def, index + 1, null));
    const idByKode = await upsertQuestions(tx, groupRows);

    const leafRows = leaves.map((def, index) =>
      toRow(def, groups.length + index + 1, def.parent === undefined ? null : (idByKode.get(def.parent) ?? null))
    );
    const leafIds = await upsertQuestions(tx, leafRows);

    // Opsi ditulis setelah leaf di-upsert supaya questionId-nya sudah valid.
    const optionRows: { questionId: string; label: string; value: string; urutan: number }[] = [];
    const touchedIds: string[] = [];
    for (const def of leaves) {
      const id = leafIds.get(def.kode);
      if (id === undefined) continue;
      touchedIds.push(id);
      for (const [index, label] of (def.opsi ?? []).entries()) {
        optionRows.push({ questionId: id, label, value: label, urutan: index + 1 });
      }
    }
    const optionCount = await replaceOptions(tx, touchedIds, optionRows);

    const total = groups.length + leaves.length;
    console.log(`+ ${total} questions ${formNama} / ${sectionNama} (${groups.length} grup, ${optionCount} opsi)`);
    return { questions: total, groups: groups.length, options: optionCount };
  });
}

async function seed() {
  console.log("🌱 Seeding forms...");

  const stats = { questions: 0, groups: 0, options: 0 };

  for (const formDef of FORM_DEFS) {
    const formId = await ensureFormId(formDef.nama, formDef.deskripsi, formDef.version);
    const sectionIds = await ensureSections(formId, formDef.nama, formDef.sections);

    for (const section of formDef.sections) {
      const sectionId = sectionIds.get(section.nama);
      if (!sectionId) continue;
      const result = await seedQuestions(
        formDef.nama,
        section.nama,
        sectionId,
        KUNJUNGAN_RUMAH === formDef.nama
          ? (KUNJUNGAN_RUMAH_QUESTIONS[section.nama] ?? [])
          : (KEGIATAN_QUESTIONS[section.nama] ?? [])
      );
      stats.questions += result.questions;
      stats.groups += result.groups;
      stats.options += result.options;
    }
  }

  console.log(
    `ℹ️  ${stats.questions} questions (${stats.groups} grup), ${stats.options} opsi di form_field_options`
  );
  console.log("✅ Forms berhasil di-seed");

  // Master data admin jalan terpisah dari forms: tidak butuh truncate forms, dan
  // kegagalan di sini tidak boleh membatalkan seeding form.
  await seedAdminMaster();
}

seed()
  .catch((error) => {
    console.error("❌ Seeder gagal:", error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
