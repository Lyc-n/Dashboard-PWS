import { STORAGE_KEYS } from "@/lib/constants";
import type { KunjunganRecord, KunjunganStorageWrapper } from "@/features/checklist/types";
import { CHECKLIST_SCHEMA_VERSION, fromStorageWrapper, toStorageWrapper } from "@/features/checklist/types";
import type { KunjunganRepository } from "./kunjungan.repository";

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function isRecordLike(r: unknown): r is KunjunganRecord {
  if (!r || typeof r !== "object") return false;
  const o = r as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.waktuSimpan === "string" &&
    !!o.info &&
    typeof o.info === "object" &&
    Array.isArray(o.anggota) &&
    Array.isArray(o.penilaian) &&
    Array.isArray(o.masalah)
  );
}

function readWrapper(): KunjunganStorageWrapper | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.checklist);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && "version" in parsed && "data" in parsed) {
      const w = parsed as KunjunganStorageWrapper;
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- tipe statis bohong untuk JSON korup; guard runtime tetap perlu
      if (w.version !== CHECKLIST_SCHEMA_VERSION || !Array.isArray(w.data)) return null;
      // saring entri rusak, jangan jatuhkan seluruh riwayat karena 1 record korup
      const clean = w.data.filter(isRecordLike);
      return { ...w, data: clean };
    }
    // legacy array fallback
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
    // fallback legacy read raw array directly
    if (!isBrowser()) return [];
    try {
      const raw = window.localStorage.getItem(STORAGE_KEYS.checklist);
      if (!raw) return [];
      return fromStorageWrapper(JSON.parse(raw));
    } catch {
      return [];
    }
  }

  async listAsync(): Promise<KunjunganRecord[]> {
    return this.list();
  }

  save(record: KunjunganRecord): void {
    const current = this.list();
    const next = [...current, record];
    writeWrapper(toStorageWrapper(next));
  }

  async saveAsync(record: KunjunganRecord): Promise<void> {
    this.save(record);
  }

  replaceAll(records: KunjunganRecord[]): void {
    writeWrapper({ version: CHECKLIST_SCHEMA_VERSION, updatedAt: new Date().toISOString(), data: records });
  }
}
