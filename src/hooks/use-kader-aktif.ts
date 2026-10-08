import { useAsyncData } from '@/hooks/use-async-data'
import { listKaderUntukRekap } from '@/lib/utils.functions'
import type { Staff } from '@/lib/staff'

/**
 * Daftar kader aktif untuk filter di Rekap Kunjungan Rumah.
 *
 * Sumbernya `users` dengan `role = 'kader'`, bukan `admin_staff` yang sudah
 * dihapus. Bentuk hasilnya tetap `Staff` supaya `computeRekap()` dan
 * `kaderNameOf()` tidak perlu diubah keduanya.
 *
 * `fasKesId` sengaja tidak diisi dari UI sekarang: sesi login masih memakai satu
 * PIN global dan `SESSION_PROFILE` hard-coded, jadi tidak ada `users.id` yang
 * diketahui untuk tahu fasilitas mana yang miliknya sendiri.
 * Setelah login per-akun selesai, baris ini bisa diisi dari `users.fasKesId`
 * milik akun yang sedang login, dan daftar kader otomatis tersaring ke satu
 * fasilitas.
 */
export function useKaderAktif() {
  const {
    data: kader,
    loading,
    error,
    reload,
  } = useAsyncData(
    () => listKaderUntukRekap({ data: { fasKesId: null } }),
    [],
    [] as Staff[],
    {
      cancel: false,
      mapError: () => 'Gagal memuat daftar kader.',
    },
  )

  return { kader, staff: kader, loading, error, refresh: reload }
}
