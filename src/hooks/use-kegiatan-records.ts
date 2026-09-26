import { useCallback, useEffect, useState } from "react";
import { listKegiatan, saveKegiatan } from "@/lib/utils.functions";
import type { KegiatanRecord, Peserta } from "@/hooks/use-kegiatan";

export interface KegiatanRow extends KegiatanRecord {
  id: string;
  peserta?: Peserta[];
}

/** Daftar kegiatan langsung dari Postgres — pengganti localStorage `pws-kegiatan`. */
export function useKegiatanRecords() {
  const [records, setRecords] = useState<KegiatanRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = (await listKegiatan()) as unknown as KegiatanRow[];
      setRecords(Array.isArray(rows) ? rows : []);
    } catch {
      setError("Gagal memuat kegiatan dari database.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const saveRecord = useCallback(async (rec: KegiatanRecord & { peserta?: Peserta[]; fotoCaptions?: string[] }): Promise<KegiatanRow> => {
    const saved = (await saveKegiatan({ data: { record: rec as unknown as Record<string, unknown> } })) as unknown as KegiatanRow;
    await refresh();
    return saved;
  }, [refresh]);

  return { records, loading, error, refresh, saveRecord };
}
