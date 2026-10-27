import type {
  DraftField,
  DraftSection,
} from '@/components/kelola/builder/types'

export interface TargetDataDrag {
  kind?: string
  clientId?: string
}

/**
 * Tentukan section tujuan untuk drag dari palette/template.
 *
 * Target bisa berupa section atau field (dialihkan ke section induknya).
 * Mengembalikan null jika target tidak valid/section tidak ditemukan.
 * Perilaku harus identik dengan implementasi sebelumnya.
 */
export function cariSectionTargetUntukPalette(
  targetData: TargetDataDrag,
  sections: DraftSection[],
  fields: DraftField[],
): string | null {
  let targetSection: string | null = null

  if (targetData.kind === 'section' && targetData.clientId) {
    targetSection = targetData.clientId
  } else if (targetData.kind === 'field' && targetData.clientId) {
    targetSection =
      fields.find((f) => f.clientId === targetData.clientId)?.sectionClientId ??
      null
  }

  if (!targetSection) return null
  if (!sections.some((s) => s.clientId === targetSection)) return null

  return targetSection
}
