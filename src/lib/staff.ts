// Tipe data kelola + helper akun staff.
// Data awal (default) kini kosong — staff/prioritas dibuat lewat UI /kelola,
// bukan dari hard-code di kode.

export interface Staff {
  nama: string
  peran: string
  kel: string
  posy: string
  hp: string
  username: string
  on: boolean
}
