import { useCallback } from 'react'
import { useAsyncData } from '@/hooks/use-async-data'
import {
  listFasKesOpsi,
  listUserRegistry,
  saveUserRegistry,
  setUserRegistryAktif,
} from '@/lib/utils.functions'
import type { BarisPengguna, OpsiFasilitas } from '@/lib/user-registry'

/** Bentuk baris yang dikirim ke server saat menyimpan. */
export interface DraftPengguna {
  nama: string
  /** Peran: Admin / Kader. Dipetakan ke `users.role` di server. */
  peran: string
  /** `fasilitas_kesehatan.id`; wajib karena `users.fasKesId` NOT NULL. */
  fasKesId: number | null
  phone: string
  on: boolean
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
  const { data, loading, error, reload } = useAsyncData(
    async () => {
      const [daftar, fas] = await Promise.all([
        listUserRegistry(),
        listFasKesOpsi(),
      ])
      return { pengguna: daftar, fasilitas: fas }
    },
    [],
    { pengguna: [] as BarisPengguna[], fasilitas: [] as OpsiFasilitas[] },
    {
      cancel: false,
      mapError: () => 'Gagal memuat daftar pengguna dari database.',
    },
  )

  const { pengguna, fasilitas } = data

  /**
   * `namaLama` = nama sebelum diedit, untuk menemukan baris yang mau diubah.
   * Server mencocokkan lewat nama karena form ini tidak menyimpan `users.id`.
   * `null` berarti akun baru.
   */
  const save = useCallback(
    async (namaLama: string | null, draft: DraftPengguna) => {
      await saveUserRegistry({ data: { namaLama, row: draft } })
      await reload()
    },
    [reload],
  )

  const setAktif = useCallback(
    async (nama: string, aktif: boolean) => {
      await setUserRegistryAktif({ data: { nama, aktif } })
      await reload()
    },
    [reload],
  )

  return {
    pengguna,
    fasilitas,
    loading,
    error,
    refresh: reload,
    save,
    setAktif,
  }
}
