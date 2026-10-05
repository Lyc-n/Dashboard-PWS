/**
 * Layar pratinjau draft di dalam Form Builder.
 *
 * Yang dirender adalah DRAFT yang sedang diedit — bukan hasil Build dan bukan
 * versi tayang. Jadi admin bisa lihat bentuk form sebelum menyimpan ke database,
 * dan perubahan terakhir selalu langsung terlihat tanpa perlu Build dulu.
 *
 * Pratinjau ini MODE BACA. Setiap field digambar dengan komponen yang sama
 * dengan halaman isi (`DynamicField`), tapi dengan `readOnly`, jadi tidak ada
 * input yang menerima ketikan dan tidak ada jawaban yang bisa terkirim. Yang
 * tidak ikut ditampilkan: blok meta pencatatan (petugas, tanggal, warga),
 * Stepper, dan FillBar — ketiganya milik alur pengisian, bukan tampilan form.
 *
 * Field bertipe `image`/`file` tetap tampil dengan catatannya: belum ada upload,
 * dan pratinjau tidak boleh menyembunyikan fakta itu.
 */
import { useEffect, useMemo } from 'react'
import { AlertTriangle, Eye, X } from 'lucide-react'
import { Button } from '@/components/atoms/Button'
import { PageHeader, SectionCard } from '@/components/molecules'
import { DynamicField } from '@/features/survey/components/DynamicField'
import type { FieldRuntime } from '@/features/survey/services/form-runtime.server'
import type { DraftFormDocument } from '../types'
import { draftKeRuntime } from './draft-ke-runtime'

export interface PratinjauOverlayProps {
  isOpen: boolean
  document: DraftFormDocument | null
  onClose: () => void
}

/** `onChange` sekali, dibuat stabil supaya `memo` di `DynamicField` menahan render. */
function abaikanPerubahan(): void {}

export function PratinjauOverlay({
  isOpen,
  document,
  onClose,
}: PratinjauOverlayProps) {
  const definisi = useMemo(
    () => (document ? draftKeRuntime(document) : null),
    [document],
  )

  // Esc menutup pratinjau, dan halaman di belakangnya tidak ikut tergulir.
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    const overflowAwal = window.document.body.style.overflow
    window.document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      window.document.body.style.overflow = overflowAwal
      window.removeEventListener('keydown', onKey)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const sections = definisi?.sections ?? []
  const fieldYatim = definisi?.fieldYatim ?? []
  const jumlahField =
    sections.reduce((n, s) => n + s.fields.length, 0) + fieldYatim.length

  const barisField = (field: FieldRuntime) => (
    <div key={field.id} className="grid gap-1.5">
      <DynamicField
        field={field}
        value={undefined}
        onChange={abaikanPerubahan}
        readOnly
      />
    </div>
  )

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-surface"
      role="dialog"
      aria-modal="true"
      aria-label="Pratinjau form"
    >
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-line px-5 py-3">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-muted" />
          <span className="text-sm font-semibold text-ink">Pratinjau</span>
          <span className="rounded-full border border-line bg-surface-2 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
            Mode baca · belum di-Build
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted">
            {sections.length} section · {jumlahField} pertanyaan
          </span>
          <Button size="sm" variant="default" onClick={onClose}>
            <X className="w-4 h-4" /> Tutup
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-8">
        <PageHeader
          title="Pratinjau mode baca"
          description="Tampilan di bawah memakai komponen yang sama dengan halaman isi form, tapi isiannya dikunci. Petugas pencatat dan tanggal isian sengaja tidak ikut di sini: keduanya diisi sistem di luar form, bukan bagian dari pertanyaan yang kamu susun. Isi ini belum disimpan ke database — tekan Build dulu supaya pertanyaannya benar-benar bisa diisi petugas."
        />

        {fieldYatim.length > 0 ? (
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              {fieldYatim.length} pertanyaan tidak punya section, jadi tidak
              punya tempat di form yang akan tayang. Pindahkan ke section dulu.
            </span>
          </div>
        ) : null}

        {sections.length === 0 ? (
          <SectionCard title="Belum ada section aktif">
            <p className="text-[12.5px] text-muted">
              Tidak ada section aktif untuk dipratinjau. Section yang dimatikan
              tidak ikut dipratinjau — memang tidak akan tampil saat form diisi.
            </p>
          </SectionCard>
        ) : null}

        {sections.map((section, index) => (
          <SectionCard
            key={section.id}
            title={
              <span>
                {index + 1}. {section.nama}
              </span>
            }
            sub={section.deskripsi}
            bodyClassName="grid gap-3.5 sm:grid-cols-2 max-md:grid-cols-1"
          >
            {section.fields.map((field) => barisField(field))}
          </SectionCard>
        ))}

        {fieldYatim.length > 0 ? (
          <SectionCard
            title="Tidak bisa tayang"
            sub="Pertanyaan ini aktif, tapi section-nya tidak ada di draft."
            bodyClassName="grid gap-3.5 sm:grid-cols-2 max-md:grid-cols-1"
          >
            {fieldYatim.map((field) => barisField(field))}
          </SectionCard>
        ) : null}
      </div>
    </div>
  )
}
