import type { KunjunganRecord } from "@/features/checklist/types";

// Port — adaptor localStorage sekarang, adaptor Supabase nanti tanpa mengubah pemanggil
export interface KunjunganRepository {
  list: () => KunjunganRecord[];
  save: (record: KunjunganRecord) => void;
  update: (record: KunjunganRecord) => void;
  remove: (id: string) => void;
}