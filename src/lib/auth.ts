import { redirect } from '@tanstack/react-router'
import { getSessionToken } from '@/lib/utils.functions'

/**
 * Identitas satu-satunya yang ada di sistem ini: satu profil konstan, bukan
 * baris `users`.
 *
 * Login memakai satu PIN global dari environment (`isValidPin` membandingkan
 * dengan `process.env.PIN`), dan profil sesi diambil dari `SESSION_PROFILE`
 * yang konstan. Tidak ada pemetaan sesi -> `users.id`, jadi:
 *
 *   - Tidak ada konsep "admin" versus "kader" di tingkat akses. Semua yang
 *     punya sesi valid setara. Karena itu `AuthUser` tidak punya `role` yang
 *     memengaruhi hak akses, dan tidak ada `kel`/`posy` — kolom itu juga tidak
 *     ada di tabel `users`.
 *   - Tabel `users` tetap berguna sebagai daftar petugas pencatat, tapi murni
 *     sebagai data referensi: petugas dipilih manual di form, bukan dari sesi.
 *   - Tidak ada sinigzaka berdasarkan wilayah. Filter kelurahan di halaman
 *     laporan adalah alat pilih data yang dipakai pengguna secara sadar, bukan
 *     pembatas akses.
 *
 * Kalau suatu saat butuh akun terpisah per petugas, titik mulainya
 * ada di sini: ganti `SESSION_PROFILE` dengan baris `users` yang di-resolve
 * dari sebuah PIN per-akun, sambungkan `users.id` ke sesi, baru — dan hanya
 * kalau itu sudah ada — kembalikan pemisahan role/wilayah. Kolom `role` dan
 * `pinHash` yang dulu ada di `users` sudah dihapus justru karena tidak pernah
 * dipakai untuk hal itu; keduanya harus dibuat ulang, bukan dihidupkan lagi.
 * Lihat catatan panjang di `src/lib/user-registry.server.ts` yang menjelaskan
 * konsekuensinya.
 */
export interface AuthUser {
  username: string
  name: string
  role: string
}

/** Bentuk return `beforeLoad`. `user` diteruskan ke router context supaya
 *  `AuthProvider` membacanya dari sana. Sebelumnya `AuthProvider` memanggil
 *  `getSessionToken()` sendiri lewat `useEffect` — itu hop ketiga ke
 *  `valid_session` per page view, padahal `beforeLoad` sudah memvalidasinya. */
export interface AuthContext {
  user: AuthUser
}

// baca sesi dari cookie httpOnly via server fn expect: sesi palsu di localStorage tak menembus route; tanpa sesi valid → redirect /pin.
async function ambilProfil(): Promise<AuthUser> {
  try {
    const session = await getSessionToken()
    return session.profile
  } catch {
    throw redirect({ to: '/pin' })
  }
}

export async function requireAuth(): Promise<AuthContext> {
  return { user: await ambilProfil() }
}
