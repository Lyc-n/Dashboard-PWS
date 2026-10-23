import { sortWarnings } from '@/lib/dashboard/warning'
import type { Warning, WarningSeverity } from '@/lib/dashboard/warning'

/**
 * Logika murni di balik toast notifikasi: pilih kandidat dari `Warning[]`,
 * hafalkan ID yang sudah pernah dipilih di `sessionStorage`, dan batasi
 * kemunculannya supaya tidak jadi gangguan.
 *
 * Sengaja TIDAK menyentuh React maupun DOM di jalur datanya — storage
 * di-inject lewat parameter, supaya semua keputusan di sini bisa diuji tanpa
 * jsdom. Latar keputusannya (lihat /notifikasi dan keputusan proyek): TIDAK
 * ada status "baca" di database, karena sesi masih satu profil admin
 * hardcoded (`SESSION_PROFILE`), jadi ingatan "sudah tampil" hanya hidup
 * sampai tab ditutup — konsekuensi yang disepakati, bukan hilang sengaja.
 */

/** Kunci sessionStorage; v1 supaya skema bisa berganti tanpa tabrakan data lama. */
export const KUNCI_SIMPAN = 'pws:notifikasi-toast:v1'

/** Sarung biaya simpan daftar ID yang sudah pernah tampil di satu sesi. */
export const BATAS_RIWAYAT_ID = 50

/** Berapa toast boleh muncul maksimal dalam satu sesi browser. */
export const BATAS_TOAST_PER_SESI = 50

/**
 * Hanya severity se-serius ini yang boleh jadi toast. `reminder`/`info` tetap
 * bisa dilihat lewat lonceng — kalau semua tingkat muncul sebagai toast
 * sekaligus, toast akan pesat terasa seperti spam.
 */
export const SEVERITY_TOAST: readonly WarningSeverity[] = [
  'critical',
  'attention',
  'reminder',
  'info',
]

/** Lama satu toast tampil sebelum menutup sendiri (ms). */
export const DURASI_TOAST = 6000

/**
 * Penyimpan ID yang sudah pernah ditampilkan. Di-inject supaya uji tidak
 * menyentuh sessionStorage sama sekali.
 */
export interface SimpanToast {
  baca: () => string[]
  tulis: (ids: string[]) => void
}

/**
 * Penyimpan nyata: sessionStorage browser. Gagalan ditangani di dua lapis —
 * fungsi penyimpan ini menanggung sendiri, dan `bacaDitampilkan` /
 * `tandaiDitampilkan` juga membungkus panggilannya apa pun penyimpannya.
 * Kuota penuh / mode privat hanya membuat toast boleh muncul ulang, yang jauh
 * lebih baik dari halaman crash hanya karena penyimpan dikunci.
 */
export function simpanSession(): SimpanToast {
  return {
    baca(): string[] {
      try {
        if (typeof window === 'undefined') return []
        const mentah = window.sessionStorage.getItem(KUNCI_SIMPAN)
        if (!mentah) return []
        const isi: unknown = JSON.parse(mentah)
        if (!Array.isArray(isi)) return []
        return isi.filter((x): x is string => typeof x === 'string')
      } catch {
        return []
      }
    },
    tulis(ids: string[]): void {
      try {
        if (typeof window === 'undefined') return
        window.sessionStorage.setItem(KUNCI_SIMPAN, JSON.stringify(ids))
      } catch {
        // Tidak ada tempat untuk mencatat di sini; aman dibiarkan gugur diam.
      }
    },
  }
}

/** Penyimpan bawaan untuk produksi. */
export const SIMPAN_TOAST: SimpanToast = simpanSession()

/** ID yang sudah pernah ditampilkan di sesi ini (kosong bila penyimpan gagal). */
export function bacaDitampilkan(simpan: SimpanToast = SIMPAN_TOAST): string[] {
  // Bacaan gagal = lupa ingatan, bukan crash: toast boleh muncul ulang.
  try {
    return simpan.baca()
  } catch {
    return []
  }
}

/**
 * Catat ID sebagai "sudah dipilih untuk tampil" dan kembalikan daftar yang
 * tersimpan. ID dianggap tampil SAAT masuk antrean, bukan saat ditutup — jadi
 * `invalidateNotifikasi()` yang dipanggil di tengah antrean tidak memunculkan
 * ulang toast yang sama.
 */
export function tandaiDitampilkan(
  idBaru: readonly string[],
  simpan: SimpanToast = SIMPAN_TOAST,
): string[] {
  // Gabung dengan urutan, buang kembar, dan kalau sarungnya penuh buang yang
  // PALING LAMA supaya ID yang baru ditandai tetap hafal (toast terbaru yang
  // harus tidak muncul ulang, bukan toast yang sudah turun jauh-hari lalu).
  const gabung: string[] = []
  const hafal = new Set<string>()
  for (const id of [...bacaDitampilkan(simpan), ...idBaru]) {
    if (hafal.has(id)) continue
    hafal.add(id)
    gabung.push(id)
  }
  const hasil = gabung.slice(-BATAS_RIWAYAT_ID)
  // Tulis gagal = hafalan gugur diam; daftar gabungan tetap dikembalikan supaya
  // pemanggil bisa memakai hasil akhirnya tanpa tergantung nasib storage.
  try {
    simpan.tulis(hasil)
  } catch {
    // Aman dibiarkan: toast berikutnya mungkin muncul ulang, dan itu diizinkan.
  }
  return hasil
}

/**
 * Warning yang layak jadi toast: aktif, severity termasuk
 * `SEVERITY_TOAST`, belum pernah tampil, dipotong sisa kuota sesi, dan sudah
 * diurut dari yang paling serius.
 */
export function pilihKandidatToast(
  warnings: readonly Warning[],
  sudahTampil: readonly string[],
): Warning[] {
  const sudah = new Set(sudahTampil)
  const layak = warnings.filter(
    (w) =>
      w.status === 'active' &&
      SEVERITY_TOAST.includes(w.severity) &&
      !sudah.has(w.id),
  )
  const sisaKuota = Math.max(0, BATAS_TOAST_PER_SESI - sudahTampil.length)
  return sortWarnings(layak).slice(0, sisaKuota)
}
