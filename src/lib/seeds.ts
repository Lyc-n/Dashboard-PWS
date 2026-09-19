export type ChecklistItem = [string, string];

export const CHECKLIST_ITEMS: Partial<Record<string, ChecklistItem[]>> = {
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
    ["Rencana rujuk", "RS / Puskesmas PONED dan transportasi siap."],
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

export interface Priority {
  nama: string;
  desk: string;
  warna: string;
  on: boolean;
}

export interface Staff {
  nama: string;
  peran: string;
  kel: string;
  posy: string;
  hp: string;
  username: string;
  password: string;
  on: boolean;
}

export function staffUsername(nama: string): string {
  return nama
    .toLowerCase()
    .trim()
    .replace(/^dr\.\s*/, "")
    .replace(/\s+/g, ".")
    .replace(/[^a-z0-9.]/g, "");
}

export interface AdminItem {
  id: string;
  prio: string;
  judul: string;
  desk: string;
  on: boolean;
}

export function seedAdminItems(): AdminItem[] {
  const items: AdminItem[] = [];
  Object.entries(CHECKLIST_ITEMS).forEach(([prio, rows]) => {
    rows?.forEach((row, i) => {
      items.push({ id: `${prio}-${i}`, prio, judul: row[0], desk: row[1], on: true });
    });
  });
  return items;
}

export function seedAdminPrios(): Priority[] {
  return [
    { nama: "ODGJ", desk: "Orang dengan gangguan jiwa — pantau obat dan kontrol.", warna: "tag-odgj", on: true },
    { nama: "Bumil Risti", desk: "Ibu hamil risiko tinggi — ANC dan tanda bahaya.", warna: "tag-bumil", on: true },
    { nama: "Balita Risti", desk: "Balita berisiko gizi — timbang dan imunisasi.", warna: "tag-balita", on: true },
    { nama: "TB", desk: "Pasien tuberkulosis — kepatuhan OAT.", warna: "tag-tb", on: true },
    { nama: "Stunting", desk: "Balita stunting — tumbuh kembang dan gizi.", warna: "tag-stunt", on: true },
  ];
}

export function seedAdminStaff(): Staff[] {
  return [
    { nama: "dr. Ayu Rahmawati", peran: "Admin", kel: "Trajeng", posy: "—", hp: "0811-0000-01", username: "admin", password: "admin", on: true },
    { nama: "Siti Aminah", peran: "Kader", kel: "Trajeng", posy: "Melati 1", hp: "0812-0000-02", username: "siti.aminah", password: "admin123", on: true },
    { nama: "Siti Nurhaliza", peran: "Bidan", kel: "Ngemplakrejo", posy: "Kenanga", hp: "0812-0000-03", username: "siti.nurhaliza", password: "admin123", on: true },
    { nama: "Budi Santoso", peran: "Kader", kel: "Tambaan", posy: "Mawar 2", hp: "0812-0000-04", username: "budi.santoso", password: "admin123", on: true },
    { nama: "Dewi Lestari", peran: "Perawat", kel: "Mayangan", posy: "Flamboyan", hp: "0812-0000-05", username: "dewi.lestari", password: "admin123", on: true },
    { nama: "Agus Wijaya", peran: "Kader", kel: "Mayangan", posy: "Flamboyan", hp: "0812-0000-06", username: "agus.wijaya", password: "admin123", on: false },
  ];
}