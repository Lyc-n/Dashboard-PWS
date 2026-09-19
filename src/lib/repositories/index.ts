import { LocalKunjunganRepository } from "./localKunjungan.repository";
import type { KunjunganRepository } from "./kunjungan.repository";

export { LocalKunjunganRepository, StorageQuotaError } from "./localKunjungan.repository";
export type { KunjunganRepository } from "./kunjungan.repository";

let singleton: KunjunganRepository | null = null;

export function getKunjunganRepository(): KunjunganRepository {
  if (singleton) return singleton;
  // Hanya FE (localStorage). Ganti impl Supabase nanti tanpa mengubah pemanggil.
  singleton = new LocalKunjunganRepository();
  return singleton;
}

// untuk tes
export function __setKunjunganRepository(repo: KunjunganRepository) {
  singleton = repo;
}
