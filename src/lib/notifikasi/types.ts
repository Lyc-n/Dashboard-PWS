import type {
  CoverageRegion,
  JadwalItem,
  TindakLanjutItem,
} from '@/lib/dashboard/warning'

/**
 * Bentuk data yang dikirim server ke halaman notifikasi dan lonceng Topbar.
 *
 * Isinya SUMBER, bukan `Warning` yang sudah jadi. Alasannya: filter wilayah di
 * lonceng harus berubah seketika tanpa query baru, dan `buildWarnings()` adalah
 * fungsi murni yang jalan equally di server maupun browser.
 */
export interface NotifikasiData {
  /** Cakupan per kelurahan; sumber warning "sasaran belum dikunjungi". */
  regions: CoverageRegion[]
  /** Kunjungan berikutnya yang terjadwal dan belum jatuh tempo / sudah lewat. */
  jadwal: JadwalItem[]
  /** Kunjungan yang hasil terakhirnya butuh tindak lanjut. */
  tindakLanjut: TindakLanjutItem[]
  ringkasan: {
    warga: number
    kunjungan: number
  }
}

/** Filter yang dipakai halaman /notifikasi; semua nilai "all" berarti tanpa filter. */
export interface FilterNotifikasi {
  severity: string
  type: string
  region: string
}
