/**
 * Cangkang modal tengah layar: backdrop, panel, judul, dan slot footer.
 *
 * Empat modal Kelola (Admin, Confirm, HapusDraft, HapusForm) sebelumnya
 * menyalin markup backdrop/panel/label yang sama — yang kritisnya tanpa Esc
 * dan tanpa scroll-lock, dua perilaku yang sudah ada di overlay builder.
 * Semuanya kini memakai komponen ini (via useOverlayClose), jadi menambah
 * behavior aksesibilitas cukup di satu tempat. Latar yang bisa diklik untuk
 * menutup tetap bagian dari cangkang, seperti semula.
 *
 * Ukuran lebar panel diisi tiap pemanggil (max-w-120, max-w-[480px], dst)
 * karena dipilih per konten, bukan per komponen.
 */
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { useOverlayClose } from '@/hooks/use-overlay-close'

export interface ModalOverlayProps {
  /** Judul tampil di kepala panel. */
  title: ReactNode
  /** Label aksesibilitas; beda dari judul hanya untuk dialog hapus. */
  ariaLabel?: string
  onClose: () => void
  /** Kelas lebar panel, mis. `max-w-[480px]`. Bawaan lebar modal terbesar. */
  width?: string
  /** Kelas pembungkus isi (spacing, grid) milik pemanggil. */
  bodyClassName?: string
  children: ReactNode
  /** Tombol-tombol aksi; dibungkus baris flex justify-end. */
  footer?: ReactNode
}

export function ModalOverlay({
  title,
  ariaLabel,
  onClose,
  width = 'max-w-120',
  bodyClassName,
  children,
  footer,
}: ModalOverlayProps) {
  useOverlayClose(true, onClose)

  return (
    <div
      className="fixed inset-0 z-40 grid place-items-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel ?? (typeof title === 'string' ? title : undefined)}
    >
      <div className="absolute inset-0 bg-black/45" onClick={onClose} />
      <div
        className={cn(
          'relative max-h-[85vh] max-md:max-w-full w-full overflow-auto rounded-xl border border-line bg-surface p-4 shadow-elev',
          width,
        )}
      >
        <div className="text-sm font-bold text-ink">{title}</div>
        <div className={bodyClassName}>{children}</div>
        {footer ? (
          <div className="mt-4 flex flex-wrap justify-end gap-2">{footer}</div>
        ) : null}
      </div>
    </div>
  )
}

/**
 * Kartu angka kecil untuk ringkasan sebelum aksi destruktif ("Isian: 12").
 * Dulu komponen lokal dengan kelas sama ada di dua dialog hapus; dipindah ke
 * sini karena hanya modal yang memakainya.
 */
export function Angka({
  label,
  value,
}: {
  label: string
  value: number | string
}) {
  return (
    <div className="rounded-lg border border-line bg-surface-2 px-2.5 py-2">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-muted">
        {label}
      </div>
      <div className="text-[15px] font-bold text-ink">{value}</div>
    </div>
  )
}
