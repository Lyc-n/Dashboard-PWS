import { useCallback, useMemo, useReducer, useState } from 'react'
import { useKrTemplates } from '@/hooks/use-kr-templates'
import { StorageQuotaError, getKunjunganRepository } from '@/lib/repositories'
import { useToast } from '@/providers/toast'
import { prepareFotos } from '../lib/fotos'
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
import { getAuth, isAdminUser } from '@/lib/auth'
import type { KunjunganState } from '../store/kunjunganReducer'

function initialStateForUser(): KunjunganState {
  const state = initialKunjunganState()
  const user = getAuth()
  if (!user || isAdminUser(user)) return state
  if (user.kel) state.info.kelurahan = user.kel
  if (user.posy) state.info.posyandu = user.posy
  if (user.name) state.ttd = user.name
  return state
}

export function useChecklistForm() {
  const { templates } = useKrTemplates()
  const toast = useToast()
  const [state, dispatch] = useReducer(
    kunjunganReducer,
    undefined,
    initialStateForUser,
  )
  // Single source: repository. Tidak ada dual-write useLocalStorage.
  const [records, setRecords] = useState<KunjunganRecord[]>(() => {
    try {
      return getKunjunganRepository().list()
    } catch {
      return []
    }
  })
  const [fotoUploading, setFotoUploading] = useState(false)

  const addFotos = useCallback(
    async (files: File[]): Promise<{ added: number; skipped: number }> => {
      setFotoUploading(true)
      try {
        const { added, skipped } = await prepareFotos(state.fotos, files)
        if (added.length > 0) {
          dispatch({ type: 'ADD_FOTOS', fotos: added })
          dispatch({
            type: 'SET_INVALID',
            invalid: { ...state.invalid, fotos: false },
          })
        }
        return { added: added.length, skipped }
      } finally {
        setFotoUploading(false)
      }
    },
    [state.fotos, state.invalid],
  )

  const setFotoCaption = useCallback((index: number, caption: string) => {
    dispatch({ type: 'SET_FOTO_CAPTION', index, caption })
  }, [])

  const removeFoto = useCallback((index: number) => {
    dispatch({ type: 'REMOVE_FOTO', index })
  }, [])

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
      fotos: state.fotos.map((f) => ({ ...f })),
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
    addFotos,
    setFotoCaption,
    removeFoto,
    fotoUploading,
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
