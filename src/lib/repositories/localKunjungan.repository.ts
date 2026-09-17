import { STORAGE_KEYS } from "@/lib/constants";
import type { KunjunganRecord, KunjunganStorageWrapper } from "@/features/checklist/types";
import { CHECKLIST_SCHEMA_VERSION, fromStorageWrapper, toStorageWrapper } from "@/features/checklist/types";
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
    if (parsed && typeof parsed === "object" && "version" in parsed && "data" in parsed) return parsed as KunjunganStorageWrapper;
    // legacy array fallback
    if (Array.isArray(parsed)) return toStorageWrapper(parsed as KunjunganRecord[]);
    return null;
  } catch {
    return null;
  }
}

function writeWrapper(wrapper: KunjunganStorageWrapper): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(STORAGE_KEYS.checklist, JSON.stringify(wrapper));
  } catch {
    // quota exceeded — caller handles via toast if needed
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
