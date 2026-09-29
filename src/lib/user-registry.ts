/**
 * Bentuk data registry pengguna yang aman dipakai client.
 *
 * File ini tidak boleh mengimpor database, server function, atau modul
 * `*.server.ts`. Tujuannya satu: komponen seperti tab Staff di `/kelola` boleh
 * membaca tipe dan opsi peran tanpa menarik kode server ke bundle browser.
 * Kalau ada nilai baru yang dibutuhkan client, pindahkan ke sini; logika yang
 * menyentuh database tetap di `src/lib/user-registry.server.ts`.
 */
export type PeranPengguna = "admin" | "staff" | "kader";

/** Jabatan yang jadi pilihan di form Staff, dipetakan ke `role` + `jabatan`. */
const PETA_PERAN = {
  Admin: { role: "admin", jabatan: "Admin" },
  Bidan: { role: "staff", jabatan: "Bidan" },
  Perawat: { role: "staff", jabatan: "Perawat" },
  Kader: { role: "kader", jabatan: "Kader" },
} satisfies Record<string, { role: PeranPengguna; jabatan: string }>;

/**
 * Peran yang tersedia untuk dipilih di form Staff.
 *
 * `PERAN` di `src/lib/constants.ts` adalah daftar jabatan (Bidan/Perawat/Kader),
 * sedangkan `users.role` menyimpan hak akses. Keduanya dipetakan lewat PETA_PERAN.
 */
export const OPSI_PERAN = Object.keys(PETA_PERAN);

export function petakanPeran(peran: string): { role: PeranPengguna; jabatan: string } {
  return (
    (PETA_PERAN as Record<string, { role: PeranPengguna; jabatan: string }>)[peran] ??
    PETA_PERAN.Kader
  );
}

/** Bentuk baris `users` yang sudah digabung dengan nama fasilitas dan wilayah. */
export interface BarisPengguna {
  id: string;
  nama: string;
  role: PeranPengguna;
  jabatan: string | null;
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
