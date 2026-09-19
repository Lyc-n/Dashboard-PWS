import { STORAGE_KEYS } from "@/lib/constants";
import type { KunjunganRecord, KunjunganStorageWrapper } from "@/features/checklist/types";
import { CHECKLIST_SCHEMA_VERSION, fromStorageWrapper, sanitizeRecord, toStorageWrapper } from "@/features/checklist/types";
import type { KunjunganRepository } from "./kunjungan.repository";

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readWrapper(): KunjunganStorageWrapper | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.checklist);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && "data" in parsed) {
      const o = parsed as Record<string, unknown>;
      if (!Array.isArray(o.data)) return null;
      // Terima versi berapa pun; migrasi dilakukan di sanitizeRecord (isi default),
      // bukan membuang data — skema 16/17 dkk tetap disimpan lalu di-rewrap saat tulis ulang.
      const clean = (o.data as unknown[])
        .map(sanitizeRecord)
        .filter((r): r is KunjunganRecord => r !== null);
      return { version: CHECKLIST_SCHEMA_VERSION, updatedAt: new Date().toISOString(), data: clean };
    }
    // fallback array polos dari versi sangat lama
    if (Array.isArray(parsed)) return toStorageWrapper(parsed as KunjunganRecord[]);
    return null;
  } catch {
    return null;
  }
}

export class StorageQuotaError extends Error {
  constructor(key: string) {
    super(`Penyimpanan penuh untuk "${key}". Hapus riwayat lama atau kosongkan ruang browser.`);
    this.name = "StorageQuotaError";
  }
}

function writeWrapper(wrapper: KunjunganStorageWrapper): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(STORAGE_KEYS.checklist, JSON.stringify(wrapper));
  } catch (e) {
    if (e && typeof e === "object" && "name" in e && (e as { name: string }).name.includes("Quota")) {
      throw new StorageQuotaError(STORAGE_KEYS.checklist);
    }
    throw e;
  }
}

export class LocalKunjunganRepository implements KunjunganRepository {
  list(): KunjunganRecord[] {
    const w = readWrapper();
    if (w) return w.data;
    // fallback: baca array polos dari storage langsung
    if (!isBrowser()) return [];
    try {
      const raw = window.localStorage.getItem(STORAGE_KEYS.checklist);
      if (!raw) return [];
      return fromStorageWrapper(JSON.parse(raw));
    } catch {
      return [];
    }
  }

  save(record: KunjunganRecord): void {
    const current = this.list();
    const next = [...current, record];
    writeWrapper(toStorageWrapper(next));
  }

  update(record: KunjunganRecord): void {
    const current = this.list();
    const idx = current.findIndex((r) => r.id === record.id);
    const next = idx >= 0 ? current.map((r) => (r.id === record.id ? record : r)) : [...current, record];
    writeWrapper(toStorageWrapper(next));
  }

  remove(id: string): void {
    const current = this.list();
    writeWrapper(toStorageWrapper(current.filter((r) => r.id !== id)));
  }
}