import { useCallback, useEffect, useMemo, useReducer, useState } from 'react'
import { useKunjunganRumahTemplates } from '@/hooks/use-kunjungan-rumah-templates'
import { useKunjunganRumahRecords } from '@/hooks/use-kunjungan-rumah-records'
import { useToast } from '@/providers/toast'
import { prepareFotos } from '@/features/kunjungan-rumah/lib/fotos'
import { uploadDataUrl } from '@/lib/supabase-storage'
import { validateKunjunganRumah } from '@/features/kunjungan-rumah/services/validateKunjunganRumah'
import {
  initialKunjunganRumahState,
  kunjunganRumahReducer,
} from '@/features/kunjungan-rumah/store/kunjunganRumahReducer'
import {
  selectBahaCount,
  selectFillPercent,
  selectStepState,
} from '@/features/kunjungan-rumah/store/kunjunganRumahSelectors'
import { KUNJUNGAN_RUMAH_SCHEMA_VERSION, createRecordId } from '@/features/kunjungan-rumah/types'
import type { KunjunganRumahRecord } from '@/features/kunjungan-rumah/types'
import { isAdminUser } from '@/lib/auth'
import { useAuth } from '@/providers/auth'
import type { AuthUser } from '@/lib/auth'
import type { KunjunganRumahState } from '@/features/kunjungan-rumah/store/kunjunganRumahReducer'

export interface UseKunjunganRumahFormOptions {
  /** Record yang sedang diedit. Saat diberikan, submit memperbarui record ini (bukan menambah baru). */
  record?: KunjunganRumahRecord | null
}

// [perbaikan] profil diambil dari useAuth() (cookie JWT via server), bukan getAuth() localStorage —
//   expect: tak ada lagi pembacaan sesi localStorage; dengan login PIN tunggal, profil = admin
//   jadi pra-isi kel/posy/ttd untuk kader tidak aktif (cabang admin menang), perilaku form utuh.
function initialStateForUser(user: AuthUser | null): KunjunganRumahState {
  const state = initialKunjunganRumahState()
  if (!user || isAdminUser(user)) return state
  if (user.kel) state.info.kelurahan = user.kel
  if (user.posy) state.info.posyandu = user.posy
  if (user.name) state.ttd = user.name
  return state
}

export function useKunjunganRumahForm(opts?: UseKunjunganRumahFormOptions) {
  const { templates } = useKunjunganRumahTemplates()
  const toast = useToast()
  // [perbaikan] dipanggil sebelum useReducer — expect: reducer lazy-init pakai profil dari
  //   context (mount pertama mungkin null sampai RPC sesi selesai; cabang null = isi form default).
  const { user } = useAuth()
  const record = opts?.record ?? null
  const editingId = record?.id ?? null
  const [state, dispatch] = useReducer(
    kunjunganRumahReducer,
    undefined,
    () => {
      const s = initialStateForUser(user)
      const first = templates.hasilOpsi[0]
      if (first && s.hasil !== first) s.hasil = first
      return s
    },
  )
  // Sumber tunggal: Postgres via server fn. Tanpa localStorage.
  const { records, loading: recordsLoading, error: recordsError, saveRecord, updateRecord, removeRecord: removeDbRecord } = useKunjunganRumahRecords()
  const [fotoUploading, setFotoUploading] = useState(false)
  const [saving, setSaving] = useState(false)

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

  const handleSubmit = useCallback(async (): Promise<KunjunganRumahRecord | null> => {
    const { ok, invalid } = validateKunjunganRumah({ ...state, templates })
    dispatch({ type: 'SET_INVALID', invalid })
    if (!ok) {
      toast('Periksa kembali isian yang wajib diisi.')
      return null
    }
    setSaving(true)
    try {
      // Foto ke Supabase Storage bila bucket tersedia; gagal upload → simpan inline (DB jsonb).
      const fotos = await Promise.all(
        state.fotos.map(async (f) => {
          if (f.fileUrl || !f.dataUrl) return { ...f };
          try {
            const fileUrl = await uploadDataUrl(f.dataUrl, 'kunjungan-rumah');
            const { dataUrl: _drop, ...rest } = f;
            return { ...rest, fileUrl };
          } catch {
            return { ...f };
          }
        }),
      )
      const rec: KunjunganRumahRecord = {
        id: editingId ?? createRecordId(),
        schemaVersion: KUNJUNGAN_RUMAH_SCHEMA_VERSION,
        clientId: createRecordId(),
        syncedAt: new Date().toISOString(),
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
        fotos: fotos.map((f) => ({ ...f })),
      }
      const saved = editingId ? await updateRecord(rec) : await saveRecord(rec)
      toast(`Kunjungan rumah ${rec.info.namaKK || 'keluarga'} tersimpan di database.`)
      return saved
    } catch {
      toast('Gagal menyimpan ke database. Coba lagi.')
      return null
    } finally {
      setSaving(false)
    }
  }, [state, templates, editingId, toast, saveRecord, updateRecord])

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' })
  }, [])

  const removeRecord = useCallback(async (id: string) => {
    await removeDbRecord(id)
  }, [removeDbRecord])

  return {
    templates,
    state,
    dispatch,
    records,
    recordsLoading,
    recordsError,
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
    saving,
  }
}
