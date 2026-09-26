import { useCallback, useEffect, useMemo, useReducer, useState } from 'react'
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
import { isAdminUser } from '@/lib/auth'
import { useAuth } from '@/providers/auth'
import type { AuthUser } from '@/lib/auth'
import type { KunjunganState } from '../store/kunjunganReducer'

export interface UseChecklistFormOptions {
  /** Record yang sedang diedit. Saat diberikan, submit memperbarui record ini (bukan menambah baru). */
  record?: KunjunganRecord | null
}

// [perbaikan] profil diambil dari useAuth() (cookie JWT via server), bukan getAuth() localStorage —
//   expect: tak ada lagi pembacaan sesi localStorage; dengan login PIN tunggal, profil = admin
//   jadi pra-isi kel/posy/ttd untuk kader tidak aktif (cabang admin menang), perilaku form utuh.
function initialStateForUser(user: AuthUser | null): KunjunganState {
  const state = initialKunjunganState()
  if (!user || isAdminUser(user)) return state
  if (user.kel) state.info.kelurahan = user.kel
  if (user.posy) state.info.posyandu = user.posy
  if (user.name) state.ttd = user.name
  return state
}

export function useChecklistForm(opts?: UseChecklistFormOptions) {
  const { templates } = useKrTemplates()
  const toast = useToast()
  // [perbaikan] dipanggil sebelum useReducer — expect: reducer lazy-init pakai profil dari
  //   context (mount pertama mungkin null sampai RPC sesi selesai; cabang null = isi form default).
  const { user } = useAuth()
  const record = opts?.record ?? null
  const editingId = record?.id ?? null
  const [state, dispatch] = useReducer(
    kunjunganReducer,
    undefined,
    () => {
      const s = initialStateForUser(user)
      const first = templates.hasilOpsi[0]
      if (first && s.hasil !== first) s.hasil = first
      return s
    },
  )
  // Sumber tunggal: repository. Tidak ada tulis-ganda lewat useLocalStorage.
  const [records, setRecords] = useState<KunjunganRecord[]>(() => {
    try {
      return getKunjunganRepository().list()
    } catch {
      return []
    }
  })
  const [fotoUploading, setFotoUploading] = useState(false)

  // Mode edit: isi form dari record yang dipilih.
  useEffect(() => {
    if (record) dispatch({ type: 'LOAD_RECORD', record })
  }, [editingId])

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

  const handleSubmit = useCallback((): KunjunganRecord | null => {
    const { ok, invalid } = validateKunjungan({ ...state, templates })
    dispatch({ type: 'SET_INVALID', invalid })
    if (!ok) {
      toast('Periksa kembali isian yang wajib diisi.')
      return null
    }
    const rec: KunjunganRecord = {
      id: editingId ?? createRecordId(),
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
    try {
      if (editingId) getKunjunganRepository().update(rec)
      else getKunjunganRepository().save(rec)
      setRecords(getKunjunganRepository().list())
    } catch (e) {
      if (e instanceof StorageQuotaError) toast(e.message)
      else toast('Gagal menyimpan. Coba lagi.')
      return null
    }
    toast(`Kunjungan ${rec.info.namaKK || 'keluarga'} tersimpan.`)
    return rec
  }, [state, templates, editingId, toast])

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' })
  }, [])

  const removeRecord = useCallback((id: string) => {
    getKunjunganRepository().remove(id)
    setRecords(getKunjunganRepository().list())
  }, [])

  return {
    templates,
    state,
    dispatch,
    records,
    fillPercent,
    bahaCount,
    stepState,
    handleSubmit,
    reset,
    removeRecord,
    addFotos,
    setFotoCaption,
    removeFoto,
    fotoUploading,
  }
}