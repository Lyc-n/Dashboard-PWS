import type { KunjunganRecord } from "@/features/checklist/types";

// Port — LocalStorage adapter now, Supabase adapter later without changing callers
export interface KunjunganRepository {
  list: () => KunjunganRecord[];
  save: (record: KunjunganRecord) => void;
  update: (record: KunjunganRecord) => void;
  remove: (id: string) => void;
}