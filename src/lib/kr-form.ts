import { PRIOS } from "@/lib/constants";

export type SasaranKey =
  | "ibu-hamil"
  | "bersalin-nifas"
  | "bayi"
  | "balita"
  | "remaja"
  | "dewasa"
  | "lansia"
  | "tbc";

export const SASARAN_KEYS: SasaranKey[] = [
  "ibu-hamil",
  "bersalin-nifas",
  "bayi",
  "balita",
  "remaja",
  "dewasa",
  "lansia",
  "tbc",
];

export interface FormField {
  key: string;
  label: string;
  kind: "text" | "number" | "date" | "select";
  options?: string[];
}

export interface BoolField {
  key: string;
  label: string;
}

export interface SasaranDef {
  key: SasaranKey;
  label: string;
  identitas: FormField[];
  kolom: FormField[];
  bools: BoolField[];
  baha: BoolField[];
  prioritasDefault: string[];
}

export const HUB_KK = [
  "Kepala Keluarga",
  "Istri",
  "Anak",
  "Menantu",
  "Cucu",
  "Orang tua",
  "Mertua",
  "Famili lain",
  "Lainnya",
] as const;

export const STATUS_KAWIN = ["Kawin", "Belum kawin", "Cerai hidup", "Cerai mati"] as const;

export const PENDIDIKAN = [
  "Tidak sekolah",
  "SD",
  "SMP",
  "SMA",
  "D1/D3",
  "S1",
  "S2/S3",
] as const;

export const PEKERJAAN = [
  "Petani",
  "Buruh",
  "Nelayan",
  "PNS",
  "Pedagang",
  "Swasta",
  "IRT",
  "Pelajar/Mahasiswa",
  "Tidak bekerja",
  "Lainnya",
] as const;

export const JENIS_AIR = [
  "Sumur terlindung",
  "Ledeng/PDAM",
  "Sumur pompa",
  "Mata air",
  "Tidak terlindung",
  "Lainnya",
] as const;

export const PENOLONG_PERSALINAN = ["Bidan", "Dokter umum", "SpOG", "Lainnya"] as const;

export const TEMPAT_PERSALINAN = [
  "Posyandu prima",
  "Puskesmas",
  "RS",
  "Klinik",
  "PMB",
  "Lainnya",
] as const;

export const KB_OPSI = ["Pil", "Suntik", "Kondom", "Implan", "Lainnya"] as const;

export const MEROKOK = ["Aktif", "Pasif", "Tidak"] as const;

export const YA_OR_NOT = ["Ya", "Tidak"] as const;

export const HASIL_BB = ["Naik", "Tetap", "Turun"] as const;

export const WAKTU_IMUNISASI_BAYI = [
  { key: "hb0", label: "HB0 (0–24 jam)" },
  { key: "bcg", label: "BCG" },
  { key: "polio", label: "Polio" },
  { key: "dpt", label: "DPT-HB-Hib" },
  { key: "pcv", label: "PCV" },
  { key: "rv", label: "RV" },
  { key: "ipv", label: "IPV" },
] as const;

export const WAKTU_IMUNISASI_BALITA = [
  { key: "dptLanjut", label: "DPT lanjutan" },
  { key: "campakRubella", label: "Campak-Rubella" },
  { key: "ipvLanjut", label: "IPV" },
  { key: "je", label: "JE" },
  { key: "pcvLanjut", label: "PCV" },
] as const;

