/**
 * Layar SIMULASI pengisian di dalam Form Builder.
 *
 * Berbeda dengan `PratinjauOverlay` yang mode baca, layar ini memakai komponen
 * yang sama persis dengan halaman isi (`DynamicField`) TANPA `readOnly`, jadi
 * field benar-benar bisa diketik. Gunanya untuk admin yang formnya panjang:
 * editor menampilkan daftar field sebagai baris tree yang tersusun rapat, jadi
 * sulit dibaca sebagai satu dokumen. Di sini admin bisa membaca dan mengisi
 * form seperti bentuk yang akan dilihat petugas.
 *
 * YANG TIDAK BOLEH terjadi di layar ini
 * ------------------------------------
 * Isian simulasi TIDAK PERNAH menyentuh database. Nilai hidup di state
 * komponen dan hilang saat layar ditutup. Ini bukan bug: kalau isian simulasi
 * diam-diam ikut tersimpan, admin akan mengira data uji yang mereka ketik sudah
 * jadi data kunjungan sungguhan. Menyimpan draft tetap lewat tombol Build.
 *
 * State tetap milik layar ini, bukan workspace. Yang perlu bertahan hanyalah
 * isian selama form yang sama belum diganti; effect pemuat di bawah sudah
 * menambah baris baru dan membuang isian form lama, jadianswers dari field yang
 * sekarang punya nama lain tidak ikut terbawa.
 *
 * Field dirender tanpa nilai contoh. Contoh yang dikarang justru menutupi
 * masalah yang dicari lewat simulasi — placeholder yang tidak muat, opsi yang
 * tumpang tindih, atau label yang memotong jadi dua baris.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertTriangle, RotateCcw, X } from 'lucide-react'
import { Button } from '@/components/atoms/Button'
import { PageHeader, SectionCard } from '@/components/molecules'
import { DynamicField } from '@/features/survey/components/DynamicField'
import type { FieldRuntime } from '@/features/survey/services/form-runtime.server'
import type { DraftFormDocument } from '../types'
import { draftKeRuntime } from './draft-ke-runtime'

export interface SimulasiPreviewProps {
  isOpen: boolean
  document: DraftFormDocument | null
  onClose: () => void
}

/** Peta `clientId` field ke nilai yang diketik admin selama simulasi. */
type IsianSimulasi = Record<string, unknown>

/** Kunci storage penanda draft yang sedang disimulasikan. */
const KUNCI_SIMPANAN = 'simulasiIsianByForm'

/**
 * Isian per form, bukan satu peta global.
 *
 * Admin berpindah antara form yang berbeda dan akan membuka simulasi lagi di
 * form yang sama. Satu peta global akan mengembalikan jawaban dari form lain ke
 * field yang kebetulan punya `clientId` sama — cukup untuk bikin salah paham.
 * `storage` dibaca lazy supaya modul ini tetap bisa di-import di server.
 */
function useIsianPerForm(formVersionId: string | null): {
  isian: IsianSimulasi
  setIsian: (isian: IsianSimulasi) => void
} {
  const [isian, setIsianState] = useState<IsianSimulasi>({})

  // Muat ulang setiap ganti form. `formVersionId` sengaja jadi satu-satunya
  // dependensi: efek ini harus memberi isian form yang baru, bukan ikut
  // bereaksi ke setiap ketikan.
  useEffect(() => {
    if (!formVersionId || typeof window === 'undefined') {
      setIsianState({})
      return
    }
    try {
      const mentah = window.sessionStorage.getItem(KUNCI_SIMPANAN)
      if (!mentah) return
      const semua = JSON.parse(mentah) as Record<string, IsianSimulasi>
      setIsianState(semua[formVersionId] ?? {})
    } catch {
      // sessionStorage bisa diblokir atau isinya rusak. Simulasi tidak layak
      // gagal total hanya karena isiannya tidak bisa disimpan — isi tetap jalan.
      setIsianState({})
    }
  }, [formVersionId])

  const setIsian = useMemo(
    () => (berikut: IsianSimulasi) => {
      setIsianState(berikut)
      if (!formVersionId || typeof window === 'undefined') return
      try {
        const mentah = window.sessionStorage.getItem(KUNCI_SIMPANAN)
        const semua: Record<string, IsianSimulasi> = mentah
          ? (JSON.parse(mentah) as Record<string, IsianSimulasi>)
          : {}
        semua[formVersionId] = berikut
        window.sessionStorage.setItem(KUNCI_SIMPANAN, JSON.stringify(semua))
      } catch {
        // Sama seperti di atas: kegagalan menyimpan tidak boleh menghentikan
        // simulasi, karena nilai masih ada di state.
      }
    },
    [formVersionId],
  )

  return { isian, setIsian }
}

