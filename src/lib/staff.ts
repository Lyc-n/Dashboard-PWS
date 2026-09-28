// Tipe data kelola + helper akun staff.
// Data awal (default) kini kosong — staff/prioritas dibuat lewat UI /kelola,
// bukan dari hard-code di kode.

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
  on: boolean;
}

export interface AdminItem {
  id: string;
  prio: string;
  judul: string;
  desk: string;
  on: boolean;
}

function staffUsername(nama: string): string {
  return nama
    .toLowerCase()
    .trim()
    .replace(/^dr\.\s*/, '')
    .replace(/\s+/g, '.')
    .replace(/[^a-z0-9.]/g, '');
}

// Saran username untuk form StaffSection. Login aplikasi memakai PIN tunggal
// dari env, jadi tidak ada password default di berkas ini.
export function staffUsernameSuggestion(nama: string): string {
  return staffUsername(nama);
}
