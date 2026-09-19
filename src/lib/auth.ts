import { STORAGE_KEYS } from "@/lib/constants";
import { staffUsername } from "@/lib/seeds";
import type { Staff } from "@/lib/seeds";

export const ADMIN_USERNAME = "admin";
export const DEFAULT_STAFF_PASSWORD = "admin123";

export interface AuthUser {
  username: string;
  name: string;
  role: string;
  kel?: string;
  posy?: string;
}

export interface LoginResult {
  ok: boolean;
  user?: AuthUser;
  error?: string;
}

export function isAdminUser(user: AuthUser | null): boolean {
  return user?.role === "Admin";
}

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
    o.role.length > 0
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

function readStaff(): Staff[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.adminStaff);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return (parsed as (Partial<Staff> | null)[])
      .filter((s): s is Partial<Staff> => s !== null && typeof s.nama === "string" && s.nama.length > 0)
      .map((s) => ({
        nama: s.nama as string,
        peran: typeof s.peran === "string" ? s.peran : "Kader",
        kel: typeof s.kel === "string" ? s.kel : "",
        posy: typeof s.posy === "string" ? s.posy : "—",
        hp: typeof s.hp === "string" ? s.hp : "",
        username: typeof s.username === "string" && s.username.trim() ? s.username : staffUsernameSuggestion(s.nama as string),
        password: typeof s.password === "string" && s.password ? s.password : DEFAULT_STAFF_PASSWORD,
        on: s.on !== false,
      }));
  } catch {
    return [];
  }
}

function adminUser(): AuthUser {
  return { username: ADMIN_USERNAME, name: "A. Jubaidi", role: "Admin" };
}

export function listStaffAccounts(): { username: string; name: string; role: string; kel: string; posy: string }[] {
  return readStaff()
    .filter((s) => s.on)
    .map((s) => ({ username: s.username, name: s.nama, role: s.peran, kel: s.kel, posy: s.posy }));
}

export function staffUsernameSuggestion(nama: string): string {
  return staffUsername(nama);
}

export function login(username: string, password: string): LoginResult {
  const uname = username.trim().toLowerCase();
  // Akun admin hardcoded
  if (uname === ADMIN_USERNAME) {
    if (password === "admin") return { ok: true, user: adminUser() };
    return { ok: false, error: "Username atau password salah." };
  }
  // Akun staff dari kelola — username unik per staff
  const candidates = readStaff().filter((s) => s.on && s.username.trim().toLowerCase() === uname);
  const account = candidates.find((s) => s.password === password);
  if (!account) {
    return { ok: false, error: "Username atau password salah." };
  }
  return {
    ok: true,
    user: {
      username: account.username,
      name: account.nama,
      role: account.peran,
      kel: account.kel,
      posy: account.posy === "—" ? undefined : account.posy,
    },
  };
}

export function requireAuth(): { redirect: { to: "/login" } } | undefined {
  if (!getAuth()) {
    return { redirect: { to: "/login" } };
  }
  return undefined;
}