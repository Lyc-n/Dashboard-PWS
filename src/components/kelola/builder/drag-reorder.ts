import type {
  DraftField,
  DraftSection,
} from '@/components/kelola/builder/types'

/**
 * Susun ulang field setelah operasi drag.
 *
 * Perilaku disalin persis dari `use-form-builder-draft.handleDragEnd`:
 * - bangun urutan per grup section dari hasil `move()`
 * - perbarui `sectionClientId` sesuai section tujuan
 * - tambahkan field yang tidak tercakup di hasil move di akhir (fallback)
 * - pertahankan field yatim sesuai perilaku lama
 */
export function susunUlangFieldSetelahDrag(
  sections: DraftSection[],
  fields: DraftField[],
  moved: Record<string, string[]>,
): DraftField[] {
  const byId = new Map(fields.map((f) => [f.clientId, f]))
  const seen = new Set<string>()
  const newFields: DraftField[] = []

  for (const s of sections) {
    for (const fid of moved[s.clientId] ?? []) {
      const f = byId.get(fid)
      if (f && !seen.has(fid)) {
        seen.add(fid)
        newFields.push({ ...f, sectionClientId: s.clientId })
      }
    }
  }

  for (const f of fields) {
    if (!seen.has(f.clientId)) newFields.push(f)
  }

  return newFields
}

/**
 * Susun ulang section setelah operasi drag.
 *
 * Perilaku disalin persis dari implementasi sebelumnya dengan fallback
 * append sisa jika ada id yang tidak tercakup.
 */
export function susunUlangSectionSetelahDrag(
  sections: DraftSection[],
  moved: string[],
): DraftSection[] {
  const byId = new Map(sections.map((s) => [s.clientId, s]))
  const seen = new Set<string>()
  const newSections: DraftSection[] = []

  for (const sid of moved) {
    const s = byId.get(sid)
    if (s && !seen.has(sid)) {
      seen.add(sid)
      newSections.push(s)
    }
  }

  for (const s of sections) {
    if (!seen.has(s.clientId)) newSections.push(s)
  }

  return newSections
}
