/**
 * Pengiriman Web Push ke perangkat yang sudah mengizinkannya.
 *
 * Notifikasi di dalam aplikasi hanya muncul saat ada yang membuka dashboard.
 * Cron memakai kanal ini supaya peringatan tetap sampai ke HP kader walau
 * website sedang tidak dibuka. Yang disimpan hanya langganan browser
 * (`push_subscriptions`), bukan status "sudah dibaca": aplikasi ini masih
 * memakai satu profil sesi global, jadi read-state per orang tidak bermakna.
 */

import { eq } from 'drizzle-orm'
import webpush from 'web-push'
import { db } from '@/lib/server/db.server'
import { pushSubscriptions } from '@/lib/schema/schema'

export interface PushSubscriptionInput {
  endpoint: string
  keys: { p256dh: string; auth: string }
  userAgent?: string
}

/** Isi notifikasi yang tampil di OS. Sengaja kecil; batas payload Web Push 4 KB. */
export interface PushPayload {
  title: string
  body: string
  url?: string
}

export interface HasilKirimPush {
  terkirim: number
  gagal: number
}

let vapidSiap: boolean | null = null

/**
 * Setel kunci VAPID sekali per proses.
 *
 * Fungsi ini tidak melempar saat env kosong/salah: cron hanya perlu tahu bahwa
 * push belum bisa dikirim, sedangkan halaman lain tidak boleh ikut error
 * gara-gara fitur opsional ini belum dikonfigurasi.
 */
export function konfigurasiWebPush(): boolean {
  if (vapidSiap !== null) return vapidSiap
  const publicKey = process.env.VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  if (!publicKey || !privateKey) {
    vapidSiap = false
    return false
  }
  // `VAPID_SUBJECT` wajib URL. Env sering diisi alamat email tanpa skema, dan
  // web-push menolaknya; tambahkan `mailto:` alih-alih membuat cron gagal
  // hanya karena format env yang kurang satu prefix.
  const mentah = (process.env.VAPID_SUBJECT ?? '').trim()
  const subject =
    mentah === ''
      ? 'mailto:admin@localhost'
      : /^(mailto:|https:\/\/)/i.test(mentah)
        ? mentah
        : `mailto:${mentah}`
  try {
    webpush.setVapidDetails(subject, publicKey, privateKey)
  } catch (err) {
    console.error('VAPID tidak valid:', err)
    vapidSiap = false
    return false
  }
  vapidSiap = true
  return true
}

export async function simpanPushSubscription(input: PushSubscriptionInput) {
  await db
    .insert(pushSubscriptions)
    .values({
      endpoint: input.endpoint,
      p256dh: input.keys.p256dh,
      auth: input.keys.auth,
      userAgent: input.userAgent ?? null,
    })
    .onConflictDoUpdate({
      target: pushSubscriptions.endpoint,
      set: {
        p256dh: input.keys.p256dh,
        auth: input.keys.auth,
        userAgent: input.userAgent ?? null,
        lastUsedAt: new Date(),
      },
    })
}

export async function hapusPushSubscription(endpoint: string) {
  await db
    .delete(pushSubscriptions)
    .where(eq(pushSubscriptions.endpoint, endpoint))
}

async function listPushSubscriptions() {
  return db.select().from(pushSubscriptions)
}

/**
 * Kirim satu payload ke semua perangkat yang berlangganan.
 *
 * Endpoint yang sudah mati (410 Gone / 404) dihapus di tempat. Kalau tidak,
 * tabel akan menumpuk langganan browser yang sudah di-uninstall dan tiap cron
 * membuang waktu untuk mengirim ke alamat yang tidak ada.
 */
export async function kirimPushKeSemua(
  payload: PushPayload,
): Promise<HasilKirimPush> {
  if (!konfigurasiWebPush()) return { terkirim: 0, gagal: 0 }

  const subs = await listPushSubscriptions()
  let terkirim = 0
  let gagal = 0
  const isi = JSON.stringify(payload)

  for (const s of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        isi,
      )
      terkirim++
      await db
        .update(pushSubscriptions)
        .set({ lastUsedAt: new Date() })
        .where(eq(pushSubscriptions.endpoint, s.endpoint))
    } catch (err) {
      gagal++
      const status = (err as { statusCode?: number }).statusCode
      if (status === 404 || status === 410) {
        await hapusPushSubscription(s.endpoint)
      }
    }
  }

  return { terkirim, gagal }
}
