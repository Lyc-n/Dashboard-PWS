/**
 * Isi `<DragOverlay>`: kartu kecil yang mengikuti kursor saat drag.
 *
 * Kenapa perlu overlay sama sekali
 * ------------------------------
 * Tanpa overlay, dnd-kit memindahkan DOM node asli ke `document.body` selama drag
 * lalu mengembalikannya dengan `placeholder.replaceWith(...)` (lihat
 * `Feedback` di `@dnd-kit/dom`). Node itu tetap milik React, jadi begitu
 * React ikut memindahkannya — memindahkan field antar section lalu
 * menghapusnya — keduanya berebut atas node yang sama, dan React gagal dengan
 * `Node.removeChild: The node to be removed is not a child of this node`.
 *
 * Dengan overlay, dnd-kit tidak pernah menyentuh node asli. Yang mengikuti kursor
 * adalah elemen terpisah, jadi React bebas unmount kapan pun.
 *
 * Yang ditampilkan
 * ----------------
 * Ringkas saja: ikon + nama. Melampirkan seluruh isi komponen (kartu palette
 * beserta deskripsinya, baris field lengkap) membuat overlay jadi duplikat
 * besar yang menutupi tempat drop — justru hal yang paling dibutuhkan petugas
 * saat melepaskan ke section tujuan.
 */
import { ikonUntuk } from './ikon-builder'
import {
  cariTemplate,
  idDragTemplate,
} from '@/features/form-builder/services/template-field'
import { TIPE_FIELD_LABELS } from './types'
import type { DraftFormDocument } from './types'

/**
 * Bentuk `source.data` untuk empat jenis draggable di editor.
 *
 * Ditulis eksplisit, bukan `any`, supaya kalau ada `useDraggable` baru yang lupa
 * mengisi `data`, TypeScript langsung protes di file pemanggilnya.
 */
export interface DataDrag {
  kind?: 'palette' | 'template' | 'field' | 'section'
  fieldType?: keyof typeof TIPE_FIELD_LABELS
  templateId?: string
  clientId?: string
}

export interface KontenDragProps {
  /**
   * `source` dari `useDraggable`, diteruskan `DragOverlay` sebagai children.
   *
   * Tipe ditulis manual, bukan dari `@dnd-kit/dom`: library itu tidak jadi
   * dependency langsung, dan `@dnd-kit/react` tidak mengekspor ulang tipe
   * `Draggable`. `data` dideklarasikan sebagai `DataDrag` supaya isi `data`
   * tetap terkunci di satu tempat.
   */
  source: { id?: string | number; data?: DataDrag }
  /** Draft aktif, dipakai mencari nama field dan section yang sedang diseret. */
  document: DraftFormDocument | null
}

export function KontenDrag({ source, document }: KontenDragProps) {
  const { label, ikon } = ringkas(source.data, document)
  // `DragOverlay` sudah mengembalikan null saat tidak ada yang diseret, jadi
  // reaching sini berarti datanya tidak dikenal: tampilkan id-nya apa adanya
  // supaya bug kelihatan, bukan overlay kosong yang membingungkan.
  if (!label)
    return (
      <span className="text-xs text-muted">{String(source.id ?? '—')}</span>
    )

  const Icon = ikonUntuk(ikon)

  return (
    <div className="flex items-center gap-1.5 rounded-lg border border-accent-border bg-surface px-2 py-1 shadow-lg">
      <Icon className="w-3.5 h-3.5 text-accent shrink-0" strokeWidth={2} />
      <span className="text-xs font-medium text-ink">{label}</span>
    </div>
  )
}

/**
 * Nama dan ikon yang tampil di overlay.
 *
 * Mengembalikan `null` kalau nama tidak ditemukan. Untuk field dan section itu
 * berarti field/section-nya sudah terhapus saat drag berjalan — mungkin saja,
 * karena penghapusan tidak diblokir selama drag.
 */
function ringkas(
  data: DataDrag | undefined,
  document: DraftFormDocument | null,
): { label: string | null; ikon: string | undefined } {
  if (!data) return { label: null, ikon: undefined }

  switch (data.kind) {
    case 'palette':
      return {
        label: data.fieldType ? TIPE_FIELD_LABELS[data.fieldType] : null,
        ikon: data.fieldType,
      }

    case 'template': {
      // `cariTemplate` mencari dari id drag (`template-<id>`), jadi id polos
      // harus dibungkus dulu.
      const template = data.templateId
        ? cariTemplate(idDragTemplate(data.templateId))
        : null
      return { label: template?.label ?? null, ikon: template?.ikon }
    }

    case 'field': {
      const field = document?.fields.find((f) => f.clientId === data.clientId)
      if (!field) return { label: null, ikon: undefined }
      return {
        label: field.label.trim() || field.nama.trim() || null,
        ikon: field.tipe,
      }
    }

    case 'section': {
      const section = document?.sections.find(
        (s) => s.clientId === data.clientId,
      )
      return { label: section?.nama.trim() || null, ikon: 'section' }
    }

    default:
      return { label: null, ikon: undefined }
  }
}
