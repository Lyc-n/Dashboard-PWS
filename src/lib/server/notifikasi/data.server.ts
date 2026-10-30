/**
 * Sumber data notifikasi, dipakai dua jalur:
 *
 * - `getNotifikasiData` (dalam aplikasi, lewat sesi)
 * - cron pengiriman Web Push (tanpa sesi)
 *
 * Keduanya wajib melihat angka yang sama. Justru itu fungsi ini ada: kalau
 * query-nya ditulis dua kali, lonceng dan push bisa melaporkan jumlah
 * peringatan yang berbeda.
 */

import type { NotifikasiData } from '@/lib/notifikasi/types'
import {
  deriveJadwal,
  deriveTindakLanjutDari,
  keVisitRecord,
} from '@/lib/notifikasi/sumber-warning'
import { queryKelurahanStats } from '@/lib/server/dashboard.server'
import { listKunjunganRumahRecords } from '@/lib/server/kunjungan-rumah.server'

export async function ambilNotifikasiData(): Promise<NotifikasiData> {
  const [kelurahan, records] = await Promise.all([
    queryKelurahanStats(),
    // Diabaikan saat migrasi belum lengkap; lihat catatan di `getNotifikasiData`.
    listKunjunganRumahRecords().catch(() => [] as Record<string, unknown>[]),
  ])
  const visits = keVisitRecord(records)
  return {
    regions: kelurahan.map((k) => ({
      name: k.name,
      total: k.total,
      dikunjungi: k.dikunjungi,
    })),
    jadwal: deriveJadwal(visits),
    tindakLanjut: deriveTindakLanjutDari(visits),
    ringkasan: {
      warga: kelurahan.reduce((a, k) => a + k.total, 0),
      kunjungan: records.length,
    },
  }
}
