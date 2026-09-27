import { eq } from "drizzle-orm";
import { db } from "@/lib/db.server";
import { forms, formSections, questions } from "@/lib/schema";

const KUNJUNGAN_RUMAH = "Form Kunjungan Rumah";
const PEMBERDAYAAN = "Form Kegiatan Pemberdayaan";

interface SeedQuestion {
  pertanyaan: string;
  tipe: string;
  wajib: boolean;
  parent?: string;
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
    { pertanyaan: "Tanggal pengumpulan data", tipe: "date", wajib: true },
    { pertanyaan: "Posyandu", tipe: "text", wajib: true },
    { pertanyaan: "Desa/Kelurahan", tipe: "text", wajib: false },
    { pertanyaan: "Kecamatan", tipe: "text", wajib: false },
    { pertanyaan: "Puskesmas", tipe: "text", wajib: false },
    { pertanyaan: "Pustu / posyandu prima", tipe: "text", wajib: false },
    { pertanyaan: "Nama kepala keluarga", tipe: "text", wajib: false },
    { pertanyaan: "Alamat", tipe: "text", wajib: false },
    { pertanyaan: "No. HP KK/anggota", tipe: "text", wajib: false },
    { pertanyaan: "Kabupaten/Kota", tipe: "text", wajib: false },
    { pertanyaan: "Provinsi", tipe: "text", wajib: false },
  ],
  "anggota": [
    { pertanyaan: "Nama lengkap", tipe: "text", wajib: true },
    { pertanyaan: "NIK", tipe: "text", wajib: true },
    { pertanyaan: "Tanggal lahir", tipe: "date", wajib: true },
    { pertanyaan: "Jenis kelamin", tipe: "select", wajib: false },
    { pertanyaan: "Hubungan dengan KK", tipe: "select", wajib: false },
    { pertanyaan: "Status perkawinan", tipe: "select", wajib: false },
    { pertanyaan: "Pendidikan terakhir", tipe: "select", wajib: false },
    { pertanyaan: "Pekerjaan", tipe: "select", wajib: false },
  ],
  "sanitasi": [
    { pertanyaan: "Jaminan kesehatan (JKN/JamKesDa)", tipe: "checkbox", wajib: false },
    { pertanyaan: "Ventilasi cukup", tipe: "checkbox", wajib: false },
    { pertanyaan: "Anggota dgn gangguan jiwa (ODGJ)", tipe: "checkbox", wajib: false },
    { pertanyaan: "Anggota terdiagnosa TBC", tipe: "checkbox", wajib: false },
    { pertanyaan: "Anggota terdiagnosa hipertensi", tipe: "checkbox", wajib: false },
    { pertanyaan: "Anggota terdiagnosa DM", tipe: "checkbox", wajib: false },
    { pertanyaan: "jamban keluarga", tipe: "select", wajib: false },
    { pertanyaan: "sarana air bersih", tipe: "select", wajib: false },
  ],
  "masalah": [
    { pertanyaan: "Nama", tipe: "text", wajib: false },
    { pertanyaan: "NIK", tipe: "text", wajib: false },
    { pertanyaan: "Tanggal lahir", tipe: "date", wajib: false },
    { pertanyaan: "Alamat", tipe: "text", wajib: false },
    { pertanyaan: "No. telepon", tipe: "text", wajib: false },
    { pertanyaan: "Masalah kesehatan ditemukan", tipe: "text", wajib: false },
    { pertanyaan: "Tindak lanjut", tipe: "text", wajib: false },
  ],
  "ibu-hamil": [
    { pertanyaan: "Nama", tipe: "text", wajib: false },
    { pertanyaan: "Umur (thn)", tipe: "number", wajib: false },
    { pertanyaan: "Kehamilan anak ke-", tipe: "number", wajib: false },
    { pertanyaan: "Jarak kehamilan sebelumnya", tipe: "text", wajib: false },
    { pertanyaan: "K1 — Trimester 1 (≤12 minggu)", tipe: "group", wajib: false },
    { pertanyaan: "tempat", tipe: "text", wajib: false, parent: "K1 — Trimester 1 (≤12 minggu)" },
    { pertanyaan: "tanggal", tipe: "date", wajib: false, parent: "K1 — Trimester 1 (≤12 minggu)" },
    { pertanyaan: "petugas", tipe: "text", wajib: false, parent: "K1 — Trimester 1 (≤12 minggu)" },
    { pertanyaan: "K2 — Trimester 2 (12-24 minggu)", tipe: "group", wajib: false },
    { pertanyaan: "tempat", tipe: "text", wajib: false, parent: "K2 — Trimester 2 (12-24 minggu)" },
    { pertanyaan: "tanggal", tipe: "date", wajib: false, parent: "K2 — Trimester 2 (12-24 minggu)" },
    { pertanyaan: "petugas", tipe: "text", wajib: false, parent: "K2 — Trimester 2 (12-24 minggu)" },
    { pertanyaan: "K3 — Trimester 2 (12-24 minggu)", tipe: "group", wajib: false },
    { pertanyaan: "tempat", tipe: "text", wajib: false, parent: "K3 — Trimester 2 (12-24 minggu)" },
    { pertanyaan: "tanggal", tipe: "date", wajib: false, parent: "K3 — Trimester 2 (12-24 minggu)" },
    { pertanyaan: "petugas", tipe: "text", wajib: false, parent: "K3 — Trimester 2 (12-24 minggu)" },
    { pertanyaan: "K4 — Trimester 3 (24–40 minggu)", tipe: "group", wajib: false },
    { pertanyaan: "tempat", tipe: "text", wajib: false, parent: "K4 — Trimester 3 (24–40 minggu)" },
    { pertanyaan: "tanggal", tipe: "date", wajib: false, parent: "K4 — Trimester 3 (24–40 minggu)" },
    { pertanyaan: "petugas", tipe: "text", wajib: false, parent: "K4 — Trimester 3 (24–40 minggu)" },
    { pertanyaan: "K5 — Trimester 3 (24–40 minggu)", tipe: "group", wajib: false },
    { pertanyaan: "tempat", tipe: "text", wajib: false, parent: "K5 — Trimester 3 (24–40 minggu)" },
    { pertanyaan: "tanggal", tipe: "date", wajib: false, parent: "K5 — Trimester 3 (24–40 minggu)" },
    { pertanyaan: "petugas", tipe: "text", wajib: false, parent: "K5 — Trimester 3 (24–40 minggu)" },
    { pertanyaan: "K6 — Trimester 3 (24–40 minggu)", tipe: "group", wajib: false },
    { pertanyaan: "tempat", tipe: "text", wajib: false, parent: "K6 — Trimester 3 (24–40 minggu)" },
    { pertanyaan: "tanggal", tipe: "date", wajib: false, parent: "K6 — Trimester 3 (24–40 minggu)" },
    { pertanyaan: "petugas", tipe: "text", wajib: false, parent: "K6 — Trimester 3 (24–40 minggu)" },
    { pertanyaan: "Kelas Ibu", tipe: "group", wajib: false },
    { pertanyaan: "tempat", tipe: "text", wajib: false, parent: "Kelas Ibu" },
    { pertanyaan: "tanggal", tipe: "date", wajib: false, parent: "Kelas Ibu" },
    { pertanyaan: "petugas", tipe: "text", wajib: false, parent: "Kelas Ibu" },
    { pertanyaan: "Skrining kesehatan jiwa — Ibu Hamil", tipe: "group", wajib: false },
    { pertanyaan: "tempat", tipe: "text", wajib: false, parent: "Skrining kesehatan jiwa — Ibu Hamil" },
    { pertanyaan: "tanggal", tipe: "date", wajib: false, parent: "Skrining kesehatan jiwa — Ibu Hamil" },
    { pertanyaan: "petugas", tipe: "text", wajib: false, parent: "Skrining kesehatan jiwa — Ibu Hamil" },
    { pertanyaan: "Edukasi Nakes — Ibu Hamil", tipe: "group", wajib: false },
    { pertanyaan: "materi", tipe: "text", wajib: false, parent: "Edukasi Nakes — Ibu Hamil" },
    { pertanyaan: "tanggal", tipe: "date", wajib: false, parent: "Edukasi Nakes — Ibu Hamil" },
    { pertanyaan: "Paraf (tulis nama sasaran)", tipe: "text", wajib: false },
    { pertanyaan: "Melaporkan ke nakes", tipe: "date", wajib: false },
    { pertanyaan: "Suhu tubuh >=37.5°C", tipe: "checkbox", wajib: false },
    { pertanyaan: "Isi piringku sesuai", tipe: "checkbox", wajib: false },
    { pertanyaan: "ada PMT untuk Bumil KEK", tipe: "checkbox", wajib: false },
    { pertanyaan: "Ada buku KIA", tipe: "checkbox", wajib: false },
    { pertanyaan: "TTD tersedia", tipe: "checkbox", wajib: false },
    { pertanyaan: "TTD diminum hari ini (24 jam)", tipe: "checkbox", wajib: false },
    { pertanyaan: "LiLA < 23,5 cm (risiko KEK)", tipe: "checkbox", wajib: false },
    { pertanyaan: "Demam > 2 hari", tipe: "checkbox", wajib: false },
    { pertanyaan: "Pusing / sakit kepala berat / pandangan kabur + bengkak", tipe: "checkbox", wajib: false },
    { pertanyaan: "Sulit tidur / cemas berlebih", tipe: "checkbox", wajib: false },
    { pertanyaan: "Diare berulang", tipe: "checkbox", wajib: false },
    { pertanyaan: "Risiko TBC", tipe: "checkbox", wajib: false },
    { pertanyaan: "Tidak ada gerakan janin", tipe: "checkbox", wajib: false },
    { pertanyaan: "Jantung berdebar / nyeri dada", tipe: "checkbox", wajib: false },
    { pertanyaan: "Keluar cairan dari jalan lahir", tipe: "checkbox", wajib: false },
    { pertanyaan: "Sakit saat kencing", tipe: "checkbox", wajib: false },
    { pertanyaan: "Nyeri perut hebat", tipe: "checkbox", wajib: false },
    { pertanyaan: "Mengingatkan periksa ke Pustu/Fasyankes", tipe: "checkbox", wajib: false },
  ],
  "bersalin-nifas": [
    { pertanyaan: "Nama ibu", tipe: "text", wajib: false },
    { pertanyaan: "Umur (thn)", tipe: "number", wajib: false },
    { pertanyaan: "Kelahiran anak ke-", tipe: "number", wajib: false },
    { pertanyaan: "Tanggal persalinan", tipe: "date", wajib: false },
    { pertanyaan: "Pukul", tipe: "text", wajib: false },
    { pertanyaan: "Usia kehamilan saat persalinan (minggu)", tipe: "number", wajib: false },
    { pertanyaan: "Nama tempat persalinan", tipe: "text", wajib: false },
    { pertanyaan: "Tanggal kunjungan", tipe: "date", wajib: false },
    { pertanyaan: "KF1 — Pemeriksaan nifas", tipe: "group", wajib: false },
    { pertanyaan: "tempat", tipe: "text", wajib: false, parent: "KF1 — Pemeriksaan nifas" },
    { pertanyaan: "tanggal", tipe: "date", wajib: false, parent: "KF1 — Pemeriksaan nifas" },
    { pertanyaan: "petugas", tipe: "text", wajib: false, parent: "KF1 — Pemeriksaan nifas" },
    { pertanyaan: "KF2 — Pemeriksaan nifas", tipe: "group", wajib: false },
    { pertanyaan: "tempat", tipe: "text", wajib: false, parent: "KF2 — Pemeriksaan nifas" },
    { pertanyaan: "tanggal", tipe: "date", wajib: false, parent: "KF2 — Pemeriksaan nifas" },
    { pertanyaan: "petugas", tipe: "text", wajib: false, parent: "KF2 — Pemeriksaan nifas" },
    { pertanyaan: "KF3 — Pemeriksaan nifas", tipe: "group", wajib: false },
    { pertanyaan: "tempat", tipe: "text", wajib: false, parent: "KF3 — Pemeriksaan nifas" },
    { pertanyaan: "tanggal", tipe: "date", wajib: false, parent: "KF3 — Pemeriksaan nifas" },
    { pertanyaan: "petugas", tipe: "text", wajib: false, parent: "KF3 — Pemeriksaan nifas" },
    { pertanyaan: "KF4 — Pemeriksaan nifas", tipe: "group", wajib: false },
    { pertanyaan: "tempat", tipe: "text", wajib: false, parent: "KF4 — Pemeriksaan nifas" },
    { pertanyaan: "tanggal", tipe: "date", wajib: false, parent: "KF4 — Pemeriksaan nifas" },
    { pertanyaan: "petugas", tipe: "text", wajib: false, parent: "KF4 — Pemeriksaan nifas" },
    { pertanyaan: "tanggal pemberian", tipe: "date", wajib: false },
    { pertanyaan: "Edukasi Nakes — Ibu Bersalin & Nifas", tipe: "group", wajib: false },
    { pertanyaan: "materi", tipe: "text", wajib: false, parent: "Edukasi Nakes — Ibu Bersalin & Nifas" },
    { pertanyaan: "tanggal", tipe: "date", wajib: false, parent: "Edukasi Nakes — Ibu Bersalin & Nifas" },
    { pertanyaan: "Melaporkan ke nakes", tipe: "date", wajib: false },
    { pertanyaan: "Paraf (tulis nama sasaran)", tipe: "text", wajib: false },
    { pertanyaan: "Suhu tubuh >=37.5°C", tipe: "checkbox", wajib: false },
    { pertanyaan: "Isi piringku ibu menyusui", tipe: "checkbox", wajib: false },
    { pertanyaan: "Ada buku KIA", tipe: "checkbox", wajib: false },
    { pertanyaan: "Menyusui", tipe: "checkbox", wajib: false },
    { pertanyaan: "Riwayat IMD", tipe: "checkbox", wajib: false },
    { pertanyaan: "Skrining kesehatan jiwa", tipe: "checkbox", wajib: false },
    { pertanyaan: "Demam", tipe: "checkbox", wajib: false },
    { pertanyaan: "Perasaan sedih / mudah menangis / depresi", tipe: "checkbox", wajib: false },
    { pertanyaan: "Gangguan BAK", tipe: "checkbox", wajib: false },
    { pertanyaan: "Napas pendek / sesak", tipe: "checkbox", wajib: false },
    { pertanyaan: "Sakit kepala", tipe: "checkbox", wajib: false },
    { pertanyaan: "Perdarahan", tipe: "checkbox", wajib: false },
    { pertanyaan: "Area kelamin bengkak / nyeri / luka", tipe: "checkbox", wajib: false },
    { pertanyaan: "Keluar cairan dari jalan lahir", tipe: "checkbox", wajib: false },
    { pertanyaan: "Nyeri ulu hati", tipe: "checkbox", wajib: false },
    { pertanyaan: "Pandangan kabur", tipe: "checkbox", wajib: false },
    { pertanyaan: "Payudara bengkak kemerahan", tipe: "checkbox", wajib: false },
    { pertanyaan: "Darah nifas berbau", tipe: "checkbox", wajib: false },
    { pertanyaan: "Keputihan berlebihan", tipe: "checkbox", wajib: false },
    { pertanyaan: "Jantung berdebar", tipe: "checkbox", wajib: false },
    { pertanyaan: "Mengingatkan periksa", tipe: "checkbox", wajib: false },
  ],
  "bayi": [
    { pertanyaan: "Nama anak", tipe: "text", wajib: false },
    { pertanyaan: "Tempat lahir", tipe: "text", wajib: false },
    { pertanyaan: "Tanggal lahir", tipe: "date", wajib: false },
    { pertanyaan: "Tanggal terakhir ditimbang/diukur", tipe: "date", wajib: false },
    { pertanyaan: "KN0 — Kunjungan neonatus", tipe: "group", wajib: false },
    { pertanyaan: "tanggal", tipe: "date", wajib: false, parent: "KN0 — Kunjungan neonatus" },
    { pertanyaan: "tempat", tipe: "text", wajib: false, parent: "KN0 — Kunjungan neonatus" },
    { pertanyaan: "bidan/dokter", tipe: "text", wajib: false, parent: "KN0 — Kunjungan neonatus" },
    { pertanyaan: "KN1 — Kunjungan neonatus", tipe: "group", wajib: false },
    { pertanyaan: "tanggal", tipe: "date", wajib: false, parent: "KN1 — Kunjungan neonatus" },
    { pertanyaan: "tempat", tipe: "text", wajib: false, parent: "KN1 — Kunjungan neonatus" },
    { pertanyaan: "bidan/dokter", tipe: "text", wajib: false, parent: "KN1 — Kunjungan neonatus" },
    { pertanyaan: "KN2 — Kunjungan neonatus", tipe: "group", wajib: false },
    { pertanyaan: "tanggal", tipe: "date", wajib: false, parent: "KN2 — Kunjungan neonatus" },
    { pertanyaan: "tempat", tipe: "text", wajib: false, parent: "KN2 — Kunjungan neonatus" },
    { pertanyaan: "bidan/dokter", tipe: "text", wajib: false, parent: "KN2 — Kunjungan neonatus" },
    { pertanyaan: "KN3 — Kunjungan neonatus", tipe: "group", wajib: false },
    { pertanyaan: "tanggal", tipe: "date", wajib: false, parent: "KN3 — Kunjungan neonatus" },
    { pertanyaan: "tempat", tipe: "text", wajib: false, parent: "KN3 — Kunjungan neonatus" },
    { pertanyaan: "bidan/dokter", tipe: "text", wajib: false, parent: "KN3 — Kunjungan neonatus" },
    { pertanyaan: "Edukasi Nakes — Bayi (0–6 bln)", tipe: "group", wajib: false },
    { pertanyaan: "materi", tipe: "text", wajib: false, parent: "Edukasi Nakes — Bayi (0–6 bln)" },
    { pertanyaan: "tanggal", tipe: "date", wajib: false, parent: "Edukasi Nakes — Bayi (0–6 bln)" },
    { pertanyaan: "Melaporkan ke nakes", tipe: "date", wajib: false },
    { pertanyaan: "Paraf (tulis nama sasaran)", tipe: "text", wajib: false },
    { pertanyaan: "Suhu tubuh >=37.5°C", tipe: "checkbox", wajib: false },
    { pertanyaan: "Ada buku KIA", tipe: "checkbox", wajib: false },
    { pertanyaan: "ASI eksklusif", tipe: "checkbox", wajib: false },
    { pertanyaan: "Imunisasi 0 bln - Hepatitis B (0-24 jam)", tipe: "checkbox", wajib: false },
    { pertanyaan: "Imunisasi 0 bln - BCG", tipe: "checkbox", wajib: false },
    { pertanyaan: "Imunisasi 0 bln - Polio Tetes 1", tipe: "checkbox", wajib: false },
    { pertanyaan: "Imunisasi 1 bln - BCG", tipe: "checkbox", wajib: false },
    { pertanyaan: "Imunisasi 1 bln - Polio Tetes 1", tipe: "checkbox", wajib: false },
    { pertanyaan: "Imunisasi 2 bln - DPT-HB-Hib 1", tipe: "checkbox", wajib: false },
    { pertanyaan: "Imunisasi 2 bln - Polio Tetes 2", tipe: "checkbox", wajib: false },
    { pertanyaan: "Imunisasi 2 bln - PCV 1", tipe: "checkbox", wajib: false },
    { pertanyaan: "Imunisasi 2 bln - RV 1", tipe: "checkbox", wajib: false },
    { pertanyaan: "Imunisasi 3 bln - DPT-HB-Hib 2", tipe: "checkbox", wajib: false },
    { pertanyaan: "Imunisasi 3 bln - Polio Tetes 3", tipe: "checkbox", wajib: false },
    { pertanyaan: "Imunisasi 3 bln - PCV 2", tipe: "checkbox", wajib: false },
    { pertanyaan: "Imunisasi 3 bln - RV 2", tipe: "checkbox", wajib: false },
    { pertanyaan: "Imunisasi 4 bln - DPT-HB-Hib 3", tipe: "checkbox", wajib: false },
    { pertanyaan: "Imunisasi 4 bln - Polio Tetes 4", tipe: "checkbox", wajib: false },
    { pertanyaan: "Imunisasi 4 bln - Polio Suntik 1 (IPV 1)", tipe: "checkbox", wajib: false },
    { pertanyaan: "Imunisasi 4 bln - RV 3", tipe: "checkbox", wajib: false },
    { pertanyaan: "Napas", tipe: "checkbox", wajib: false },
    { pertanyaan: "Aktivitas", tipe: "checkbox", wajib: false },
    { pertanyaan: "Warna kulit", tipe: "checkbox", wajib: false },
    { pertanyaan: "Hisapan bayi", tipe: "checkbox", wajib: false },
    { pertanyaan: "Kejang", tipe: "checkbox", wajib: false },
    { pertanyaan: "Suhu tubuh", tipe: "checkbox", wajib: false },
    { pertanyaan: "BAB", tipe: "checkbox", wajib: false },
    { pertanyaan: "Jumlah/warna kencing", tipe: "checkbox", wajib: false },
    { pertanyaan: "Tali pusat", tipe: "checkbox", wajib: false },
    { pertanyaan: "Mata", tipe: "checkbox", wajib: false },
    { pertanyaan: "Kulit", tipe: "checkbox", wajib: false },
    { pertanyaan: "Imunisasi", tipe: "checkbox", wajib: false },
    { pertanyaan: "Mengingatkan periksa", tipe: "checkbox", wajib: false },
  ],
  "balita": [
    { pertanyaan: "Nama anak", tipe: "text", wajib: false },
    { pertanyaan: "Tempat lahir", tipe: "text", wajib: false },
    { pertanyaan: "Tanggal lahir", tipe: "date", wajib: false },
    { pertanyaan: "Tanggal terakhir menimbang & mengukur", tipe: "date", wajib: false },
    { pertanyaan: "Obat cacing - tanggal minum", tipe: "date", wajib: false },
    { pertanyaan: "materi", tipe: "text", wajib: false },
    { pertanyaan: "tanggal", tipe: "date", wajib: false },
    { pertanyaan: "Melaporkan ke nakes", tipe: "date", wajib: false },
    { pertanyaan: "Paraf (tulis nama sasaran)", tipe: "text", wajib: false },
    { pertanyaan: "Suhu tubuh >=37.5°C", tipe: "checkbox", wajib: false },
    { pertanyaan: "Imunisasi 0 bln - Hepatitis B (0-24 jam)", tipe: "checkbox", wajib: false },
    { pertanyaan: "Imunisasi 0 bln - BCG", tipe: "checkbox", wajib: false },
    { pertanyaan: "Imunisasi 0 bln - Polio Tetes 1", tipe: "checkbox", wajib: false },
    { pertanyaan: "Imunisasi 1 bln - BCG", tipe: "checkbox", wajib: false },
    { pertanyaan: "Imunisasi 1 bln - Polio Tetes 1", tipe: "checkbox", wajib: false },
    { pertanyaan: "Imunisasi 2 bln - DPT-HB-Hib 1", tipe: "checkbox", wajib: false },
    { pertanyaan: "Imunisasi 2 bln - Polio Tetes 2", tipe: "checkbox", wajib: false },
    { pertanyaan: "Imunisasi 2 bln - PCV 1", tipe: "checkbox", wajib: false },
    { pertanyaan: "Imunisasi 2 bln - RV 1", tipe: "checkbox", wajib: false },
    { pertanyaan: "Imunisasi 3 bln - DPT-HB-Hib 2", tipe: "checkbox", wajib: false },
    { pertanyaan: "Imunisasi 3 bln - Polio Tetes 3", tipe: "checkbox", wajib: false },
    { pertanyaan: "Imunisasi 3 bln - PCV 2", tipe: "checkbox", wajib: false },
    { pertanyaan: "Imunisasi 3 bln - RV 2", tipe: "checkbox", wajib: false },
    { pertanyaan: "Imunisasi 4 bln - DPT-HB-Hib 3", tipe: "checkbox", wajib: false },
    { pertanyaan: "Imunisasi 4 bln - Polio Tetes 4", tipe: "checkbox", wajib: false },
    { pertanyaan: "Imunisasi 4 bln - Polio Suntik 1 (IPV 1)", tipe: "checkbox", wajib: false },
    { pertanyaan: "Imunisasi 4 bln - RV 3", tipe: "checkbox", wajib: false },
    { pertanyaan: "Imunisasi 9 bln - Campak Rubella", tipe: "checkbox", wajib: false },
    { pertanyaan: "Imunisasi 9 bln - Polio Suntik (IPV 2)", tipe: "checkbox", wajib: false },
    { pertanyaan: "Imunisasi 10 bln - Japanese Encephalitis (JE)", tipe: "checkbox", wajib: false },
    { pertanyaan: "Imunisasi 12 bln - PCV 3", tipe: "checkbox", wajib: false },
    { pertanyaan: "Imunisasi 18 bln - DPT-HB-Hib lanjutan", tipe: "checkbox", wajib: false },
    { pertanyaan: "Imunisasi 18 bln - Campak Rubella lanjutan", tipe: "checkbox", wajib: false },
    { pertanyaan: "Ada buku KIA", tipe: "checkbox", wajib: false },
    { pertanyaan: "PMBA: makanan pokok", tipe: "checkbox", wajib: false },
    { pertanyaan: "PMBA: protein hewani", tipe: "checkbox", wajib: false },
    { pertanyaan: "PMBA: protein nabati", tipe: "checkbox", wajib: false },
    { pertanyaan: "PMBA: lemak", tipe: "checkbox", wajib: false },
    { pertanyaan: "PMBA: buah-sayur", tipe: "checkbox", wajib: false },
    { pertanyaan: "Napas", tipe: "checkbox", wajib: false },
    { pertanyaan: "Batuk grok-grok", tipe: "checkbox", wajib: false },
    { pertanyaan: "Diare", tipe: "checkbox", wajib: false },
    { pertanyaan: "Jumlah/warna kencing", tipe: "checkbox", wajib: false },
    { pertanyaan: "Warna kulit", tipe: "checkbox", wajib: false },
    { pertanyaan: "Aktivitas", tipe: "checkbox", wajib: false },
    { pertanyaan: "Hisapan", tipe: "checkbox", wajib: false },
    { pertanyaan: "Pemberian makanan", tipe: "checkbox", wajib: false },
    { pertanyaan: "Mengingatkan periksa", tipe: "checkbox", wajib: false },
  ],
  "remaja": [
    { pertanyaan: "Nama", tipe: "text", wajib: false },
    { pertanyaan: "Tempat lahir", tipe: "text", wajib: false },
    { pertanyaan: "Tanggal lahir", tipe: "date", wajib: false },
    { pertanyaan: "Tanggal terakhir menimbang/mengukur", tipe: "date", wajib: false },
    { pertanyaan: "PTM ≥15: tekanan darah hasil", tipe: "text", wajib: false },
    { pertanyaan: "PTM ≥15: gula darah hasil", tipe: "text", wajib: false },
    { pertanyaan: "Anemia (skrining Hb) 1 thn terakhir - tanggal", tipe: "date", wajib: false },
    { pertanyaan: "Skrining kesehatan jiwa — Usia Sekolah/Remaja (6–18 thn)", tipe: "group", wajib: false },
    { pertanyaan: "tanggal", tipe: "date", wajib: false, parent: "Skrining kesehatan jiwa — Usia Sekolah/Remaja (6–18 thn)" },
    { pertanyaan: "tempat", tipe: "text", wajib: false, parent: "Skrining kesehatan jiwa — Usia Sekolah/Remaja (6–18 thn)" },
    { pertanyaan: "petugas", tipe: "text", wajib: false, parent: "Skrining kesehatan jiwa — Usia Sekolah/Remaja (6–18 thn)" },
    { pertanyaan: "Edukasi Nakes — Usia Sekolah/Remaja (6–18 thn)", tipe: "group", wajib: false },
    { pertanyaan: "materi", tipe: "text", wajib: false, parent: "Edukasi Nakes — Usia Sekolah/Remaja (6–18 thn)" },
    { pertanyaan: "tanggal", tipe: "date", wajib: false, parent: "Edukasi Nakes — Usia Sekolah/Remaja (6–18 thn)" },
    { pertanyaan: "Paraf (tulis nama sasaran)", tipe: "text", wajib: false },
    { pertanyaan: "Suhu tubuh >=37.5°C", tipe: "checkbox", wajib: false },
    { pertanyaan: "Ada buku KIA", tipe: "checkbox", wajib: false },
    { pertanyaan: "Isi piringku sekolah/remaja", tipe: "checkbox", wajib: false },
    { pertanyaan: "TTD remaja putri tersedia", tipe: "checkbox", wajib: false },
    { pertanyaan: "TTD diminum hari ini (1 minggu)", tipe: "checkbox", wajib: false },
    { pertanyaan: "PTM ≥15: periksa tekanan darah setahun terakhir", tipe: "checkbox", wajib: false },
    { pertanyaan: "PTM ≥15: periksa gula darah setahun terakhir", tipe: "checkbox", wajib: false },
  ],
  "dewasa": [
    { pertanyaan: "Nama", tipe: "text", wajib: false },
    { pertanyaan: "Tempat lahir", tipe: "text", wajib: false },
    { pertanyaan: "Tanggal lahir", tipe: "date", wajib: false },
    { pertanyaan: "TD: terdiagnosa hipertensi (tanggal)", tipe: "date", wajib: false },
    { pertanyaan: "TD periksa 1 thn - tanggal", tipe: "date", wajib: false },
    { pertanyaan: "TD periksa 1 thn - tempat", tipe: "text", wajib: false },
    { pertanyaan: "TD periksa 1 thn - hasil", tipe: "text", wajib: false },
    { pertanyaan: "Gula darah: terdiagnosa DM (tanggal)", tipe: "date", wajib: false },
    { pertanyaan: "Gula darah periksa 1 thn - tanggal", tipe: "date", wajib: false },
    { pertanyaan: "Gula darah periksa 1 thn - tempat", tipe: "text", wajib: false },
    { pertanyaan: "Gula darah periksa 1 thn - hasil", tipe: "text", wajib: false },
    { pertanyaan: "Gula darah periksa 1 bln - tanggal", tipe: "date", wajib: false },
    { pertanyaan: "Gula darah periksa 1 bln - tempat", tipe: "text", wajib: false },
    { pertanyaan: "Gula darah periksa 1 bln - hasil", tipe: "text", wajib: false },
    { pertanyaan: "Skrining kesehatan jiwa - tanggal", tipe: "date", wajib: false },
    { pertanyaan: "Skrining kesehatan jiwa - tempat", tipe: "text", wajib: false },
    { pertanyaan: "Skrining kesehatan jiwa - petugas", tipe: "text", wajib: false },
    { pertanyaan: "materi", tipe: "text", wajib: false },
    { pertanyaan: "tanggal", tipe: "date", wajib: false },
    { pertanyaan: "Paraf (tulis nama sasaran)", tipe: "text", wajib: false },
    { pertanyaan: "Suhu tubuh >=37.5°C", tipe: "checkbox", wajib: false },
    { pertanyaan: "TD: ada obat hipertensi", tipe: "checkbox", wajib: false },
    { pertanyaan: "TD: minum obat 24 jam terakhir", tipe: "checkbox", wajib: false },
    { pertanyaan: "Gula darah: ada obat DM", tipe: "checkbox", wajib: false },
    { pertanyaan: "Gula darah: minum obat 24 jam", tipe: "checkbox", wajib: false },
    { pertanyaan: "Isi piringku dewasa", tipe: "checkbox", wajib: false },
  ],
  "lansia": [
    { pertanyaan: "Nama", tipe: "text", wajib: false },
    { pertanyaan: "Tempat lahir", tipe: "text", wajib: false },
    { pertanyaan: "Tanggal lahir", tipe: "date", wajib: false },
    { pertanyaan: "TD: terdiagnosa hipertensi (tanggal)", tipe: "date", wajib: false },
    { pertanyaan: "TD periksa 1 thn - tanggal", tipe: "date", wajib: false },
    { pertanyaan: "TD periksa 1 thn - tempat", tipe: "text", wajib: false },
    { pertanyaan: "TD periksa 1 thn - hasil", tipe: "text", wajib: false },
    { pertanyaan: "Gula darah: terdiagnosa DM (tanggal)", tipe: "date", wajib: false },
    { pertanyaan: "Gula darah periksa 1 thn - tanggal", tipe: "date", wajib: false },
    { pertanyaan: "Gula darah periksa 1 thn - tempat", tipe: "text", wajib: false },
    { pertanyaan: "Gula darah periksa 1 thn - hasil", tipe: "text", wajib: false },
    { pertanyaan: "Gula darah periksa 1 bln - tanggal", tipe: "date", wajib: false },
    { pertanyaan: "Gula darah periksa 1 bln - tempat", tipe: "text", wajib: false },
    { pertanyaan: "Gula darah periksa 1 bln - hasil", tipe: "text", wajib: false },
    { pertanyaan: "Skrining kesehatan jiwa - tanggal", tipe: "date", wajib: false },
    { pertanyaan: "Skrining kesehatan jiwa - tempat", tipe: "text", wajib: false },
    { pertanyaan: "Skrining kesehatan jiwa - petugas", tipe: "text", wajib: false },
    { pertanyaan: "Skrining geriatri AKS - tempat", tipe: "text", wajib: false },
    { pertanyaan: "Skrining geriatri AKS - tanggal", tipe: "date", wajib: false },
    { pertanyaan: "Skrining geriatri SKILAS - tempat", tipe: "text", wajib: false },
    { pertanyaan: "Skrining geriatri SKILAS - tanggal", tipe: "date", wajib: false },
    { pertanyaan: "materi", tipe: "text", wajib: false },
    { pertanyaan: "tanggal", tipe: "date", wajib: false },
    { pertanyaan: "Paraf (tulis nama sasaran)", tipe: "text", wajib: false },
    { pertanyaan: "Suhu tubuh >=37.5°C", tipe: "checkbox", wajib: false },
    { pertanyaan: "TD: ada obat", tipe: "checkbox", wajib: false },
    { pertanyaan: "TD: minum 24 jam", tipe: "checkbox", wajib: false },
    { pertanyaan: "Gula darah: ada obat", tipe: "checkbox", wajib: false },
    { pertanyaan: "Gula darah: minum 24 jam", tipe: "checkbox", wajib: false },
  ],
  "tbc": [
    { pertanyaan: "Nama", tipe: "text", wajib: false },
    { pertanyaan: "Tempat lahir", tipe: "text", wajib: false },
    { pertanyaan: "Tanggal lahir", tipe: "date", wajib: false },
    { pertanyaan: "TBC: terdiagnosa (tanggal)", tipe: "date", wajib: false },
    { pertanyaan: "TBC: tempat diagnosa", tipe: "text", wajib: false },
    { pertanyaan: "Pemeriksaan terakhir (tanggal)", tipe: "date", wajib: false },
    { pertanyaan: "TBC: tempat periksa", tipe: "text", wajib: false },
    { pertanyaan: "Nama PMO", tipe: "text", wajib: false },
    { pertanyaan: "materi", tipe: "text", wajib: false },
    { pertanyaan: "tanggal", tipe: "date", wajib: false },
    { pertanyaan: "Melaporkan ke nakes", tipe: "date", wajib: false },
    { pertanyaan: "Paraf (tulis nama sasaran)", tipe: "text", wajib: false },
    { pertanyaan: "Ada obat TBC", tipe: "checkbox", wajib: false },
    { pertanyaan: "Minum obat 24 jam", tipe: "checkbox", wajib: false },
    { pertanyaan: "Mengingatkan periksa", tipe: "checkbox", wajib: false },
    { pertanyaan: "Batuk terus menerus", tipe: "checkbox", wajib: false },
    { pertanyaan: "Demam ≥ 2 minggu", tipe: "checkbox", wajib: false },
    { pertanyaan: "BB turun 2 bulan berturut-turut", tipe: "checkbox", wajib: false },
  ],
};

