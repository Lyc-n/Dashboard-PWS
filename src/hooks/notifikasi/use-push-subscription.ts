/**
 * Pendaftaran Web Push per perangkat.
 *
 * Notifikasi di dalam aplikasi hanya muncul saat ada yang membuka dashboard;
 * push adalah satu-satunya kanal yang tetap muncul saat tab tidak ada. Karena
 * itu langganan harus dibuat di sisi browser (izin + service worker) lalu
 * disimpan ke server lewat `simpanPushSubscriptionFn`.
 *
 * Pendaftarannya OTOMATIS (lihat `PushOtomatis` di Topbar): begitu izin
 * "granted", baris di bawah `daftarLanggananPush()` berjalan tanpa tombol.
 * Satu-satunya syarat yang tidak bisa dilewati adalah prompt izin browser itu
 * sendiri - semua browser menuntut gesture pengguna untuk menampilkannya,
 * jadi prompt MUNCUL SEKALI pada interaksi pertama, lalu selamanya otomatis.
 *
 * Tidak ada tampilan status push: keadaan yang berubah (izin dicabut, browser
 * tanpa dukungan) ditangani senyap oleh `PushOtomatis`. Kalau suatu saat butuh
 * kartu status kembali, kembalikan hook ini lewat riwayat git.
 */

import { simpanPushSubscriptionFn } from '@/lib/api/server-fns'

/** Cek dukungan tanpa efek samping, aman dipanggil saat SSR juga. */
export function siapPushBrowser(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

/**
 * Register service worker, pastikan langganan, dan simpan ke server.
 *
 * Idempoten: dipanggil berulang setiap buka halaman, tapi hanya mengirim upsert
 * ke server saat perlu (langganan baru, atau tanda simpan belum ada di
 * localStorage). Jadi buka halaman 20x tidak berarti 20x menulis ke DB.
 *
 * Melempar `Error` dengan pesan Indonesia yang bisa langsung ditampilkan.
 */
export async function daftarLanggananPush(): Promise<void> {
  if (!siapPushBrowser()) {
    throw new Error(
      'Browser ini tidak mendukung Web Push. Di iPhone, tambahkan dashboard ke Layar Utama lebih dulu.',
    )
  }

  const kunciVapid = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined
  if (!kunciVapid) {
    throw new Error(
      'Kunci VAPID publik belum diisi di env build (VITE_VAPID_PUBLIC_KEY).',
    )
  }

  // Kalau izin belum pernah diminta, requestPermission di sini HARUS dipanggil
  // dari event gesture pengguna (lihat `PushOtomatis`); dipanggil begitu saja
  // di mount, browser membisukannya tanpa menampilkan prompt.
  const izin =
    Notification.permission === 'granted'
      ? 'granted'
      : await Notification.requestPermission()
  if (izin !== 'granted') {
    throw new Error('Izin notifikasi tidak diberikan.')
  }

  const reg = await navigator.serviceWorker.register('/sw.js')
  const langganan =
    (await reg.pushManager.getSubscription()) ??
    (await reg.pushManager.subscribe({
      userVisibleOnly: true,
      // Kunci base64url langsung diterima semua browser modern; mengubah ke
      // Uint8Array di sini justru menambah satu tempat salah decode.
      applicationServerKey: kunciVapid,
    }))

  const json = langganan.toJSON()
  const p256dh = json.keys?.p256dh
  const auth = json.keys?.auth
  if (!json.endpoint || !p256dh || !auth) {
    throw new Error('Langganan browser tidak lengkap.')
  }

  const TANDA_SIMPAN = 'push.langganan-terdaftar'
  if (
    (await reg.pushManager.getSubscription())?.endpoint === json.endpoint &&
    localStorage.getItem(TANDA_SIMPAN) === '1'
  ) {
    // Sudah dikenal server; tidak perlu menulis ulang tiap kunjungan.
    return
  }

  await simpanPushSubscriptionFn({
    data: {
      endpoint: json.endpoint,
      keys: { p256dh, auth },
      userAgent: navigator.userAgent,
    },
  })
  localStorage.setItem(TANDA_SIMPAN, '1')
}
