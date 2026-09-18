import { useCallback, useMemo, useReducer, useState } from 'react'
import { useKrTemplates } from '@/hooks/use-kr-templates'
import { StorageQuotaError, getKunjunganRepository } from '@/lib/repositories'
import { useToast } from '@/providers/toast'
import { validateKunjungan } from '../services/validateKunjungan'
import {
  initialKunjunganState,
  kunjunganReducer,
} from '../store/kunjunganReducer'
import {
  selectBahaCount,
  selectFillPercent,
  selectStepState,
} from '../store/kunjunganSelectors'
import { CHECKLIST_SCHEMA_VERSION, createRecordId } from '../types'
import type { KunjunganRecord } from '../types'

export function useChecklistForm() {
  const { templates } = useKrTemplates()
  const toast = useToast()
  const [state, dispatch] = useReducer(
    kunjunganReducer,
    undefined,
    initialKunjunganState,
  )
  // Single source: repository. Tidak ada dual-write useLocalStorage.
  const [records, setRecords] = useState<KunjunganRecord[]>(() => {
    try {
      return getKunjunganRepository().list()
    } catch {
      return []
    }
  })

  const fillPercent = useMemo(
    () => selectFillPercent(state, templates),
    [state, templates],
  )
  const bahaCount = useMemo(() => selectBahaCount(state), [state.penilaian])
  const stepState = useMemo(
    () => selectStepState(state),
    [state.anggota, state.penilaian, state.ttd],
  )

  const validate = useCallback(() => {
    const { ok, invalid } = validateKunjungan({ ...state, templates })
    dispatch({ type: 'SET_INVALID', invalid })
    return ok
  }, [state, templates])

  const submit = useCallback((): KunjunganRecord | null => {
    const { ok, invalid } = validateKunjungan({ ...state, templates })
    dispatch({ type: 'SET_INVALID', invalid })
    if (!ok) return null
    return {
      id: createRecordId(),
      schemaVersion: CHECKLIST_SCHEMA_VERSION,
      clientId: createRecordId(),
      syncedAt: null,
      waktuSimpan: new Date().toISOString(),
      info: { ...state.info },
      sanitasi: { ...state.sanitasi },
      anggota: state.anggota.map((m) => ({ ...m })),
      penilaian: state.penilaian.map((p) => ({
        ...p,
        values: { ...p.values },
        checks: { ...p.checks },
        prioritas: [...p.prioritas],
      })),
      masalah: state.masalah.map((m) => ({ ...m })),
      hasil: state.hasil,
      jadwal: state.jadwal,
      ttd: state.ttd,
    }
  }, [state, templates])

  const handleSubmit = useCallback((): KunjunganRecord | null => {
    const record = submit()
    if (!record) {
      toast('Periksa kembali isian yang wajib diisi.')
      return null
    }
    try {
      getKunjunganRepository().save(record)
      setRecords(getKunjunganRepository().list())
    } catch (e) {
      if (e instanceof StorageQuotaError) toast(e.message)
      else toast('Gagal menyimpan. Coba lagi.')
      return null
    }
    toast(`Kunjungan ${record.info.namaKK || 'keluarga'} tersimpan.`)
    return record
  }, [submit, toast])

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' })
  }, [])

  return {
    templates,
    state,
    dispatch,
    records,
    fillPercent,
    bahaCount,
    stepState,
    validate,
    submit,
    handleSubmit,
    reset,
    // convenience dispatchers
    setField: useCallback(
      (k: keyof typeof state.info | string, v: string) =>
        dispatch({ type: 'SET_FIELD', key: k, value: v }),
      [],
    ),
    setSanField: useCallback(
      (k: keyof typeof state.sanitasi | string, v: string | boolean) =>
        dispatch({ type: 'SET_SAN_FIELD', key: k, value: v }),
      [],
    ),
  }
}
