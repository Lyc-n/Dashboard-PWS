import { STORAGE_KEYS } from "@/lib/constants";

export interface AuthUser {
  username: string;
  name: string;
  role: string;
}

export interface LoginResult {
  ok: boolean;
  user?: AuthUser;
  error?: string;
}

export const DEMO_ACCOUNTS: AuthUser[] = [
  { username: "admin", name: "A. Jubaidi", role: "Petugas PWS" },
];

const AUTH_KEY = STORAGE_KEYS.auth;

export function getAuth(): AuthUser | null {
  try {
    const raw = window.localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthUser;
    if (!parsed.username) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveAuth(user: AuthUser): void {
  window.localStorage.setItem(AUTH_KEY, JSON.stringify(user));
}

export function clearAuth(): void {
  window.localStorage.removeItem(AUTH_KEY);
}

export function login(username: string, password: string): LoginResult {
  const account = DEMO_ACCOUNTS.find((a) => a.username === username.trim() && password === "admin");
  if (!account) {
    return { ok: false, error: "Username atau password salah." };
  }
  return { ok: true, user: account };
}

export function requireAuth(): { redirect: { to: "/login" } } | undefined {
  if (!getAuth()) {
    return { redirect: { to: "/login" } };
  }
  return undefined;
}