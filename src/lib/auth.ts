import { redirect } from "@tanstack/react-router";
import { getSessionToken } from "@/lib/utils.functions";

export interface AuthUser {
  username: string;
  name: string;
  role: string;
  kel?: string;
  posy?: string;
}

export function isAdminUser(user: AuthUser | null): boolean {
  return user?.role === "Admin";
}

/** Bentuk return `beforeLoad`. `user` diteruskan ke router context supaya
 *  `AuthProvider` membacanya dari sana. Sebelumnya `AuthProvider` memanggil
 *  `getSessionToken()` sendiri lewat `useEffect` — itu hop ketiga ke
 *  `valid_session` per page view, padahal `beforeLoad` sudah memvalidasinya. */
export interface AuthContext {
  user: AuthUser;
}

// baca sesi dari cookie httpOnly via server fn expect: sesi palsu di localStorage tak menembus route; tanpa sesi valid → redirect /pin.
async function ambilProfil(): Promise<AuthUser> {
  try {
    const session = await getSessionToken();
    return session.profile;
  } catch {
    throw redirect({ to: "/pin" });
  }
}

export async function requireAuth(): Promise<AuthContext> {
  return { user: await ambilProfil() };
}

// middleware auth admin
export async function requireAdmin(): Promise<AuthContext | { redirect: { to: "/laporan" } }> {
  const user = await ambilProfil();
  if (!isAdminUser(user)) {
    return { redirect: { to: "/laporan" } };
  }
  return { user };
}
