/**
 * Pendaftaran push OTOMATIS, tanpa tombol.
 *
 * Aturan browser tidak bisa dihindari: prompt izin notifikasi hanya boleh
 * muncul dari gesture pengguna (klik/tap/ketikan/scroll). Komponen ini
 * mengikuti aturan itu, tapi menyembunyikan detailnya dari pengguna:
 *
 * - Izin sudah "granted"  -> langsung berlangganan senyap, tanpa apa-apa.
 * - Izin masih "default"  -> prompt dimunculkan pada INTERAKSI PERTAMA di
 *   halaman mana saja (tap pertama kader di dashboard sudah cukup). Setelah
 *   diizinkan sekali, kunjungan berikutnya tidak pernah menanyakan lagi.
 * - Izin "denied"         -> diam. Menagih izin yang diblokir hanya membuat
 *   klik di aplikasi terasa dihantui; perbaikannya lewat pengaturan browser,
 *   dan tombol manual di /notifikasi tetap tersedia sebagai cadangan.
 *
 * Dipasang sekali di Topbar (halaman yang butuh sesi), jadi kurir data tidak
 * pernah menyent browser yang belum login, dan langganan selalu punya cookie
 * sesi saat `simpanPushSubscriptionFn` dipanggil.
 */

import { useEffect } from 'react'
import {
  daftarLanggananPush,
  siapPushBrowser,
} from '@/hooks/notifikasi/use-push-subscription'

// Satu proses per sesi tab, bukan per mount: Topbar bisa remount, prompt tidak
// boleh.
let berjalan = false

async function cobaDaftar(): Promise<void> {
  try {
    await daftarLanggananPush()
  } catch {
    // Gagal senyap: penyebabnya (izin blokir, env VAPID kosong, jaringan) sudah
    // terekspos lewat kartu status di /notifikasi. Menampilkan toast global
    // untuk fitur yang belum izinnya dikasih justru mengganggu.
  }
}

export function PushOtomatis() {
  useEffect(() => {
    if (berjalan) return
    berjalan = true

    if (!siapPushBrowser()) return
    const izin = Notification.permission

    if (izin === 'denied') return
    if (izin === 'granted') {
      void cobaDaftar()
      return
    }

    // Izin "default": tunggu satu interaksi pertama. `requestPermission` tanpa
    // gesture akan ditolak browser (bukan ditolak pengguna), jadi ini bukan
    // opsional - ini syaratnya.
    const padaInteraksi = () => {
      bersih()
      void cobaDaftar()
    }
    const bersih = () => {
      document.removeEventListener('pointerdown', padaInteraksi, true)
      document.removeEventListener('keydown', padaInteraksi, true)
      document.removeEventListener('scroll', padaInteraksi, { capture: true })
    }

    document.addEventListener('pointerdown', padaInteraksi, true)
    document.addEventListener('keydown', padaInteraksi, true)
    // Scroll ikut dihitung - di HP, biasanya pengguna menyentuh lalu geser
    // sebelum sempat menyadari ada prompt; gesture scroll juga sah.
    document.addEventListener('scroll', padaInteraksi, {
      capture: true,
      once: true,
      passive: true,
    })

    // Bersihkan pendengar bila Topbar dicabut sebelum ada interaksi - tidak
    // boleh ada pendengar yatim antar-navigasi.
    return bersih
  }, [])

  return null
}
