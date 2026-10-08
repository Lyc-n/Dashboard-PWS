import { useCallback, useState, useMemo } from 'react'
import { buildFormBuilder } from '@/lib/utils.functions'
import type { DefinisiVersi } from '@/hooks/use-form-builder'
import type {
  DraftFormDocument,
  DraftSection,
  DraftField,
  DraftOpsi,
  BuildFormVersionInput,
  SelectedItem,
  PaletteItem,
  TipeFieldEditor,
  BuildFormVersionResult,
} from '@/features/kelola/components/builder/types'
import type { DragEndEvent } from '@dnd-kit/react'
import { isSortable } from '@dnd-kit/react/sortable'
import { move } from '@dnd-kit/helpers'
import { flattenDatar } from '@/features/kelola/components/builder/tree'
import {
  SEMUA_TIPE_FIELD,
  TIPE_BUTUH_OPSI,
} from '@/features/form-builder/services/validasi'
import {
  SUMBER_SUGGEST,
  tipeBolehPakaiSumber,
} from '@/features/form-builder/services/sumber-opsi'
import {
  cariTemplate,
  presetDariTemplate,
} from '@/features/form-builder/services/template-field'
import type { PresetField } from '@/features/form-builder/services/template-field'
import { useToast } from '@/providers/toast'

function generateClientId(): string {
  return crypto.randomUUID()
}

function createEmptyOpsi(tipe: TipeFieldEditor): DraftOpsi[] {
  if (TIPE_BUTUH_OPSI.includes(tipe)) {
    return [{ clientId: generateClientId(), value: '', label: '', aktif: true }]
  }
  return []
}

/**
 * Field kosong dengan isian dari template, kalau ada.
 *
 * `preset` menimpa bagian yang diisi. Yang tidak ikut ditimpa: `wajib`, `aktif`,
 * `placeholder`, `deskripsi`. Template tidak menebak keputusan itu — itu milik
 * tiap form.
 *
 * Setiap bagian opsional karena pemanggil boleh mengisi sebagian saja: tombol
 * "+ Field" hanya butuh tipe, template mengisi semua. `opsi` tetap kosong kalau
 * preset menetapkan sumber jawaban (lihat `presetDariTemplate`) karena daftar
 * jawabannya sudah ada di enum atau di database.
 */
function createDefaultField(
  sectionClientId: string,
  preset?: Partial<PresetField>,
): DraftField {
  const tipe = preset?.tipe ?? 'text'
  return {
    id: null,
    clientId: generateClientId(),
    sectionClientId,
    nama: preset?.nama ?? '',
    label: preset?.label ?? '',
    tipe,
    wajib: false,
    aktif: true,
    placeholder: null,
    deskripsi: null,
    jumlahKolom: tipe === 'group' ? 2 : null,
    optionSourceType: preset?.optionSourceType ?? null,
    optionSourceKey: preset?.optionSourceKey ?? null,
    opsi: preset?.opsi ?? createEmptyOpsi(tipe),
  }
}

function createDefaultSection(): DraftSection {
  return {
    id: null,
    clientId: generateClientId(),
    nama: 'Section baru',
    deskripsi: null,
    aktif: true,
  }
}

function definisiToDraft(definisi: DefinisiVersi): DraftFormDocument {
  const sections: DraftSection[] = definisi.sections.map((s) => ({
    id: s.id,
    clientId: s.id,
    nama: s.nama,
    deskripsi: s.deskripsi,
    aktif: s.aktif,
  }))

  const fields: DraftField[] = definisi.sections.flatMap((section) =>
    section.fields.map((f) => ({
      id: f.id,
      clientId: f.id,
      sectionClientId: section.id,
      nama: f.nama,
      label: f.label,
      tipe: f.tipe,
      wajib: f.wajib,
      aktif: f.aktif,
      placeholder: f.placeholder,
      deskripsi: f.deskripsi,
      jumlahKolom: f.jumlahKolom,
      optionSourceType: f.optionSourceType ?? null,
      optionSourceKey: f.optionSourceKey ?? null,
      opsi: f.opsi.map((o, i) => ({
        clientId: o.id || `opsi-${f.id}-${i}`,
        value: o.value || '',
        label: o.label || '',
        aktif: o.aktif,
      })),
    })),
  )

  return { formVersionId: definisi.id, sections, fields }
}

