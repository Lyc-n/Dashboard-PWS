import { useCallback, useEffect, useState } from "react";
import {
  listFasKesOpsi,
  listUserRegistry,
  saveUserRegistry,
  setUserRegistryAktif,
} from "@/lib/utils.functions";
import type { BarisPengguna, OpsiFasilitas } from "@/lib/user-registry";

/** Bentuk baris yang dikirim ke server saat menyimpan. */
export interface DraftPengguna {
  nama: string;
  /** Jabatan tampilan: Admin / Bidan / Perawat / Kader. Dipetakan ke role+jabatan di server. */
  peran: string;
  /** `fasilitas_kesehatan.id`; wajib karena `users.fasKesId` NOT NULL. */
  fasKesId: number | null;
  phone: string;
  on: boolean;
}

/**
 * Registry pengguna untuk /kelola.
 *
 * Pengganti `useAdminMaster()`: data staff, kader, dan petugas pencatat semuanya
 * ada di satu tabel (`users`), bukan terpisah di `admin_staff`/`admin_staff_roles`.
 *
 * Kolom `kel` dan `posy` yang dulu berdiri sendiri sudah tidak ada di UI. Kedua
 * informasinya sekarang ikut dari `users.fasKesId` -> `fasilitas_kesehatan` ->
 * `wilayah_kerja`, jadi form cuma perlu satu dropdown fasilitas. Ini bukan
 * penyederhanaan tampilan saja: `users` memang tidak punya kolom kel/posy, jadi
 * menyimpan keduanya berarti menulis ke tabel lain yang tidak ada.
 */
export function useUserRegistry() {
  const [pengguna, setPengguna] = useState<BarisPengguna[]>([]);
  const [fasilitas, setFasilitas] = useState<OpsiFasilitas[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [daftar, fas] = await Promise.all([listUserRegistry(), listFasKesOpsi()]);
      setPengguna(daftar);
      setFasilitas(fas);
    } catch {
      setError("Gagal memuat daftar pengguna dari database.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  /**
   * `namaLama` = nama sebelum diedit, untuk menemukan baris yang mau diubah.
   * Server mencocokkan lewat nama karena form ini tidak menyimpan `users.id`.
   * `null` berarti akun baru.
   */
  const save = useCallback(
    async (namaLama: string | null, draft: DraftPengguna) => {
      await saveUserRegistry({ data: { namaLama, row: draft } });
      await refresh();
    },
    [refresh],
  );

  const setAktif = useCallback(
    async (nama: string, aktif: boolean) => {
      await setUserRegistryAktif({ data: { nama, aktif } });
      await refresh();
    },
    [refresh],
  );

  return { pengguna, fasilitas, loading, error, refresh, save, setAktif };
}