/**
 * Apakah satu field dianggap terisi.
 *
 * Sengaja longgar: tuple satu elemen itu terisi, string kosong bukan. Tepatnya
 * tidak penting karena angka ini hanya untuk indikator progres, bukan penentu
 * validitas — server tetap satu-satunya otoritas saat data benar-benar disimpan.
 */
function terisi(nilai: unknown): boolean {
  if (nilai === null || nilai === undefined) return false
  if (typeof nilai === 'string') return nilai.trim() !== ''
  if (Array.isArray(nilai)) return nilai.length > 0
  return true
}

export function SimulasiPreview({
  isOpen,
  document,
  onClose,
}: SimulasiPreviewProps) {
  const { isian, setIsian } = useIsianPerForm(
    isOpen ? (document?.formVersionId ?? null) : null,
  )

  const definisi = useMemo(
    () => (document ? draftKeRuntime(document) : null),
    [document],
  )

  const setNilai = useCallback(
    (clientId: string, value: unknown) => {
      setIsian({ ...isian, [clientId]: value })
    },
    [isian, setIsian],
  )

  const reset = useCallback(() => setIsian({}), [setIsian])

  // Esc menutup, dan halaman di belakangnya tidak ikut tergulir.
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

  const semuaField = useMemo(
    () => [
      ...(definisi?.sections.flatMap((s) => s.fields) ?? []),
      ...(definisi?.fieldYatim ?? []),
    ],
    [definisi],
  )

  const wajibTerisi = semuaField.filter(
    (f) => f.wajib && terisi(isian[f.id]),
  ).length
  const jumlahWajib = semuaField.filter((f) => f.wajib).length

  if (!isOpen) return null

  const sections = definisi?.sections ?? []
  const fieldYatim = definisi?.fieldYatim ?? []

  const barisField = (field: FieldRuntime) => (
    <div key={field.id} className="grid gap-1.5">
      <DynamicField
        field={field}
        value={isian[field.id]}
        onChange={(v) => setNilai(field.id, v)}
      />
    </div>
  )

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-surface"
      role="dialog"
      aria-modal="true"
      aria-label="Simulasi pengisian form"
    >
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-line px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-ink">Simulasi</span>
          <span className="rounded-full border border-line bg-surface-2 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
            Isian lokal · tidak disimpan
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted">
            {sections.length} section · {semuaField.length} pertanyaan
            {jumlahWajib > 0
              ? ` · wajib terisi ${wajibTerisi}/${jumlahWajib}`
              : ''}
          </span>
          <Button size="sm" variant="ghost" onClick={reset}>
            <RotateCcw className="w-4 h-4" /> Kosongkan
          </Button>
          <Button size="sm" variant="default" onClick={onClose}>
            <X className="w-4 h-4" /> Tutup
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-8">
        <PageHeader
          title="Simulasi pengisian"
          description="Isi form di bawah seperti yang akan dilakukan petugas, untuk membaca dan mencoba alurnya. Semua isian di layar ini hanya disimpan di tab ini dan hilang saat ditutup — tidak masuk database, dan tidak menjawab pertanyaan wajib yang kosong. Kalau mau menyimpan perubahan pertanyaan, tutup dulu layar ini lalu tekan Build."
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
              Tidak ada section aktif untuk disimulasikan. Section yang
              dimatikan tidak ikut di sini — memang tidak akan tampil saat form
              diisi.
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