export const SASARAN_DEFS: SasaranDef[] = [
  {
    key: "ibu-hamil",
    label: "Ibu Hamil",
    identitas: [
      { key: "nama", label: "Nama", kind: "text" },
      { key: "umur", label: "Umur (thn)", kind: "number" },
      { key: "kehamilanKe", label: "Kehamilan anak ke-", kind: "number" },
      { key: "jarakKehamilan", label: "Jarak kehamilan sebelumnya", kind: "text" },
    ],
    kolom: [
      { key: "suhu", label: "Suhu tubuh (°C)", kind: "number" },
      { key: "periksaKehamilan", label: "Periksa kehamilan (K1–K6)", kind: "select", options: [...YA_OR_NOT] },
      { key: "isiPiringku", label: "Isi piringku ibu hamil", kind: "select", options: [...YA_OR_NOT] },
      { key: "lila", label: "LiLA (cm)", kind: "number" },
      { key: "pmtKek", label: "PMT bumil KEK", kind: "select", options: [...YA_OR_NOT] },
      { key: "kelasIbu", label: "Kelas ibu hamil", kind: "select", options: [...YA_OR_NOT] },
    ],
    bools: [
      { key: "bukuKia", label: "Ada buku KIA" },
      { key: "ttdAda", label: "TTD tersedia" },
      { key: "ttdMinum", label: "TTD diminum hari ini (24 jam)" },
      { key: "lilaRisiko", label: "LiLA < 23,5 cm (risiko KEK)" },
      { key: "skriningJiwa", label: "Skrining kesehatan jiwa" },
      { key: "edukasiNakes", label: "Edukasi / kunjungan nakes" },
      { key: "paraf", label: "Paraf" },
    ],
    baha: [
      { key: "demam", label: "Demam > 2 hari" },
      { key: "pusingKabur", label: "Pusing / sakit kepala berat / pandangan kabur + bengkak" },
      { key: "cemas", label: "Sulit tidur / cemas berlebih" },
      { key: "diare", label: "Diare berulang" },
      { key: "risikoTbc", label: "Risiko TBC" },
      { key: "gerakanJanin", label: "Tidak ada gerakan janin" },
      { key: "jantung", label: "Jantung berdebar / nyeri dada" },
      { key: "cairanJalanLahir", label: "Keluar cairan dari jalan lahir" },
      { key: "sakitKencing", label: "Sakit saat kencing" },
      { key: "nyeriPerut", label: "Nyeri perut hebat" },
      { key: "ingatPeriksa", label: "Mengingatkan periksa ke Pustu/Fasyankes" },
      { key: "laporNakes", label: "Melaporkan ke nakes" },
    ],
    prioritasDefault: ["Bumil Risti"],
  },
  {
    key: "bersalin-nifas",
    label: "Ibu Bersalin & Nifas",
    identitas: [
      { key: "nama", label: "Nama ibu", kind: "text" },
      { key: "umur", label: "Umur (thn)", kind: "number" },
      { key: "kelahiranKe", label: "Kelahiran anak ke-", kind: "number" },
    ],
    kolom: [
      { key: "tglPersalinan", label: "Tanggal persalinan", kind: "date" },
      { key: "pukul", label: "Pukul", kind: "text" },
      { key: "usiaKehamilan", label: "Usia kehamilan (bln)", kind: "number" },
      { key: "penolong", label: "Penolong persalinan", kind: "select", options: [...PENOLONG_PERSALINAN] },
      { key: "tempat", label: "Tempat persalinan", kind: "select", options: [...TEMPAT_PERSALINAN] },
      { key: "keadaanIbu", label: "Keadaan ibu saat melahirkan", kind: "select", options: ["Sehat", "Sakit", "Lainnya"] },
      { key: "kunjunganTgl", label: "Tanggal kunjungan", kind: "date" },
      { key: "suhu", label: "Suhu tubuh (°C)", kind: "number" },
      { key: "isiPiringku", label: "Isi piringku ibu menyusui", kind: "select", options: [...YA_OR_NOT] },
      { key: "kbPasca", label: "KB pasca persalinan", kind: "select", options: [...KB_OPSI] },
    ],
    bools: [
      { key: "bukuKia", label: "Ada buku KIA" },
      { key: "kf1", label: "KF1 (6–48 jam)" },
      { key: "kf2", label: "KF2 (3–7 hari)" },
      { key: "kf3", label: "KF3 (8–28 hari)" },
      { key: "kf4", label: "KF4 (29–42 hari)" },
      { key: "vitA", label: "Kapsul vitamin A" },
      { key: "menyusui", label: "Menyusui" },
      { key: "imd", label: "Riwayat IMD" },
      { key: "skriningJiwa", label: "Skrining kesehatan jiwa" },
      { key: "edukasi", label: "Edukasi" },
      { key: "paraf", label: "Paraf" },
    ],
    baha: [
      { key: "demam", label: "Demam" },
      { key: "sedihDepresi", label: "Perasaan sedih / mudah menangis / depresi" },
      { key: "gangguanBak", label: "Gangguan BAK" },
      { key: "sesak", label: "Napas pendek / sesak" },
      { key: "sakitKepala", label: "Sakit kepala" },
      { key: "perdarahan", label: "Perdarahan" },
      { key: "kelaminBengkak", label: "Area kelamin bengkak / nyeri / luka" },
      { key: "cairanJalanLahir", label: "Keluar cairan dari jalan lahir" },
      { key: "nyeriUluHati", label: "Nyeri ulu hati" },
      { key: "pandanganKabur", label: "Pandangan kabur" },
      { key: "payudaraMerah", label: "Payudara bengkak kemerahan" },
      { key: "darahNifasBerbau", label: "Darah nifas berbau" },
      { key: "keputihan", label: "Keputihan berlebihan" },
      { key: "jantungBerdebar", label: "Jantung berdebar" },
      { key: "ingatPeriksa", label: "Mengingatkan periksa" },
      { key: "laporNakes", label: "Melaporkan ke nakes" },
    ],
    prioritasDefault: [],
  },
  {
    key: "bayi",
    label: "Bayi (0–6 bln)",
    identitas: [
      { key: "nama", label: "Nama anak", kind: "text" },
      { key: "tempatLahir", label: "Tempat lahir", kind: "text" },
      { key: "tglLahir", label: "Tanggal lahir", kind: "date" },
      { key: "jk", label: "Jenis kelamin", kind: "select", options: ["L", "P"] },
    ],
    kolom: [
      { key: "suhu", label: "Suhu tubuh (°C)", kind: "number" },
      { key: "tglTimbang", label: "Tanggal terakhir ditimbang/diukur", kind: "date" },
      { key: "bb", label: "Hasil BB", kind: "select", options: [...HASIL_BB] },
      { key: "pb", label: "Hasil PB", kind: "select", options: [...HASIL_BB] },
      { key: "lk", label: "Hasil LK", kind: "select", options: [...HASIL_BB] },
    ],
    bools: [
      { key: "bukuKia", label: "Ada buku KIA" },
      { key: "asiEksklusif", label: "ASI eksklusif" },
      { key: "kn0", label: "Pelayanan neonatal 0–6 jam" },
      { key: "kn1", label: "KN1" },
      { key: "kn2", label: "KN2" },
      { key: "kn3", label: "KN3" },
      { key: "edukasi", label: "Edukasi" },
      { key: "paraf", label: "Paraf" },
    ],
    baha: [
      { key: "napas", label: "Napas" },
      { key: "aktivitas", label: "Aktivitas" },
      { key: "warnaKulit", label: "Warna kulit" },
      { key: "hisapan", label: "Hisapan bayi" },
      { key: "kejang", label: "Kejang" },
      { key: "suhuTubuh", label: "Suhu tubuh" },
      { key: "bab", label: "BAB" },
      { key: "kencing", label: "Jumlah/warna kencing" },
      { key: "taliPusat", label: "Tali pusat" },
      { key: "mata", label: "Mata" },
      { key: "kulit", label: "Kulit" },
      { key: "imunisasi", label: "Imunisasi" },
      { key: "ingatPeriksa", label: "Mengingatkan periksa" },
      { key: "laporNakes", label: "Melaporkan ke nakes" },
    ],
    prioritasDefault: ["Balita Risti"],
  },
  {
    key: "balita",
    label: "Bayi, Balita & Apras (6–71 bln)",
    identitas: [
      { key: "nama", label: "Nama anak", kind: "text" },
      { key: "tempatLahir", label: "Tempat lahir", kind: "text" },
      { key: "tglLahir", label: "Tanggal lahir", kind: "date" },
      { key: "jk", label: "Jenis kelamin", kind: "select", options: ["L", "P"] },
    ],
    kolom: [
      { key: "suhu", label: "Suhu tubuh (°C)", kind: "number" },
      { key: "tglTimbang", label: "Tanggal terakhir menimbang & mengukur", kind: "date" },
      { key: "bb", label: "Hasil BB", kind: "select", options: [...HASIL_BB] },
      { key: "pb", label: "Hasil PB / TB", kind: "select", options: [...HASIL_BB] },
      { key: "lk", label: "Hasil LK", kind: "select", options: [...HASIL_BB] },
      { key: "obatCacing", label: "Obat cacing", kind: "select", options: [...YA_OR_NOT] },
      { key: "vitA", label: "Kapsul vitamin A", kind: "select", options: ["Biru (6–11 bln)", "Merah (>11 bln)", "Tidak"] },
      { key: "mtPangan", label: "MT pangan lokal", kind: "select", options: [...YA_OR_NOT] },
    ],
    bools: [
      { key: "bukuKia", label: "Ada buku KIA" },
      { key: "makanPokok", label: "PMBA: makanan pokok" },
      { key: "proteinHewani", label: "PMBA: protein hewani/nabati" },
      { key: "lemak", label: "PMBA: lemak" },
      { key: "buahSayur", label: "PMBA: buah-sayur" },
      { key: "edukasi", label: "Edukasi" },
      { key: "paraf", label: "Paraf" },
    ],
    baha: [
      { key: "napas", label: "Napas" },
      { key: "batukGrok", label: "Batuk grok-grok" },
      { key: "demam", label: "Demam" },
      { key: "diare", label: "Diare" },
      { key: "kencing", label: "Jumlah/warna kencing" },
      { key: "warnaKulit", label: "Warna kulit" },
      { key: "aktivitas", label: "Aktivitas" },
      { key: "hisapan", label: "Hisapan" },
      { key: "makan", label: "Pemberian makanan" },
      { key: "ingatPeriksa", label: "Mengingatkan periksa" },
      { key: "laporNakes", label: "Melaporkan ke nakes" },
    ],
    prioritasDefault: ["Balita Risti"],
  },
  {
    key: "remaja",
    label: "Usia Sekolah/Remaja (6–18 thn)",
    identitas: [
      { key: "nama", label: "Nama", kind: "text" },
      { key: "tempatLahir", label: "Tempat lahir", kind: "text" },
      { key: "tglLahir", label: "Tanggal lahir", kind: "date" },
      { key: "jk", label: "Jenis kelamin", kind: "select", options: ["L", "P"] },
    ],
    kolom: [
      { key: "suhu", label: "Suhu tubuh (°C)", kind: "number" },
      { key: "tglTimbang", label: "Tanggal terakhir menimbang/mengukur", kind: "date" },
      { key: "bb", label: "Hasil BB", kind: "select", options: [...HASIL_BB] },
      { key: "pbTb", label: "Hasil PB/TB", kind: "select", options: [...HASIL_BB] },
      { key: "merokok", label: "Perilaku merokok", kind: "select", options: [...MEROKOK] },
      { key: "ptmTD", label: "PTM ≥15: tekanan darah hasil", kind: "text" },
      { key: "ptmGD", label: "PTM ≥15: gula darah hasil", kind: "text" },
    ],
    bools: [
      { key: "bukuKia", label: "Ada buku KIA" },
      { key: "isiPiringku", label: "Isi piringku sekolah/remaja" },
      { key: "ttdAda", label: "TTD remaja putri tersedia" },
      { key: "ttdMinum", label: "TTD diminum hari ini (1 minggu)" },
      { key: "anemia", label: "Periksa anemia setahun terakhir" },
      { key: "ptmTdCek", label: "PTM ≥15: periksa tekanan darah setahun terakhir" },
      { key: "ptmGdCek", label: "PTM ≥15: periksa gula darah setahun terakhir" },
      { key: "skriningJiwa", label: "Skrining kesehatan jiwa" },
      { key: "edukasi", label: "Edukasi" },
      { key: "paraf", label: "Paraf" },
    ],
    baha: [],
    prioritasDefault: [],
  },
  {
    key: "dewasa",
    label: "Usia Dewasa (18–59 thn)",
    identitas: [
      { key: "nama", label: "Nama", kind: "text" },
      { key: "tempatLahir", label: "Tempat lahir", kind: "text" },
      { key: "tglLahir", label: "Tanggal lahir", kind: "date" },
      { key: "jk", label: "Jenis kelamin", kind: "select", options: ["L", "P"] },
      { key: "riwayatKeluarga", label: "Riwayat penyakit keluarga", kind: "text" },
    ],
    kolom: [
      { key: "suhu", label: "Suhu tubuh (°C)", kind: "number" },
      { key: "tdDiagnosaTgl", label: "TD: terdiagnosa hipertensi (tanggal)", kind: "date" },
      { key: "tdAdaObat", label: "TD: ada obat hipertensi", kind: "select", options: [...YA_OR_NOT] },
      { key: "tdMinum24", label: "TD: minum obat 24 jam terakhir", kind: "select", options: [...YA_OR_NOT] },
      { key: "gdDiagnosaTgl", label: "Gula darah: terdiagnosa DM (tanggal)", kind: "date" },
      { key: "gdAdaObat", label: "Gula darah: ada obat DM", kind: "select", options: [...YA_OR_NOT] },
      { key: "gdMinum24", label: "Gula darah: minum obat 24 jam", kind: "select", options: [...YA_OR_NOT] },
      { key: "merokok", label: "Perilaku merokok", kind: "select", options: [...MEROKOK] },
      { key: "kb", label: "KB", kind: "select", options: [...KB_OPSI, "Tidak memakai"] },
    ],
    bools: [
      { key: "isiPiringku", label: "Isi piringku dewasa" },
      { key: "tdPeriksaSetahun", label: "TD: diperiksa setahun terakhir" },
      { key: "tdPeriksaSebulan", label: "TD: diperiksa sebulan terakhir" },
      { key: "gdPeriksaSetahun", label: "Gula darah: diperiksa setahun terakhir" },
      { key: "gdPeriksaSebulan", label: "Gula darah: diperiksa sebulan terakhir" },
      { key: "skriningJiwa", label: "Skrining kesehatan jiwa" },
      { key: "edukasi", label: "Edukasi" },
      { key: "paraf", label: "Paraf" },
    ],
    baha: [],
    prioritasDefault: [],
  },
  {
    key: "lansia",
    label: "Usia Lansia (>60 thn)",
    identitas: [
      { key: "nama", label: "Nama", kind: "text" },
      { key: "tempatLahir", label: "Tempat lahir", kind: "text" },
      { key: "tglLahir", label: "Tanggal lahir", kind: "date" },
      { key: "jk", label: "Jenis kelamin", kind: "select", options: ["L", "P"] },
    ],
    kolom: [
      { key: "suhu", label: "Suhu tubuh (°C)", kind: "number" },
      { key: "tdPeriksaTgl", label: "TD: periksa terakhir (tanggal)", kind: "date" },
      { key: "tdDiagnosa", label: "TD: terdiagnosa hipertensi", kind: "select", options: [...YA_OR_NOT] },
      { key: "tdAdaObat", label: "TD: ada obat", kind: "select", options: [...YA_OR_NOT] },
      { key: "tdMinum24", label: "TD: minum 24 jam", kind: "select", options: [...YA_OR_NOT] },
      { key: "gdPeriksaTgl", label: "Gula darah: periksa terakhir (tanggal)", kind: "date" },
      { key: "gdDiagnosa", label: "Gula darah: terdiagnosa DM", kind: "select", options: [...YA_OR_NOT] },
      { key: "gdAdaObat", label: "Gula darah: ada obat", kind: "select", options: [...YA_OR_NOT] },
      { key: "gdMinum24", label: "Gula darah: minum 24 jam", kind: "select", options: [...YA_OR_NOT] },
      { key: "merokok", label: "Perilaku merokok", kind: "select", options: [...MEROKOK] },
    ],
    bools: [
      { key: "tdPeriksaSebulan", label: "TD: periksa sebulan terakhir" },
      { key: "gdPeriksaSebulan", label: "Gula darah: periksa sebulan terakhir" },
      { key: "aks", label: "Skrining geriatri AKS" },
      { key: "skilas", label: "Skrining geriatri SKILAS" },
      { key: "skriningJiwa", label: "Skrining kesehatan jiwa" },
      { key: "edukasi", label: "Edukasi" },
      { key: "paraf", label: "Paraf" },
    ],
    baha: [],
    prioritasDefault: [],
  },
  {
    key: "tbc",
    label: "Pengendalian Penyakit Menular (TBC)",
    identitas: [
      { key: "nama", label: "Nama", kind: "text" },
      { key: "tempatLahir", label: "Tempat lahir", kind: "text" },
      { key: "tglLahir", label: "Tanggal lahir", kind: "date" },
      { key: "jk", label: "Jenis kelamin", kind: "select", options: ["L", "P"] },
    ],
    kolom: [
      { key: "tglDiagnosa", label: "TBC: terdiagnosa (tanggal)", kind: "date" },
      { key: "tempatDiagnosa", label: "TBC: tempat diagnosa", kind: "text" },
      { key: "periksaTgl", label: "Pemeriksaan terakhir (tanggal)", kind: "date" },
      { key: "namaPmo", label: "Nama PMO", kind: "text" },
      { key: "merokok", label: "Merokok", kind: "select", options: [...MEROKOK] },
    ],
    bools: [
      { key: "adaObat", label: "Ada obat TBC" },
      { key: "minum24", label: "Minum obat 24 jam" },
      { key: "edukasi", label: "Edukasi" },
      { key: "ingatPeriksa", label: "Mengingatkan periksa" },
      { key: "laporNakes", label: "Melaporkan ke nakes" },
      { key: "paraf", label: "Paraf" },
    ],
    baha: [
      { key: "batukTerus", label: "Batuk terus menerus" },
      { key: "demam", label: "Demam ≥ 2 minggu" },
      { key: "bbTurun", label: "BB turun 2 bulan berturut-turut" },
      { key: "kontakErat", label: "Kontak erat pasien TBC" },
    ],
    prioritasDefault: ["TB"],
  },
];

export const SASARAN_DEF_BY_KEY = Object.fromEntries(
  SASARAN_DEFS.map((d) => [d.key, d]),
) as Record<SasaranKey, SasaranDef>;

export function sasaranDef(key: SasaranKey): SasaranDef {
  return SASARAN_DEF_BY_KEY[key];
}

export function isPrioritas(p: string): p is (typeof PRIOS)[number] {
  return (PRIOS as readonly string[]).includes(p);
}