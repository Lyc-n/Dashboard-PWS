import { LocalKunjunganRepository } from "./localKunjungan.repository";
import type { KunjunganRepository } from "./kunjungan.repository";

let singleton: KunjunganRepository | null = null;

export function getKunjunganRepository(): KunjunganRepository {
  if (singleton) return singleton;
  // FE only — localStorage. Swap to Supabase impl later without changing callers.
  singleton = new LocalKunjunganRepository();
  return singleton;
}

// for testing
export function __setKunjunganRepository(repo: KunjunganRepository) {
  singleton = repo;
}
