/**
 * Bentuk data registry pengguna yang aman dipakai client.
 *
 * File ini tidak boleh mengimpor database, server function, atau modul
 * `*.server.ts`. Tujuannya satu: komponen seperti tab Kader di `/kelola` boleh
 * membaca tipe data tanpa menarik kode server ke bundle browser. Kalau ada nilai
 * baru yang dibutuhkan client, pindahkan ke sini; logika yang menyentuh
 * database tetap di `src/lib/user-registry.server.ts`.
 *
 * Tidak ada `PeranPengguna` di sini. Kolom `users.role` sudah dihapus dari
 * skema: aplikasi memakai satu PIN global, jadi peran tidak pernah membatasi
 * akses apa pun. Yang tersisa dari registry hanyalah data kader.
 */

/** Bentuk baris `users` yang sudah digabung dengan nama fasilitas dan wilayah. */
export interface BarisPengguna {
  id: string
  nama: string
  phone: string | null
  aktif: boolean
  fasKesId: number
  /** Nama fasilitas, mis. "Melati 1". */
  fasKes: string
  /** `wilayah_kerja.kelurahan`, mis. "Trajeng". */
  kel: string
  kecamatan: string
}

/** Fasilitas yang bisa dipilih di form kader, urut nama. */
export interface OpsiFasilitas {
  id: number
  nama: string
  kel: string
  kecamatan: string
  tipe: string
}

/** Opsi untuk dropdown "petugas" di form pencatatan. */
export interface OpsiPetugas {
  id: string
  nama: string
  fasKes: string
}
