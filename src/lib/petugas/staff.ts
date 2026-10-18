// Tipe data kelola + helper akun staff.
// Data awal (default) kini kosong — kader dibuat lewat UI /kelola, bukan dari
// hard-code di kode.
//
// `peran` tidak ada di sini: kolom `users.role` sudah dihapus dari skema dan
// peran tidak pernah membatasi apa pun (login pakai satu PIN global). Siapa pun
// yang punya sesi valid sudah setara, jadi tidak ada peran untuk disimpan.

export interface Staff {
  nama: string
  kel: string
  posy: string
  hp: string
  username: string
  on: boolean
}
