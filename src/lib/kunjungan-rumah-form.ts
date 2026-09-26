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

export interface ConditionalRule {
  trigger: string;
  kind: "checks" | "values";
  when?: string;
  whenNonEmpty?: boolean;
  dependents: string[];
}

export interface SasaranDef {
  key: SasaranKey;
  label: string;
  identitas: FormField[];
  kolom: FormField[];
  bools: BoolField[];
  baha: BoolField[];
  prioritasDefault: string[];
  conditionals?: ConditionalRule[];
}

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
      { key: "k1Tempat", label: "tempat", kind: "text" },
      { key: "k1Tanggal", label: "tanggal", kind: "date" },
      { key: "k1Petugas", label: "petugas", kind: "text" },
      { key: "k2Tempat", label: "tempat", kind: "text" },
      { key: "k2Tanggal", label: "tanggal", kind: "date" },
      { key: "k2Petugas", label: "petugas", kind: "text" },
      { key: "k3Tempat", label: "tempat", kind: "text" },
      { key: "k3Tanggal", label: "tanggal", kind: "date" },
      { key: "k3Petugas", label: "petugas", kind: "text" },
      { key: "k4Tempat", label: "tempat", kind: "text" },
      { key: "k4Tanggal", label: "tanggal", kind: "date" },
      { key: "k4Petugas", label: "petugas", kind: "text" },
      { key: "k5Tempat", label: "tempat", kind: "text" },
      { key: "k5Tanggal", label: "tanggal", kind: "date" },
      { key: "k5Petugas", label: "petugas", kind: "text" },
      { key: "k6Tempat", label: "tempat", kind: "text" },
      { key: "k6Tanggal", label: "tanggal", kind: "date" },
      { key: "k6Petugas", label: "petugas", kind: "text" },
      { key: "kelasIbuTempat", label: "tempat", kind: "text" },
      { key: "kelasIbuTanggal", label: "tanggal", kind: "date" },
      { key: "kelasIbuPetugas", label: "petugas", kind: "text" },
      { key: "skriningJiwaTempat", label: "tempat", kind: "text" },
      { key: "skriningJiwaTanggal", label: "tanggal", kind: "date" },
      { key: "skriningJiwaPetugas", label: "petugas", kind: "text" },
      { key: "edukasiNakesMateri", label: "materi", kind: "text" },
      { key: "edukasiNakesTanggal", label: "tanggal", kind: "date" },
      { key: "paraf", label: "Paraf (tulis nama sasaran)", kind: "text" },
      { key: "laporNakesTanggal", label: "Melaporkan ke nakes", kind: "date" },
    ],
    bools: [
      { key: "suhu", label: "Suhu tubuh >=37.5°C" },
      { key: "isiPiringku", label: "Isi piringku sesuai" },
      { key: "pmtKek", label: "ada PMT untuk Bumil KEK" },
      { key: "bukuKia", label: "Ada buku KIA" },
      { key: "ttdAda", label: "TTD tersedia" },
      { key: "ttdMinum", label: "TTD diminum hari ini (24 jam)" },
      { key: "lilaRisiko", label: "LiLA < 23,5 cm (risiko KEK)" },
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
    ],
    conditionals: [],
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
      { key: "usiaKehamilan", label: "Usia kehamilan saat persalinan (minggu)", kind: "number" },
      { key: "penolong", label: "Penolong persalinan", kind: "select", options: [...PENOLONG_PERSALINAN] },
      { key: "tempat", label: "Tempat persalinan", kind: "select", options: [...TEMPAT_PERSALINAN] },
      { key: "namaTempat", label: "Nama tempat persalinan", kind: "text" },
      { key: "keadaanIbu", label: "Keadaan ibu saat melahirkan", kind: "select", options: ["Sehat", "Sakit", "Lainnya"] },
      { key: "jenisSakit", label: "Jenis sakit", kind: "select", options: ["Pendarahan", "Kejang", "Demam", "Lokhia berbau", "Lainnya"] },
      { key: "kunjunganTgl", label: "Tanggal kunjungan", kind: "date" },
      { key: "kbPasca", label: "KB pasca persalinan", kind: "select", options: [...KB_OPSI] },
      { key: "kf1Tempat", label: "tempat", kind: "text" },
      { key: "kf1Tanggal", label: "tanggal", kind: "date" },
      { key: "kf1Petugas", label: "petugas", kind: "text" },
      { key: "kf2Tempat", label: "tempat", kind: "text" },
      { key: "kf2Tanggal", label: "tanggal", kind: "date" },
      { key: "kf2Petugas", label: "petugas", kind: "text" },
      { key: "kf3Tempat", label: "tempat", kind: "text" },
      { key: "kf3Tanggal", label: "tanggal", kind: "date" },
      { key: "kf3Petugas", label: "petugas", kind: "text" },
      { key: "kf4Tempat", label: "tempat", kind: "text" },
      { key: "kf4Tanggal", label: "tanggal", kind: "date" },
      { key: "kf4Petugas", label: "petugas", kind: "text" },
      { key: "vitATanggal", label: "tanggal pemberian", kind: "date" },
      { key: "edukasiNakesMateri", label: "materi", kind: "text" },
      { key: "edukasiNakesTanggal", label: "tanggal", kind: "date" },
      { key: "laporNakesTanggal", label: "Melaporkan ke nakes", kind: "date" },
      { key: "paraf", label: "Paraf (tulis nama sasaran)", kind: "text" },
    ],
    bools: [
      { key: "suhu", label: "Suhu tubuh >=37.5°C" },
      { key: "isiPiringku", label: "Isi piringku ibu menyusui" },
      { key: "bukuKia", label: "Ada buku KIA" },
      { key: "menyusui", label: "Menyusui" },
      { key: "riwayatImd", label: "Riwayat IMD" },
      { key: "skriningJiwa", label: "Skrining kesehatan jiwa" },
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
    ],
    conditionals: [
      { trigger: "tempat", kind: "values", whenNonEmpty: true, dependents: ["namaTempat"] },
      { trigger: "keadaanIbu", kind: "values", when: "Sakit", dependents: ["jenisSakit"] },
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
      { key: "tglTimbang", label: "Tanggal terakhir ditimbang/diukur", kind: "date" },
      { key: "bb", label: "Hasil BB", kind: "select", options: [...HASIL_BB] },
      { key: "pb", label: "Hasil PB", kind: "select", options: [...HASIL_BB] },
      { key: "lk", label: "Hasil LK", kind: "select", options: [...HASIL_BB] },
      { key: "kn0Tanggal", label: "tanggal", kind: "date" },
      { key: "kn0Tempat", label: "tempat", kind: "text" },
      { key: "kn0Petugas", label: "bidan/dokter", kind: "text" },
      { key: "kn1Tanggal", label: "tanggal", kind: "date" },
      { key: "kn1Tempat", label: "tempat", kind: "text" },
      { key: "kn1Petugas", label: "bidan/dokter", kind: "text" },
      { key: "kn2Tanggal", label: "tanggal", kind: "date" },
      { key: "kn2Tempat", label: "tempat", kind: "text" },
      { key: "kn2Petugas", label: "bidan/dokter", kind: "text" },
      { key: "kn3Tanggal", label: "tanggal", kind: "date" },
      { key: "kn3Tempat", label: "tempat", kind: "text" },
      { key: "kn3Petugas", label: "bidan/dokter", kind: "text" },
      { key: "edukasiNakesMateri", label: "materi", kind: "text" },
      { key: "edukasiNakesTanggal", label: "tanggal", kind: "date" },
      { key: "laporNakesTanggal", label: "Melaporkan ke nakes", kind: "date" },
      { key: "paraf", label: "Paraf (tulis nama sasaran)", kind: "text" },
    ],
    bools: [
      { key: "suhu", label: "Suhu tubuh >=37.5°C" },
      { key: "bukuKia", label: "Ada buku KIA" },
      { key: "asiEksklusif", label: "ASI eksklusif" },
      { key: "imun0HepB", label: "Imunisasi 0 bln - Hepatitis B (0-24 jam)" },
      { key: "imun0BCG", label: "Imunisasi 0 bln - BCG" },
      { key: "imun0Polio1", label: "Imunisasi 0 bln - Polio Tetes 1" },
      { key: "imun1BCG", label: "Imunisasi 1 bln - BCG" },
      { key: "imun1Polio1", label: "Imunisasi 1 bln - Polio Tetes 1" },
      { key: "imun2DPTHBHib1", label: "Imunisasi 2 bln - DPT-HB-Hib 1" },
      { key: "imun2Polio2", label: "Imunisasi 2 bln - Polio Tetes 2" },
      { key: "imun2PCV1", label: "Imunisasi 2 bln - PCV 1" },
      { key: "imun2RV1", label: "Imunisasi 2 bln - RV 1" },
      { key: "imun3DPTHBHib2", label: "Imunisasi 3 bln - DPT-HB-Hib 2" },
      { key: "imun3Polio3", label: "Imunisasi 3 bln - Polio Tetes 3" },
      { key: "imun3PCV2", label: "Imunisasi 3 bln - PCV 2" },
      { key: "imun3RV2", label: "Imunisasi 3 bln - RV 2" },
      { key: "imun4DPTHBHib3", label: "Imunisasi 4 bln - DPT-HB-Hib 3" },
      { key: "imun4Polio4", label: "Imunisasi 4 bln - Polio Tetes 4" },
      { key: "imun4IPV1", label: "Imunisasi 4 bln - Polio Suntik 1 (IPV 1)" },
      { key: "imun4RV3", label: "Imunisasi 4 bln - RV 3" },
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
    ],
    conditionals: [],
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
      { key: "tglTimbang", label: "Tanggal terakhir menimbang & mengukur", kind: "date" },
      { key: "bb", label: "Hasil BB", kind: "select", options: [...HASIL_BB] },
      { key: "pb", label: "Hasil PB / TB", kind: "select", options: [...HASIL_BB] },
      { key: "lk", label: "Hasil LK", kind: "select", options: [...HASIL_BB] },
      { key: "obatCacingTanggal", label: "Obat cacing - tanggal minum", kind: "date" },
      { key: "vitA6_11Bulan", label: "Vitamin A 6-11 bln - bulan pemberian", kind: "select", options: ["Februari", "Agustus"] },
      { key: "vitA12Bulan", label: "Vitamin A >11 bln - bulan pemberian", kind: "select", options: ["Februari", "Agustus"] },
      { key: "mtKepatuhan", label: "MT pangan lokal - kepatuhan konsumsi", kind: "select", options: ["Patuh", "Tidak patuh"] },
      { key: "edukasiNakesMateri", label: "materi", kind: "text" },
      { key: "edukasiNakesTanggal", label: "tanggal", kind: "date" },
      { key: "laporNakesTanggal", label: "Melaporkan ke nakes", kind: "date" },
      { key: "paraf", label: "Paraf (tulis nama sasaran)", kind: "text" },
    ],
    bools: [
      { key: "suhu", label: "Suhu tubuh >=37.5°C" },
      { key: "imun0HepB", label: "Imunisasi 0 bln - Hepatitis B (0-24 jam)" },
      { key: "imun0BCG", label: "Imunisasi 0 bln - BCG" },
      { key: "imun0Polio1", label: "Imunisasi 0 bln - Polio Tetes 1" },
      { key: "imun1BCG", label: "Imunisasi 1 bln - BCG" },
      { key: "imun1Polio1", label: "Imunisasi 1 bln - Polio Tetes 1" },
      { key: "imun2DPTHBHib1", label: "Imunisasi 2 bln - DPT-HB-Hib 1" },
      { key: "imun2Polio2", label: "Imunisasi 2 bln - Polio Tetes 2" },
      { key: "imun2PCV1", label: "Imunisasi 2 bln - PCV 1" },
      { key: "imun2RV1", label: "Imunisasi 2 bln - RV 1" },
      { key: "imun3DPTHBHib2", label: "Imunisasi 3 bln - DPT-HB-Hib 2" },
      { key: "imun3Polio3", label: "Imunisasi 3 bln - Polio Tetes 3" },
      { key: "imun3PCV2", label: "Imunisasi 3 bln - PCV 2" },
      { key: "imun3RV2", label: "Imunisasi 3 bln - RV 2" },
      { key: "imun4DPTHBHib3", label: "Imunisasi 4 bln - DPT-HB-Hib 3" },
      { key: "imun4Polio4", label: "Imunisasi 4 bln - Polio Tetes 4" },
      { key: "imun4IPV1", label: "Imunisasi 4 bln - Polio Suntik 1 (IPV 1)" },
      { key: "imun4RV3", label: "Imunisasi 4 bln - RV 3" },
      { key: "imun9CampakRubella", label: "Imunisasi 9 bln - Campak Rubella" },
      { key: "imun9IPV2", label: "Imunisasi 9 bln - Polio Suntik (IPV 2)" },
      { key: "imun10JE", label: "Imunisasi 10 bln - Japanese Encephalitis (JE)" },
      { key: "imun12PCV3", label: "Imunisasi 12 bln - PCV 3" },
      { key: "imun18DPTHBHibLanjut", label: "Imunisasi 18 bln - DPT-HB-Hib lanjutan" },
      { key: "imun18CampakRubellaLanjut", label: "Imunisasi 18 bln - Campak Rubella lanjutan" },
      { key: "bukuKia", label: "Ada buku KIA" },
      { key: "makanPokok", label: "PMBA: makanan pokok" },
      { key: "proteinHewani", label: "PMBA: protein hewani" },
      { key: "proteinNabati", label: "PMBA: protein nabati" },
      { key: "lemak", label: "PMBA: lemak" },
      { key: "buahSayur", label: "PMBA: buah-sayur" },
    ],
    baha: [
      { key: "napas", label: "Napas" },
      { key: "batukGrok", label: "Batuk grok-grok" },
      { key: "diare", label: "Diare" },
      { key: "kencing", label: "Jumlah/warna kencing" },
      { key: "warnaKulit", label: "Warna kulit" },
      { key: "aktivitas", label: "Aktivitas" },
      { key: "hisapan", label: "Hisapan" },
      { key: "makan", label: "Pemberian makanan" },
      { key: "ingatPeriksa", label: "Mengingatkan periksa" },
    ],
    conditionals: [],
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
      { key: "tglTimbang", label: "Tanggal terakhir menimbang/mengukur", kind: "date" },
      { key: "bb", label: "Hasil BB", kind: "select", options: [...HASIL_BB] },
      { key: "pbTb", label: "Hasil PB/TB", kind: "select", options: [...HASIL_BB] },
      { key: "merokok", label: "Perilaku merokok", kind: "select", options: [...MEROKOK] },
      { key: "ptmTD", label: "PTM ≥15: tekanan darah hasil", kind: "text" },
      { key: "ptmGD", label: "PTM ≥15: gula darah hasil", kind: "text" },
      { key: "anemiaTanggal", label: "Anemia (skrining Hb) 1 thn terakhir - tanggal", kind: "date" },
      { key: "skriningJiwaTanggal", label: "tanggal", kind: "date" },
      { key: "skriningJiwaTempat", label: "tempat", kind: "text" },
      { key: "skriningJiwaPetugas", label: "petugas", kind: "text" },
      { key: "edukasiNakesMateri", label: "materi", kind: "text" },
      { key: "edukasiNakesTanggal", label: "tanggal", kind: "date" },
      { key: "paraf", label: "Paraf (tulis nama sasaran)", kind: "text" },
    ],
    bools: [
      { key: "suhu", label: "Suhu tubuh >=37.5°C" },
      { key: "bukuKia", label: "Ada buku KIA" },
      { key: "isiPiringku", label: "Isi piringku sekolah/remaja" },
      { key: "ttdAda", label: "TTD remaja putri tersedia" },
      { key: "ttdMinum", label: "TTD diminum hari ini (1 minggu)" },
      { key: "ptmTdCek", label: "PTM ≥15: periksa tekanan darah setahun terakhir" },
      { key: "ptmGdCek", label: "PTM ≥15: periksa gula darah setahun terakhir" },
    ],
    conditionals: [],
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
      { key: "riwayatKeluarga", label: "Riwayat penyakit keluarga", kind: "select", options: ["Hipertensi", "Diabetes Melitus", "Stroke", "Jantung", "Asma", "Kanker", "Kolesterol Tinggi"] },
    ],
    kolom: [
      { key: "tdDiagnosaTgl", label: "TD: terdiagnosa hipertensi (tanggal)", kind: "date" },
      { key: "tdPeriksaSetahunTanggal", label: "TD periksa 1 thn - tanggal", kind: "date" },
      { key: "tdPeriksaSetahunTempat", label: "TD periksa 1 thn - tempat", kind: "text" },
      { key: "tdPeriksaSetahunHasil", label: "TD periksa 1 thn - hasil", kind: "text" },
      { key: "gdDiagnosaTgl", label: "Gula darah: terdiagnosa DM (tanggal)", kind: "date" },
      { key: "gdPeriksaSetahunTanggal", label: "Gula darah periksa 1 thn - tanggal", kind: "date" },
      { key: "gdPeriksaSetahunTempat", label: "Gula darah periksa 1 thn - tempat", kind: "text" },
      { key: "gdPeriksaSetahunHasil", label: "Gula darah periksa 1 thn - hasil", kind: "text" },
      { key: "gdPeriksaSebulanTanggal", label: "Gula darah periksa 1 bln - tanggal", kind: "date" },
      { key: "gdPeriksaSebulanTempat", label: "Gula darah periksa 1 bln - tempat", kind: "text" },
      { key: "gdPeriksaSebulanHasil", label: "Gula darah periksa 1 bln - hasil", kind: "text" },
      { key: "skriningJiwaTanggal", label: "Skrining kesehatan jiwa - tanggal", kind: "date" },
      { key: "skriningJiwaTempat", label: "Skrining kesehatan jiwa - tempat", kind: "text" },
      { key: "skriningJiwaPetugas", label: "Skrining kesehatan jiwa - petugas", kind: "text" },
      { key: "merokok", label: "Perilaku merokok", kind: "select", options: [...MEROKOK] },
      { key: "kb", label: "KB", kind: "select", options: [...KB_OPSI, "Tidak memakai"] },
      { key: "edukasiNakesMateri", label: "materi", kind: "text" },
      { key: "edukasiNakesTanggal", label: "tanggal", kind: "date" },
      { key: "paraf", label: "Paraf (tulis nama sasaran)", kind: "text" },
    ],
    bools: [
      { key: "suhu", label: "Suhu tubuh >=37.5°C" },
      { key: "tdAdaObat", label: "TD: ada obat hipertensi" },
      { key: "tdMinum24", label: "TD: minum obat 24 jam terakhir" },
      { key: "gdAdaObat", label: "Gula darah: ada obat DM" },
      { key: "gdMinum24", label: "Gula darah: minum obat 24 jam" },
      { key: "isiPiringku", label: "Isi piringku dewasa" },
    ],
    conditionals: [],
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
      { key: "tdDiagnosaTgl", label: "TD: terdiagnosa hipertensi (tanggal)", kind: "date" },
      { key: "tdPeriksaSetahunTanggal", label: "TD periksa 1 thn - tanggal", kind: "date" },
      { key: "tdPeriksaSetahunTempat", label: "TD periksa 1 thn - tempat", kind: "text" },
      { key: "tdPeriksaSetahunHasil", label: "TD periksa 1 thn - hasil", kind: "text" },
      { key: "gdDiagnosaTgl", label: "Gula darah: terdiagnosa DM (tanggal)", kind: "date" },
      { key: "gdPeriksaSetahunTanggal", label: "Gula darah periksa 1 thn - tanggal", kind: "date" },
      { key: "gdPeriksaSetahunTempat", label: "Gula darah periksa 1 thn - tempat", kind: "text" },
      { key: "gdPeriksaSetahunHasil", label: "Gula darah periksa 1 thn - hasil", kind: "text" },
      { key: "gdPeriksaSebulanTanggal", label: "Gula darah periksa 1 bln - tanggal", kind: "date" },
      { key: "gdPeriksaSebulanTempat", label: "Gula darah periksa 1 bln - tempat", kind: "text" },
      { key: "gdPeriksaSebulanHasil", label: "Gula darah periksa 1 bln - hasil", kind: "text" },
      { key: "skriningJiwaTanggal", label: "Skrining kesehatan jiwa - tanggal", kind: "date" },
      { key: "skriningJiwaTempat", label: "Skrining kesehatan jiwa - tempat", kind: "text" },
      { key: "skriningJiwaPetugas", label: "Skrining kesehatan jiwa - petugas", kind: "text" },
      { key: "aksTempat", label: "Skrining geriatri AKS - tempat", kind: "text" },
      { key: "aksTanggal", label: "Skrining geriatri AKS - tanggal", kind: "date" },
      { key: "skilasTempat", label: "Skrining geriatri SKILAS - tempat", kind: "text" },
      { key: "skilasTanggal", label: "Skrining geriatri SKILAS - tanggal", kind: "date" },
      { key: "merokok", label: "Perilaku merokok", kind: "select", options: [...MEROKOK] },
      { key: "edukasiNakesMateri", label: "materi", kind: "text" },
      { key: "edukasiNakesTanggal", label: "tanggal", kind: "date" },
      { key: "paraf", label: "Paraf (tulis nama sasaran)", kind: "text" },
    ],
    bools: [
      { key: "suhu", label: "Suhu tubuh >=37.5°C" },
      { key: "tdAdaObat", label: "TD: ada obat" },
      { key: "tdMinum24", label: "TD: minum 24 jam" },
      { key: "gdAdaObat", label: "Gula darah: ada obat" },
      { key: "gdMinum24", label: "Gula darah: minum 24 jam" },
    ],
    conditionals: [],
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
      { key: "tempatPeriksa", label: "TBC: tempat periksa", kind: "text" },
      { key: "namaPmo", label: "Nama PMO", kind: "text" },
      { key: "merokok", label: "Merokok", kind: "select", options: [...MEROKOK] },
      { key: "kontakEratJenis", label: "Kontak erat - jenis", kind: "select", options: ["Keluarga", "Tetangga", "ART"] },
      { key: "edukasiNakesMateri", label: "materi", kind: "text" },
      { key: "edukasiNakesTanggal", label: "tanggal", kind: "date" },
      { key: "laporNakesTanggal", label: "Melaporkan ke nakes", kind: "date" },
      { key: "paraf", label: "Paraf (tulis nama sasaran)", kind: "text" },
    ],
    bools: [
      { key: "adaObat", label: "Ada obat TBC" },
      { key: "minum24", label: "Minum obat 24 jam" },
      { key: "ingatPeriksa", label: "Mengingatkan periksa" },
    ],
    baha: [
      { key: "batukTerus", label: "Batuk terus menerus" },
      { key: "demam", label: "Demam ≥ 2 minggu" },
      { key: "bbTurun", label: "BB turun 2 bulan berturut-turut" },
    ],
    conditionals: [],
    prioritasDefault: ["TB"],
  },
];

export const SASARAN_DEF_BY_KEY = Object.fromEntries(
  SASARAN_DEFS.map((d) => [d.key, d]),
) as Record<SasaranKey, SasaranDef>;

export function sasaranDef(key: SasaranKey): SasaranDef {
  return SASARAN_DEF_BY_KEY[key];
}