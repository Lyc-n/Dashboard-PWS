/**
 * Bentuk data registry pengguna yang aman dipakai client.
 *
 * File ini tidak boleh mengimpor database, server function, atau modul
 * `*.server.ts`. Tujuannya satu: komponen seperti tab Staff di `/kelola` boleh
 * membaca tipe dan opsi peran tanpa menarik kode server ke bundle browser.
 * Kalau ada nilai baru yang dibutuhkan client, pindahkan ke sini; logika yang
 * menyentuh database tetap di `src/lib/user-registry.server.ts`.
 */
export type PeranPengguna = "admin" | "kader";

/** Peran yang jadi pilihan di form staff, dipetakan langsung ke `users.role`. */
const PETA_PERAN = {
  Admin: { role: "admin" },
  Kader: { role: "kader" },
} satisfies Record<string, { role: PeranPengguna }>;

/** Peran yang tersedia untuk dipilih di form staff. */
export const OPSI_PERAN = Object.keys(PETA_PERAN);

export function petakanPeran(peran: string): { role: PeranPengguna } {
  return (
    (PETA_PERAN as Record<string, { role: PeranPengguna }>)[peran] ?? PETA_PERAN.Kader
  );
}

/** Bentuk baris `users` yang sudah digabung dengan nama fasilitas dan wilayah. */
export interface BarisPengguna {
  id: string;
  nama: string;
  role: PeranPengguna;
  phone: string | null;
  aktif: boolean;
  fasKesId: number;
  /** Nama fasilitas, mis. "Melati 1". */
  fasKes: string;
  /** `wilayah_kerja.kelurahan`, mis. "Trajeng". */
  kel: string;
  kecamatan: string;
}

/** Fasilitas yang bisa dipilih di form Staff, urut nama. */
export interface OpsiFasilitas {
  id: number;
  nama: string;
  kel: string;
  kecamatan: string;
  tipe: string;
}

/** Opsi untuk dropdown "petugas" di form pencatatan. */
export interface OpsiPetugas {
  id: string;
  nama: string;
  fasKes: string;
}
