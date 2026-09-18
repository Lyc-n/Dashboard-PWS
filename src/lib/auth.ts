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

interface StoredSession {
  user: AuthUser;
  issuedAt: string;
  expiresAt: string;
  sig: string;
}

// Demo-only: localStorage session. Bukan auth aman — ganti server session + httpOnly cookie saat backend siap.
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
const SIG_PEPPER = "pws-demo-v1";

function hashSession(username: string, expiresAt: string): string {
  const s = `${username}|${expiresAt}|${SIG_PEPPER}`;
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < s.length; i++) {
    h1 = Math.imul(h1 ^ s.charCodeAt(i), 16777619);
    h2 = Math.imul(h2 + s.charCodeAt(i), 31);
  }
  return `${(h1 >>> 0).toString(16)}${(h2 >>> 0).toString(16)}`;
}

function isValidUser(u: unknown): u is AuthUser {
  if (!u || typeof u !== "object") return false;
  const o = u as Record<string, unknown>;
  return (
    typeof o.username === "string" &&
    o.username.length > 0 &&
    typeof o.name === "string" &&
    typeof o.role === "string" &&
    DEMO_ACCOUNTS.some((a) => a.username === o.username)
  );
}

function isValidSession(s: unknown): s is StoredSession {
  if (!s || typeof s !== "object") return false;
  const o = s as Record<string, unknown>;
  if (!isValidUser(o.user)) return false;
  if (typeof o.expiresAt !== "string" || typeof o.sig !== "string") return false;
  const user = o.user;
  if (hashSession(user.username, o.expiresAt) !== o.sig) return false;
  if (Number.isNaN(Date.parse(o.expiresAt))) return false;
  if (Date.parse(o.expiresAt) <= Date.now()) return false;
  return true;
}

const AUTH_KEY = STORAGE_KEYS.auth;

export function getAuth(): AuthUser | null {
  try {
    const raw = window.localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    // dukung sesi baru; tolak mentah user tanpa sig/expiry
    if (isValidSession(parsed)) return parsed.user;
    // hapus sesi rusak/kedaluwarsa agar tidak dipakai ulang
    window.localStorage.removeItem(AUTH_KEY);
    return null;
  } catch {
    return null;
  }
}

export function saveAuth(user: AuthUser): void {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_TTL_MS).toISOString();
  const session: StoredSession = {
    user,
    issuedAt: now.toISOString(),
    expiresAt,
    sig: hashSession(user.username, expiresAt),
  };
  window.localStorage.setItem(AUTH_KEY, JSON.stringify(session));
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