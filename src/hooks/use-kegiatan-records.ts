import { useCallback } from "react";
import { useAsyncData } from "@/hooks/use-async-data";
import { listKegiatan, saveKegiatan } from "@/lib/utils.functions";
import type { KegiatanRecord, Peserta } from "@/hooks/use-kegiatan";

/**
 * Baris kegiatan yang tampil di UI.
 *
 * `petugas` berisi NAMA petugas, bukan `users.id`. Bentuk simpanannya
 * berbeda: kolom itu `users.id` supaya bisa dipakai sebagai
 * `surveys.petugasId`, dan begitu data dibaca balik namanya diambil dari tabel
 * `users` supaya tidak ada nama yang bisa basi di dua tempat.
 */
export interface KegiatanRow extends KegiatanRecord {
  id: string;
  peserta?: Peserta[];
}

/** Daftar kegiatan langsung dari Postgres — pengganti localStorage `pws-kegiatan`. */
export function useKegiatanRecords() {
  const { data: records, loading, error, reload } = useAsyncData(
    async () => {
      const rows = (await listKegiatan()) as unknown as KegiatanRow[];
      return Array.isArray(rows) ? rows : [];
    },
    [],
    [] as KegiatanRow[],
    {
      cancel: false,
      mapError: () => "Gagal memuat kegiatan dari database.",
    },
  );

  const saveRecord = useCallback(async (rec: KegiatanRecord & { peserta?: Peserta[]; fotoCaptions?: string[] }): Promise<KegiatanRow> => {
    const saved = (await saveKegiatan({ data: { record: rec as unknown as Record<string, unknown> } })) as unknown as KegiatanRow;
    await reload();
    return saved;
  }, [reload]);

  return { records, loading, error, refresh: reload, saveRecord };
}
