import type { KunjunganRecord } from "@/features/checklist/types";

// Port — LocalStorage adapter now, Supabase adapter later without changing callers
export interface KunjunganRepository {
  list: () => KunjunganRecord[];
  listAsync: () => Promise<KunjunganRecord[]>;
  save: (record: KunjunganRecord) => void;
  saveAsync: (record: KunjunganRecord) => Promise<void>;
  replaceAll: (records: KunjunganRecord[]) => void;
}