const KEGIATAN_QUESTIONS: Record<string, SeedQuestion[]> = {
  "Identitas Kegiatan": [
    { pertanyaan: "Nama kegiatan", tipe: "text", wajib: true },
    { pertanyaan: "Penanggung jawab", tipe: "text", wajib: true },
    { pertanyaan: "Tanggal", tipe: "date", wajib: true },
    { pertanyaan: "Jam", tipe: "time", wajib: false },
    { pertanyaan: "Target peserta", tipe: "text", wajib: false },
    { pertanyaan: "Jenis kegiatan", tipe: "select", wajib: false },
  ],
  "Kelurahan & Lokasi": [
    { pertanyaan: "Kelurahan", tipe: "select", wajib: true },
    { pertanyaan: "Posyandu", tipe: "select", wajib: false },
    { pertanyaan: "Lokasi", tipe: "text", wajib: true },
    { pertanyaan: "Deskripsi kegiatan", tipe: "text", wajib: false },
  ],
  "Peserta & Kehadiran": [
    { pertanyaan: "Nama peserta", tipe: "text", wajib: true },
    { pertanyaan: "Kelurahan peserta", tipe: "select", wajib: false },
    { pertanyaan: "Hadir", tipe: "checkbox", wajib: false },
  ],
  Dokumentasi: [
    { pertanyaan: "Foto kegiatan", tipe: "text", wajib: false },
    { pertanyaan: "Keterangan foto", tipe: "text", wajib: false },
  ],
};

