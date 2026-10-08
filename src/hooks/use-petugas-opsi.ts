import { useAsyncData } from '@/hooks/use-async-data'
import { listPetugasAktif } from '@/lib/utils.functions'
import type { OpsiPetugas } from '@/lib/user-registry'

/**
 * Daftar petugas pencatat untuk dropdown di form kegiatan.
 *
 * Hanya akun `users` yang aktif dan berperan `staff` atau `kader`. Akun `admin`
 * tidak ikut: admin mengelola form, bukan mencatat, dan memasukkannya ke daftar
 * akan membuat rekap bercampur dengan petugas lapangan.
 *
 * `fasKesId` sengaja tidak dikirim. Sesi login masih memakai satu PIN global
 * dengan role hard-coded, jadi tidak ada `users.id` milik pengguna yang sedang
 * masuk untuk membatasi daftar ke fasilitasnya sendiri. Setelah login
 * per-akun selesai, baris ini cukup diisi `users.fasKesId` milik akun aktif dan
 * dropdown ikut tersaring tanpa perubahan lain.
 */
export function usePetugasOpsi() {
  const {
    data: petugasOpsi,
    loading,
    error,
    reload,
  } = useAsyncData(
    () => listPetugasAktif({ data: { fasKesId: null } }),
    [],
    [] as OpsiPetugas[],
    {
      cancel: false,
      mapError: () => 'Gagal memuat daftar petugas.',
    },
  )

  return { petugasOpsi, loading, error, refresh: reload }
}
