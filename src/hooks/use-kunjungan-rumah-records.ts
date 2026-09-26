import { useCallback, useEffect, useState } from "react";
import { getKunjunganRumah, listKunjunganRumah, removeKunjunganRumah, saveKunjunganRumah, updateKunjunganRumah } from "@/lib/utils.functions";
import { sanitizeRecord } from "@/features/kunjungan-rumah/types";
import type { KunjunganRumahRecord } from "@/features/kunjungan-rumah/types";

/** Daftar kunjungan langsung dari Postgres — pengganti localStorage `pws-kunjungan-rumah`. */
export function useKunjunganRumahRecords() {
  const [records, setRecords] = useState<KunjunganRumahRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await listKunjunganRumah();
      const clean = (rows as unknown[])
        .map(sanitizeRecord)
        .filter((r): r is KunjunganRumahRecord => r !== null);
      setRecords(clean);
    } catch {
      setError("Gagal memuat kunjungan rumah dari database.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const saveRecord = useCallback(async (rec: KunjunganRumahRecord): Promise<KunjunganRumahRecord> => {
    const saved = (await saveKunjunganRumah({ data: { record: rec as unknown as Record<string, unknown> } })) as unknown as KunjunganRumahRecord;
    await refresh();
    return saved;
  }, [refresh]);

  const updateRecord = useCallback(async (rec: KunjunganRumahRecord): Promise<KunjunganRumahRecord> => {
    const saved = (await updateKunjunganRumah({ data: { id: rec.id, record: rec as unknown as Record<string, unknown> } })) as unknown as KunjunganRumahRecord;
    await refresh();
    return saved;
  }, [refresh]);

  const removeRecord = useCallback(async (id: string) => {
    await removeKunjunganRumah({ data: { id } });
    await refresh();
  }, [refresh]);

  const getRecord = useCallback(async (id: string): Promise<KunjunganRumahRecord | null> => {
    const row = await getKunjunganRumah({ data: { id } });
    if (!row) return null;
    return sanitizeRecord(row);
  }, []);

  return { records, loading, error, refresh, saveRecord, updateRecord, removeRecord, getRecord };
}