interface UseFormBuilderDraftReturn {
  document: DraftFormDocument | null
  flatTree: ReturnType<typeof flattenDatar>
  selectedItem: SelectedItem
  setSelectedItem: (item: SelectedItem) => void
  palette: PaletteItem[]
  saving: boolean
  buildError: string | null
  loadDocument: (definisi: DefinisiVersi) => void
  clearDocument: () => void
  addSection: () => string
  deleteSection: (clientId: string) => void
  /**
   * Tambah field ke satu section.
   *
   * Tanpa `preset` hasilnya field kosong dengan tipe `text` (tombol "+ Field").
   * Dengan `preset` hasilnya template siap pakai yang langsung terisi.
   */
  addField: (sectionClientId: string, preset?: Partial<PresetField>) => string
  deleteField: (clientId: string) => void
  updateSection: (clientId: string, patch: Partial<DraftSection>) => void
  updateField: (clientId: string, patch: Partial<DraftField>) => void
  addOpsi: (fieldClientId: string) => void
  /**
   * Pasang atau lepas sumber pilihan jawaban pada satu field.
   *
   * Sumber dan opsi manual bersifat eksklusif: memilih sumber (kecuali
   * `suggest`) mengosongkan opsi manual, karena daftar yang tampil saat render
   * hanya boleh berasal dari satu tempat. `suggest` justru memakai baris `opsi`
   * yang sama sebagai daftar sarannya.
   */
  setSumberOpsi: (
    fieldClientId: string,
    type: string | null,
    key: string | null,
  ) => void
  updateOpsi: (
    fieldClientId: string,
    opsiClientId: string,
    patch: Partial<DraftOpsi>,
  ) => void
  deleteOpsi: (fieldClientId: string, opsiClientId: string) => void
  handleDragEnd: (event: DragEndEvent) => void
  buildForm: () => Promise<BuildFormVersionResult | null>
}