const FORM_DEFS = [
  {
    nama: KUNJUNGAN_RUMAH,
    deskripsi: "Catat kegiatan kunjungan rumah — GERMAS 2024.",
    sections: KUNJUNGAN_RUMAH_SECTIONS,
  },
  {
    nama: PEMBERDAYAAN,
    deskripsi: "Catat kegiatan pemberdayaan masyarakat, kehadiran peserta, dan dokumentasi foto.",
    sections: PEMBERDAYAAN_SECTIONS,
  },
];

function groupBySection(questionGroups: Record<string, SeedQuestion[]>[]): Map<string, SeedQuestion[]> {
  const grouped = new Map<string, SeedQuestion[]>();

  for (const group of questionGroups) {
    for (const [section, defs] of Object.entries(group)) {
      grouped.set(
        section,
        defs.filter((def) => def.tipe !== "select")
      );
    }
  }

  return grouped;
}

async function ensureFormId(nama: string, deskripsi: string): Promise<string> {
  const [existing] = await db.select({ id: forms.id }).from(forms).where(eq(forms.nama, nama)).limit(1);
  if (existing) return existing.id;

  const [inserted] = await db.insert(forms).values({ nama, deskripsi, aktif: true }).returning();
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

async function seedQuestions(
  formNama: string,
  sectionNama: string,
  sectionId: string,
  questionDefs: SeedQuestion[]
): Promise<void> {
  if (questionDefs.length === 0) return;

  const [existing] = await db
    .select({ id: questions.id })
    .from(questions)
    .where(eq(questions.sectionId, sectionId))
    .limit(1);

  if (existing) {
    console.log(`↷ questions ${formNama} / ${sectionNama} sudah ada, dilewati`);
    return;
  }

  const ordered = questionDefs.map((def, index) => ({ def, urutan: index + 1 }));
  const groups = ordered.filter((row) => row.def.tipe === "group");
  const leaves = ordered.filter((row) => row.def.tipe !== "group");

  await db.transaction(async (tx) => {
    const parentIds = new Map<string, string>();

    if (groups.length > 0) {
      const inserted = await tx
        .insert(questions)
        .values(
          groups.map((row) => ({
            sectionId,
            pertanyaan: row.def.pertanyaan,
            tipe: "group",
            wajib: false,
            urutan: row.urutan,
            aktif: true,
          }))
        )
        .returning();

      for (const row of inserted) parentIds.set(row.pertanyaan, row.id);
    }

    await tx.insert(questions).values(
      leaves.map((row) => {
        const parentId = row.def.parent === undefined ? null : parentIds.get(row.def.parent);
        if (row.def.parent !== undefined && parentId === undefined) {
          throw new Error(`Parent "${row.def.parent}" tidak ditemukan untuk ${row.def.pertanyaan}`);
        }
        return {
          sectionId,
          pertanyaan: row.def.pertanyaan,
          tipe: row.def.tipe,
          wajib: row.def.wajib,
          urutan: row.urutan,
          aktif: true,
          parentId: parentId ?? null,
        };
      })
    );
  });

  const total = groups.length + leaves.length;
  console.log(`+ ${total} questions ${formNama} / ${sectionNama} (${groups.length} grup)`);
}

async function seed() {
  console.log("🌱 Seeding forms...");

  const questionGroups = [KUNJUNGAN_RUMAH_QUESTIONS, KEGIATAN_QUESTIONS];
  const grouped = groupBySection(questionGroups);
  const seeded = [...grouped.values()].reduce((sum, list) => sum + list.length, 0);
  const declared = questionGroups.reduce(
    (sum, group) => sum + Object.values(group).reduce((n, list) => n + list.length, 0),
    0
  );
  const groups = seeded - [...grouped.values()].reduce(
    (sum, list) => sum + list.filter((def) => def.tipe === "group").length,
    0
  );

  for (const formDef of FORM_DEFS) {
    const formId = await ensureFormId(formDef.nama, formDef.deskripsi);
    const sectionIds = await ensureSections(formId, formDef.nama, formDef.sections);

    for (const section of formDef.sections) {
      const sectionId = sectionIds.get(section.nama);
      if (!sectionId) continue;
      await seedQuestions(formDef.nama, section.nama, sectionId, grouped.get(section.nama) ?? []);
    }
  }

  console.log(
    `ℹ️  ${declared} pertanyaan, ${declared - seeded} select dilewati, ${seeded} masuk database (${groups} grup)`
  );
  console.log("✅ Forms berhasil di-seed");
}

seed()
  .catch((error) => {
    console.error("❌ Seeder gagal:", error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
