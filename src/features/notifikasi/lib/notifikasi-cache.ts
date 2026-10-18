import { getNotifikasiData } from "@/lib/utils.functions";
import { subscribe, emit } from "@/lib/events";
import type { NotifikasiData } from "@/features/notifikasi/types";

/**
 * Cache modul untuk data notifikasi, di sisi browser.
 *
 * Mengikuti `src/lib/nav-forms-cache.ts` persis: TTL, dedupe request yang masih
 * berjalan, dan event emitter. Alasannya lonceng ada di `Topbar`, jadi ia
 * ter-render di SETIAP halaman — tanpa cache, satu kunjungan rumah baru akan
 * menarik seluruh tabel `survey_entries` ulang di tiap navigasi.
 *
 * Cache ini TIDAK di server. Server fn dipanggil lewat HTTP, jadi modul di
 * memori server tidak bisa di-invalidate dari browser; TTL 5 menit di sisi
 * klien yang jadi penjaganya, ditambah `invalidateNotifikasi()` yang dipanggil
 * setiap kali record kunjungan disimpan, diubah, atau dihapus.
 */

const CACHE_TTL = 5 * 60 * 1000;

let cache: { data: NotifikasiData; expires: number } | null = null;
let inflight: Promise<NotifikasiData> | null = null;

export async function getNotifikasi(): Promise<NotifikasiData> {
  const now = Date.now();
  if (cache && cache.expires > now) return cache.data;
  if (!inflight) inflight = getNotifikasiData();
  try {
    const data = await inflight;
    cache = { data, expires: Date.now() + CACHE_TTL };
    return data;
  } finally {
    inflight = null;
  }
}

/** Buang cache lalu beri tahu semua lonceng yang sedang ter-render. */
export function invalidateNotifikasi(): void {
  cache = null;
  inflight = null;
  emit();
}

export function onNotifikasiChange(listener: () => void): () => void {
  return subscribe(listener);
}