import { redirect } from "@tanstack/react-router";
import { getSessionToken } from "#/lib/utils.functions";

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

// baca sesi dari cookie httpOnly via server fn expect: sesi palsu di localStorage tak menembus route; tanpa sesi valid → redirect /pin.
export async function requireAuth(): Promise<void> {
  try {
    await getSessionToken();
  } catch {
    throw redirect({ to: "/pin" });
  }
}

// middleware auth admin
export async function requireAdmin(): Promise<void | { redirect: { to: "/laporan" } }> {
  try {
    const session = await getSessionToken();
    if (!isAdminUser(session.profile)) {
      return { redirect: { to: "/laporan" } };
    }
    return undefined;
  } catch {
    throw redirect({ to: "/pin" });
  }
}
