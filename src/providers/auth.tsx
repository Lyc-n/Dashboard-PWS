import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { ReactNode } from 'react'
import { useMatches } from '@tanstack/react-router'
import { logoutSession } from '@/lib/utils.functions'
import type { AuthUser } from '@/lib/auth'

interface AuthContextValue {
  user: AuthUser | null
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  logout: async () => {},
})

export function useAuth(): AuthContextValue {
  return useContext(AuthContext)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // Sesi dibaca dari router context, bukan panggilan server sendiri. Setiap route
  // yang dilindungi `requireAuth` sudah memvalidasi cookie httpOnly
  // dan menaruh `user` di sana. `getSessionToken()` dari `useEffect` menambah satu
  // round trip penuh ke `valid_session` setelah hydration, padahal hasilnya sudah ada.
  const ctxUser = useMatches({
    select: (matches) => {
      // Context diwarisi ke bawah, jadi match terakhir (route yang sedang dibuka)
      // sudah membawa `user` dari `beforeLoad` leluhurnya. `/pin` tidak memanggil
      // `requireAuth`, jadi tidak ada `user` di sana.
      for (let i = matches.length - 1; i >= 0; i -= 1) {
        const user = (matches[i]!.context as { user?: AuthUser }).user
        if (user) return user
      }
      return null
    },
  })

  // Penanda logout: router context masih menyimpan `user` lama sampai navigasi
  // berikutnya selesai, jadi tanpa ini header masih menampilkan nama yang baru logout.
  //
  // Penandanya harus DIRESET begitu context berubah, kalau tidak user yang login
  // lagi di sesi berikutnya tetap tampil sebagai `null`: `AuthProvider` lived di
  // shell router dan tidak remount saat pindah `/pin` ke halaman terlindungi.
  // Reset-nya lewat `useEffect` (bukan `useState` langsung) karena `ctxUser` masih
  // objek yang sama pada render pertama setelah logout.
  const [sudahKeluar, setSudahKeluar] = useState(false)
  useEffect(() => {
    setSudahKeluar(false)
  }, [ctxUser])

  const logout = useCallback(async () => {
    await logoutSession()
    setSudahKeluar(true)
  }, [])

  const value = useMemo(
    () => ({ user: sudahKeluar ? null : ctxUser, logout }),
    [ctxUser, sudahKeluar, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
