import { useCallback, useEffect, useMemo, useReducer, useState } from 'react'
import { useKunjunganRumahTemplates } from '@/hooks/use-kunjungan-rumah-templates'
import { useKunjunganRumahRecords } from '@/hooks/use-kunjungan-rumah-records'
import { useToast } from '@/providers/toast'
import { prepareFotos } from '@/features/kunjungan-rumah/lib/fotos'
import { StorageUploadError, uploadDataUrl } from '@/lib/supabase-storage'
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
import {
  KUNJUNGAN_RUMAH_SCHEMA_VERSION,
  createRecordId,
} from '@/features/kunjungan-rumah/types'
import type { KunjunganRumahRecord } from '@/features/kunjungan-rumah/types'

export interface UseKunjunganRumahFormOptions {
  /** Record yang sedang diedit. Saat diberikan, submit memperbarui record ini (bukan menambah baru). */
  record?: KunjunganRumahRecord | null
}

export function useKunjunganRumahForm(opts?: UseKunjunganRumahFormOptions) {
  const { templates } = useKunjunganRumahTemplates()
  const toast = useToast()
  const record = opts?.record ?? null
  const editingId = record?.id ?? null
  const [state, dispatch] = useReducer(kunjunganRumahReducer, undefined, () => {
    const s = initialKunjunganRumahState()
    const first = templates.hasilOpsi[0]
    if (first && s.hasil !== first) s.hasil = first
    return s
  })
  // Sumber tunggal: Postgres via server fn. Tanpa localStorage.
  const {
    records,
    loading: recordsLoading,
    error: recordsError,
    saveRecord,
    updateRecord,
    removeRecord: removeDbRecord,
  } = useKunjunganRumahRecords()
  const [fotoUploading, setFotoUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Mode edit: isi form dari record yang dipilih.
  useEffect(() => {
    if (record) dispatch({ type: 'LOAD_RECORD', record })
  }, [record])

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

  const handleSubmit =
    useCallback(async (): Promise<KunjunganRumahRecord | null> => {
      const { ok, invalid } = validateKunjunganRumah({ ...state, templates })
      dispatch({ type: 'SET_INVALID', invalid })
      if (!ok) {
        toast('Periksa kembali isian yang wajib diisi.')
        return null
      }
      setSaving(true)
      try {
        // Foto ke Supabase Storage bila bucket tersedia; gagal upload → simpan inline (DB jsonb).
        // Log aman: hanya status/detail infra + ukuran/tipe. Tanpa token, secret, data warga, isi foto.
        const uploadErrors: Array<{ status: number; detail: string }> = []
        const fotos = await Promise.all(
          state.fotos.map(async (f) => {
            if (f.fileUrl || !f.dataUrl) return { ...f }
            try {
              const fileUrl = await uploadDataUrl(f.dataUrl, 'kunjungan-rumah')
              const { dataUrl: _drop, ...rest } = f
              return { ...rest, fileUrl }
            } catch (e) {
              if (e instanceof StorageUploadError) {
                uploadErrors.push({ status: e.status, detail: e.detail })
                console.error(
                  '[upload-foto]',
                  JSON.stringify({
                    bucket: e.bucket,
                    status: e.status,
                    detail: e.detail,
                    bytes: e.bytes,
                    contentType: e.contentType,
                  }),
                )
              } else {
                const detail = (
                  e instanceof Error ? e.message : String(e)
                ).slice(0, 300)
                uploadErrors.push({ status: -1, detail })
                console.error(
                  '[upload-foto]',
                  JSON.stringify({ status: -1, detail }),
                )
              }
              return { ...f }
            }
          }),
        )
        if (uploadErrors.length > 0) {
          const first = uploadErrors[0]!
          toast(
            `Upload ${uploadErrors.length} foto gagal (${first.status}): ${first.detail}. Data tetap tersimpan lokal — salin pesan ini untuk diagnosis.`,
          )
        }
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
        const saved = editingId
          ? await updateRecord(rec)
          : await saveRecord(rec)
        toast(
          `Kunjungan rumah ${rec.info.namaKK || 'keluarga'} tersimpan di database.`,
        )
        return saved
      } catch (e) {
        // [perbaikan] pesan server ikut ditampilkan — expect: validasi `data_warga`
        //   (kolom NOT NULL) dan pesan petugas yang gagal ditulis server tidak
        //   hilang, jadi user tahu bagian mana yang harus diperbaiki.
        const detail = e instanceof Error ? e.message : String(e)
        toast(`Gagal menyimpan ke database. ${detail}`.slice(0, 400))
        return null
      } finally {
        setSaving(false)
      }
    }, [state, templates, editingId, toast, saveRecord, updateRecord])

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' })
  }, [])

  const removeRecord = useCallback(
    async (id: string) => {
      await removeDbRecord(id)
    },
    [removeDbRecord],
  )

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
