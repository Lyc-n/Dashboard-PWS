import { useAsyncData } from '@/hooks/use-async-data'
import { listPetugasAktif } from '@/lib/utils.functions'
import type { OpsiPetugas } from '@/lib/user-registry'

/**
 * Daftar petugas pencatat untuk dropdown di form kegiatan.
 *
 * Hanya kader di `users` yang aktif. Dulu ada penyaringan peran dan akun
 * `admin` dikeluarkan dari daftar; keduanya tidak ada lagi karena tabel `users`
 * sekarang isinya murni kader — kolom `role` dihapus dari skema.
 *
 * `fasKesId` sengaja tidak dikirim. Sesi login masih memakai satu PIN global,
 * jadi tidak ada `users.id` milik pengguna yang sedang masuk untuk membatasi
 * daftar ke fasilitasnya sendiri. Setelah login per-akun selesai, baris ini
 * cukup diisi `users.fasKesId` milik akun aktif dan dropdown ikut tersaring tanpa
 * perubahan lain.
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
