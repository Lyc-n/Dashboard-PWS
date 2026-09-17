import { useCallback, useMemo, useReducer } from 'react'
import { useKrTemplates } from '@/hooks/use-kr-templates'
import { getKunjunganRepository } from '@/lib/repositories'
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
  const repo = useMemo(() => getKunjunganRepository(), [])

  // Persist records via repo wrapper + localStorage hook for reactivity
  // Keep compatibility with existing useLocalStorage records page hook via direct repo read
  // Expose records derived from localStorage for history panel

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
    const record: KunjunganRecord = {
      id: createRecordId(),
      schemaVersion: CHECKLIST_SCHEMA_VERSION,
      clientId:
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : createRecordId(),
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
    return record
  }, [state, templates])

  const persist = useCallback(
    (record: KunjunganRecord) => {
      try {
        repo.save(record)
      } catch {
        toast('Gagal simpan lokal.')
      }
    },
    [repo, toast],
  )

  return {
    templates,
    state,
    dispatch,
    fillPercent,
    bahaCount,
    stepState,
    validate,
    submit,
    persist,
    // convenience dispatchers
    setField: useCallback(
      (k: keyof typeof state.info, v: string) =>
        dispatch({ type: 'SET_FIELD', key: k, value: v }),
      [],
    ),
    setSanField: useCallback(
      (k: keyof typeof state.sanitasi, v: string | boolean) =>
        dispatch({ type: 'SET_SAN_FIELD', key: k, value: v }),
      [],
    ),
  }
}
