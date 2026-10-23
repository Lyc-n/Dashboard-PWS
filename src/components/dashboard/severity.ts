import {
  CalendarClock,
  ClipboardList,
  Hourglass,
  MapPin,
  UserX,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { PillVariant } from '@/lib/utils'
import type { WarningSeverity, WarningType } from '@/lib/dashboard/warning'

/**
 * Metadata tampilan untuk warning.
 *
 * Dipisah dari `warning.ts` supaya domain tetap bebas dari dependensi UI, tapi
 * tetap ada SATU salinan pemetaan warna: `PerluPerhatian` di dashboard,
 * lonceng di Topbar, dan halaman /notifikasi semuanya memakai file ini.
 */

/** Warna severity dipinjam dari palet status yang sudah dipakai Pill/StatusBadge. */
export const SEVERITY_META: Record<
  WarningSeverity,
  { label: string; variant: PillVariant }
> = {
  critical: { label: 'Kritis', variant: 'belum' },
  attention: { label: 'Perlu perhatian', variant: 'tindak' },
  reminder: { label: 'Pengingat', variant: 'process' },
  info: { label: 'Info', variant: 'pending' },
}

/** Urutan tampil di halaman notifikasi: paling serius dulu. */
export const SEVERITY_URUTAN: WarningSeverity[] = [
  'critical',
  'attention',
  'reminder',
  'info',
]

/** Label jenis warning, supaya lonceng bisa menampilkan kategori tanpa kode. */
export const WARNING_TYPE_LABEL: Record<WarningType, string> = {
  sasaran_belum_dikunjungi: 'Cakupan kunjungan',
  jadwal_terlambat: 'Jadwal kunjungan',
  periode_mendekati_akhir: 'Periode monitoring',
  cakupan_wilayah_rendah: 'Cakupan wilayah',
  tindak_lanjut_belum_selesai: 'Tindak lanjut',
}

/** Ikon per jenis warning di lonceng, dari lucide yang sudah dipakai nav. */
export const WARNING_TYPE_ICON: Record<WarningType, LucideIcon> = {
  sasaran_belum_dikunjungi: UserX,
  jadwal_terlambat: CalendarClock,
  periode_mendekati_akhir: Hourglass,
  cakupan_wilayah_rendah: MapPin,
  tindak_lanjut_belum_selesai: ClipboardList,
}
