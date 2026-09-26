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
export const SUMBER_PERIKSA = ["Kunjungan Rumah", "Datang ke posyandu"] as const;
export const HASIL_KUNJUNGAN_RUMAH = ["Selesai — sehat / terkendali", "Kontrol ulang", "Rujuk ke Puskesmas"] as const;
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
  adminItems: "pws-admin-items",
  adminPrios: "pws-admin-prios",
  adminStaff: "pws-admin-staff",
  kunjunganRumahTemplates: "pws-kunjungan-rumah-templates",
  rekap: "pws-rekap",
} as const;

export const SESSION_IDLE_MS = 60 * 60 * 1000; // idle 1 jam → geser terus tiap akses (sliding)
export const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // plafon absolut 12 jam (exp JWT + umur cookie)


export const SESSION_PROFILE = {
  username: "admin",
  name: "A. Jubaidi",
  role: "Admin",
} as const;