export function useFormBuilderDraft(): UseFormBuilderDraftReturn {
  const toast = useToast()
  const [document, setDocument] = useState<DraftFormDocument | null>(null)
  const [selectedItem, setSelectedItem] = useState<SelectedItem>(null)
  const [saving, setSaving] = useState(false)
  const [buildError, setBuildError] = useState<string | null>(null)

  const palette = useMemo<PaletteItem[]>(
    () =>
      SEMUA_TIPE_FIELD.map((t) => ({
        tipe: t,
        label: t.charAt(0).toUpperCase() + t.slice(1).replace('_', ' '),
        icon: t,
      })),
    [],
  )

  const flatTree = useMemo(
    () => (document ? flattenDatar(document.sections, document.fields) : []),
    [document],
  )

  const loadDocument = useCallback((definisi: DefinisiVersi) => {
    setDocument(definisiToDraft(definisi))
    setSelectedItem(null)
    setBuildError(null)
  }, [])

  const clearDocument = useCallback(() => {
    setDocument(null)
    setSelectedItem(null)
    setBuildError(null)
  }, [])

  const updateDocument = useCallback(
    (updater: (doc: DraftFormDocument) => DraftFormDocument) => {
      setDocument((prev) => (prev ? updater(prev) : null))
    },
    [],
  )

  const addSection = useCallback(() => {
    const clientId = generateClientId()
    updateDocument((doc) => ({
      ...doc,
      sections: [...doc.sections, { ...createDefaultSection(), clientId }],
    }))
    return clientId
  }, [updateDocument])

  const deleteSection = useCallback(
    (clientId: string) => {
      updateDocument((doc) => ({
        ...doc,
        sections: doc.sections.filter((s) => s.clientId !== clientId),
        // Field milik section yang dihapus ikut terhapus: di database keduanya
        // Cascade, jadi tidak boleh menyisakan field yatim di draft.
        fields: doc.fields.filter((f) => f.sectionClientId !== clientId),
      }))
      setSelectedItem(null)
    },
    [updateDocument],
  )

  const addField = useCallback(
    (sectionClientId: string, preset?: Partial<PresetField>) => {
      const clientId = generateClientId()
      updateDocument((doc) => ({
        ...doc,
        fields: [
          ...doc.fields,
          { ...createDefaultField(sectionClientId, preset), clientId },
        ],
      }))
      return clientId
    },
    [updateDocument],
  )

  const deleteField = useCallback(
    (clientId: string) => {
      updateDocument((doc) => ({
        ...doc,
        fields: doc.fields.filter((f) => f.clientId !== clientId),
      }))
      setSelectedItem((prev) =>
        prev?.type === 'field' && prev.clientId === clientId ? null : prev,
      )
    },
    [updateDocument],
  )

  const updateSection = useCallback(
    (clientId: string, patch: Partial<DraftSection>) => {
      updateDocument((doc) => ({
        ...doc,
        sections: doc.sections.map((s) =>
          s.clientId === clientId ? { ...s, ...patch } : s,
        ),
      }))
    },
    [updateDocument],
  )

  const updateField = useCallback(
    (clientId: string, patch: Partial<DraftField>) => {
      updateDocument((doc) => ({
        ...doc,
        fields: doc.fields.map((f) =>
          f.clientId === clientId ? { ...f, ...patch } : f,
        ),
      }))
    },
    [updateDocument],
  )

  const addOpsi = useCallback(
    (fieldClientId: string) => {
      updateDocument((doc) => ({
        ...doc,
        fields: doc.fields.map((f) =>
          f.clientId === fieldClientId
            ? {
                ...f,
                opsi: [
                  ...f.opsi,
                  {
                    clientId: generateClientId(),
                    value: '',
                    label: '',
                    aktif: true,
                  },
                ],
              }
            : f,
        ),
      }))
    },
    [updateDocument],
  )

  const updateOpsi = useCallback(
    (
      fieldClientId: string,
      opsiClientId: string,
      patch: Partial<DraftOpsi>,
    ) => {
      updateDocument((doc) => ({
        ...doc,
        fields: doc.fields.map((f) =>
          f.clientId === fieldClientId
            ? {
                ...f,
                opsi: f.opsi.map((o) =>
                  o.clientId === opsiClientId ? { ...o, ...patch } : o,
                ),
              }
            : f,
        ),
      }))
    },
    [updateDocument],
  )

  const setSumberOpsi = useCallback(
    (fieldClientId: string, type: string | null, key: string | null) => {
      updateDocument((doc) => ({
        ...doc,
        fields: doc.fields.map((f) => {
          if (f.clientId !== fieldClientId) return f

          // Sumber di luar tipe field ini (mis. `suggest` pada select) ditolak
          // di UI; di sini tetap dijaga supaya draft tidak pernah berisi
          // kombinasi yang akan ditolak server saat Build.
          const boleh = type
            ? tipeBolehPakaiSumber({ tipe: f.tipe, type, key })
            : true
          if (!boleh) return f

          const skept = type === SUMBER_SUGGEST
          return {
            ...f,
            optionSourceType: type,
            optionSourceKey: skept ? null : key,
            // Saran disimpan sebagai opsi; sumber lain menggantikan opsi manual.
            opsi: skept ? f.opsi : [],
          }
        }),
      }))
    },
    [updateDocument],
  )

  const deleteOpsi = useCallback(
    (fieldClientId: string, opsiClientId: string) => {
      updateDocument((doc) => ({
        ...doc,
        fields: doc.fields.map((f) =>
          f.clientId === fieldClientId
            ? { ...f, opsi: f.opsi.filter((o) => o.clientId !== opsiClientId) }
            : f,
        ),
      }))
    },
    [updateDocument],
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      if (event.canceled || !document) return
      const { source, target } = event.operation
      if (!source || !target) return

      const sourceId = String(source.id)
      const sourceData = source.data as {
        kind?: string
        clientId?: string
        fieldType?: TipeFieldEditor
      }
      const targetData = target.data as { kind?: string; clientId?: string }

      // Komponen palette atau template → buat field baru.
      if (sourceData.kind === 'palette' || sourceData.kind === 'template') {
        // Target bisa jadi section atau field di dalamnya. Field dialihkan ke
        // section induknya supaya komponen mendarat di section yang benar.
        let targetSection: string | null = null
        if (targetData.kind === 'section' && targetData.clientId) {
          targetSection = targetData.clientId
        } else if (targetData.kind === 'field' && targetData.clientId) {
          targetSection =
            document.fields.find((f) => f.clientId === targetData.clientId)
              ?.sectionClientId ?? null
        }
        if (
          !targetSection ||
          !document.sections.some((s) => s.clientId === targetSection)
        )
          return

        const preset =
          sourceData.kind === 'template'
            ? (() => {
                // Id drag dibaca sebagai template. Id tak dikenal diabaikan,
                // supaya drag yang gagal itu tidak pernah diam-diam membuat field
                // kosong tanpa penjelasan.
                const template = cariTemplate(sourceId)
                return template ? presetDariTemplate(template) : null
              })()
            : {
                nama: '',
                label: '',
                tipe: sourceData.fieldType ?? 'text',
                optionSourceType: null,
                optionSourceKey: null,
                opsi: [],
              }

        if (!preset) return
        const newClientId = addField(targetSection, preset)
        setSelectedItem({ type: 'field', clientId: newClientId })
        return
      }

      if (!isSortable(source)) return
      const kind =
        sourceData.kind ??
        (document.fields.some((f) => f.clientId === sourceId)
          ? 'field'
          : 'section')

      // Field → reorder / pindah section via move() per grup section.
      if (kind === 'field') {
        const groups: Record<string, string[]> = {}
        for (const f of document.fields) {
          ;(groups[f.sectionClientId] ??= []).push(f.clientId)
        }
        const moved = move(groups, event)
        const byId = new Map(document.fields.map((f) => [f.clientId, f]))
        const seen = new Set<string>()
        const newFields: DraftField[] = []
        for (const s of document.sections) {
          for (const fid of moved[s.clientId] ?? []) {
            const f = byId.get(fid)
            if (f && !seen.has(fid)) {
              seen.add(fid)
              newFields.push({ ...f, sectionClientId: s.clientId })
            }
          }
        }
        for (const f of document.fields) {
          if (!seen.has(f.clientId)) newFields.push(f)
        }
        setDocument({ ...document, fields: newFields })
        return
      }

      // Section → urutan datar di dalam satu versi form.
      const urutan = document.sections.map((s) => s.clientId)
      const moved = move({ sections: urutan }, event).sections
      const byId = new Map(document.sections.map((s) => [s.clientId, s]))
      const seen = new Set<string>()
      const newSections: DraftSection[] = []
      for (const sid of moved) {
        const s = byId.get(sid)
        if (s && !seen.has(sid)) {
          seen.add(sid)
          newSections.push(s)
        }
      }
      for (const s of document.sections) {
        if (!seen.has(s.clientId)) newSections.push(s)
      }
      setDocument({ ...document, sections: newSections })
    },
    [document, addField, setSelectedItem],
  )

  const buildForm =
    useCallback(async (): Promise<BuildFormVersionResult | null> => {
      if (!document) {
        setBuildError('Tidak ada form untuk dibangun.')
        return null
      }

      setSaving(true)
      setBuildError(null)

      try {
        const sectionsPayload = document.sections.map((s) => ({
          clientId: s.clientId,
          id: s.id,
          nama: s.nama.trim(),
          deskripsi: s.deskripsi?.trim() ?? null,
          aktif: s.aktif,
        }))

        const fieldsPayload = document.fields.map((f) => ({
          clientId: f.clientId,
          id: f.id,
          sectionClientId: f.sectionClientId,
          nama: f.nama.trim(),
          label: f.label.trim(),
          tipe: f.tipe,
          wajib: f.wajib,
          aktif: f.aktif,
          placeholder: f.placeholder?.trim() ?? null,
          deskripsi: f.deskripsi?.trim() ?? null,
          jumlahKolom: f.jumlahKolom,
          optionSourceType: f.optionSourceType,
          optionSourceKey:
            f.optionSourceType === SUMBER_SUGGEST ? null : f.optionSourceKey,
          opsi: f.opsi.map((o, idx) => ({
            value: o.value.trim(),
            label: o.label.trim() || o.value.trim(),
            urutan: idx,
            aktif: o.aktif,
          })),
        }))

        const payload: BuildFormVersionInput = {
          formVersionId: document.formVersionId,
          sections: sectionsPayload,
          fields: fieldsPayload,
          actorId: null,
        }

        const result = await buildFormBuilder({ data: payload })
        toast(
          `Form dibangun: ${result.jumlahSection} section, ${result.jumlahField} pertanyaan`,
        )
        return result
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Gagal membangun form.'
        setBuildError(msg)
        toast(msg)
        return null
      } finally {
        setSaving(false)
      }
    }, [document, toast])

  return {
    document,
    flatTree,
    selectedItem,
    setSelectedItem,
    palette,
    saving,
    buildError,
    loadDocument,
    clearDocument,
    addSection,
    deleteSection,
    addField,
    deleteField,
    updateSection,
    updateField,
    addOpsi,
    updateOpsi,
    deleteOpsi,
    setSumberOpsi,
    handleDragEnd,
    buildForm,
  }
}
