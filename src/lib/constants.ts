export const KELS = ["Trajeng", "Ngemplakrejo", "Tambaan", "Mayangan"] as const;

export const PRIOS = ["ODGJ", "Bumil Risti", "Balita Risti", "TB", "Stunting"] as const;

export const POSY = ["Melati 1", "Mawar 2", "Kenanga", "Flamboyan"] as const;

export const PERAN = ["Admin", "Bidan", "Perawat", "Kader"] as const;

export const JENIS_KEGIATAN = [
  "Penyuluhan",
  "Posyandu",
  "Kelas ibu",
  "Senam",
  "Gotong royong",
  "Pelatihan kader",
] as const;

export const SUMBER_PERIKSA = ["Kunjungan rumah", "Datang ke posyandu"] as const;

export const HASIL_KUNJUNGAN = ["Selesai — sehat / terkendali", "Kontrol ulang", "Rujuk ke Puskesmas"] as const;

export const STATUS_DEFAULT = ["Selesai", "Perlu tindak lanjut", "Terjadwal"] as const;

export const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
] as const;

export const APP_BRAND = {
  name: "DINAS KESEHATAN",
  region: "KOTA PASURUAN",
} as const;

export const STORAGE_KEYS = {
  checklist: "pws-checklist",
  kegiatan: "pws-kegiatan",
  adminItems: "pws-admin-items",
  adminPrios: "pws-admin-prios",
  adminStaff: "pws-admin-staff",
  krTemplates: "pws-kr-templates",
  auth: "pws-auth",
} as const;
