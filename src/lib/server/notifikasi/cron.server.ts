/**
 * Cron notifikasi harian.
 *
 * Dipanggil dari server route `/cron/notifikasi` dan dijadwalkan lewat
 * `vercel.json`. Logika di sini sengaja bebas dari HTTP: route yang membaca
 * request, modul ini yang menghitung dan mengirim.
 *
 * Isi push dibangun dari `buildWarnings` yang sama dengan lonceng Topbar dan
 * halaman /notifikasi. Cron tidak menyimpan "sudah dibaca": pengingat harian
 * memang diulang selama peringatannya masih aktif.
 */

import { createHash, timingSafeEqual } from 'node:crypto'
import { buildWarnings } from '@/lib/dashboard/warning'
import { konfigurasiWebPush, kirimPushKeSemua } from './push.server'
import { ambilNotifikasiData } from './data.server'
import type { HasilKirimPush } from './push.server'

export interface HasilCronNotifikasi extends HasilKirimPush {
  /** Jumlah warning aktif saat cron jalan. */
  peringatan: number
  /** Bagian dari `peringatan` yang severity-nya kritis. */
  kritis: number
  /** True kalau tidak ada yang dikirim (tidak ada warning / VAPID bermasalah). */
  dilewati: boolean
  alasan?: string
}

function hash(nilai: string): Buffer {
  return createHash('sha256').update(nilai).digest()
}

/** Perbandingan waktu tetap; panjang hash selalu sama, jadi aman. */
function sama(a: string, b: string): boolean {
  return timingSafeEqual(hash(a), hash(b))
}

/**
 * Vercel Cron mengirim `Authorization: Bearer <CRON_SECRET>` otomatis bila env
 * itu diisi. `?secret=` disediakan untuk uji manual dari curl di mesin lokal
 * yang tidak bisa menyetel header. Keduanya divalidasi sama kuat.
 */
export function secretCronCocok(request: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false

  const auth = request.headers.get('authorization') ?? ''
  const bearer = auth.toLowerCase().startsWith('bearer ')
    ? auth.slice(7).trim()
    : ''
  const dariQuery = new URL(request.url).searchParams.get('secret') ?? ''

  return sama(bearer, secret) || sama(dariQuery, secret)
}

export async function jalankanCronNotifikasi(): Promise<HasilCronNotifikasi> {
  const data = await ambilNotifikasiData()
  const warnings = buildWarnings(data)
  const kritis = warnings.filter((w) => w.severity === 'critical').length

  const dasar = { peringatan: warnings.length, kritis, terkirim: 0, gagal: 0 }

  if (warnings.length === 0) {
    return { ...dasar, dilewati: true, alasan: 'tidak ada peringatan aktif' }
  }
  if (!konfigurasiWebPush()) {
    return {
      ...dasar,
      dilewati: true,
      alasan: 'VAPID tidak valid atau belum diisi',
    }
  }

  const hasil = await kirimPushKeSemua({
    title:
      kritis > 0 ? 'PWS: ada peringatan kritis' : 'PWS: ringkasan peringatan',
    body: `${warnings.length} peringatan aktif (${kritis} kritis). Ketuk untuk melihat detail.`,
    url: '/notifikasi',
  })

  return { ...dasar, ...hasil, dilewati: false }
}
