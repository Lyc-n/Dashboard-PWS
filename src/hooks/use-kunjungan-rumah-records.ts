import { useCallback } from 'react'
import { useAsyncData } from '@/hooks/use-async-data'
import {
  getKunjunganRumah,
  listKunjunganRumah,
  removeKunjunganRumah,
  saveKunjunganRumah,
  updateKunjunganRumah,
} from '@/lib/utils.functions'
import { sanitizeRecord } from '@/features/kunjungan-rumah/types'
import type { KunjunganRumahRecord } from '@/features/kunjungan-rumah/types'

/** Daftar kunjungan langsung dari Postgres — pengganti localStorage `pws-kunjungan-rumah`. */
export function useKunjunganRumahRecords() {
  const {
    data: records,
    loading,
    error,
    reload,
  } = useAsyncData(
    async () => {
      const rows = await listKunjunganRumah()
      return (rows as unknown[])
        .map(sanitizeRecord)
        .filter((r): r is KunjunganRumahRecord => r !== null)
    },
    [],
    [] as KunjunganRumahRecord[],
    {
      cancel: false,
      mapError: () => 'Gagal memuat kunjungan rumah dari database.',
    },
  )

  const saveRecord = useCallback(
    async (rec: KunjunganRumahRecord): Promise<KunjunganRumahRecord> => {
      const saved = (await saveKunjunganRumah({
        data: { record: rec as unknown as Record<string, unknown> },
      })) as unknown as KunjunganRumahRecord
      await reload()
      return saved
    },
    [reload],
  )

  const updateRecord = useCallback(
    async (rec: KunjunganRumahRecord): Promise<KunjunganRumahRecord> => {
      const saved = (await updateKunjunganRumah({
        data: { id: rec.id, record: rec as unknown as Record<string, unknown> },
      })) as unknown as KunjunganRumahRecord
      await reload()
      return saved
    },
    [reload],
  )

  const removeRecord = useCallback(
    async (id: string) => {
      await removeKunjunganRumah({ data: { id } })
      await reload()
    },
    [reload],
  )

  const getRecord = useCallback(
    async (id: string): Promise<KunjunganRumahRecord | null> => {
      const row = await getKunjunganRumah({ data: { id } })
      if (!row) return null
      return sanitizeRecord(row)
    },
    [],
  )

  return {
    records,
    loading,
    error,
    refresh: reload,
    saveRecord,
    updateRecord,
    removeRecord,
    getRecord,
  }
}
