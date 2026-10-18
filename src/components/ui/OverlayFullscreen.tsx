/**
 * Layar overlay penuh latar `bg-surface` beserta bar header-nya.
 *
 * Dulu PratinjauOverlay dan SimulasiPreview menulis markup kerangka yang sama
 * (posisi fixed latar, header kiri-kanan, badan scroll) dan juga duplikasi hook
 * Esc/scroll-lock-nya — keduanya kini tinggal isi `headerLeft`/`headerRight`
 * dan badan, sementara Esc/scroll-lock berasal dari useOverlayClose.
 */
import type { ReactNode } from 'react'
import { useOverlayClose } from '@/hooks/use-overlay-close'

export interface OverlayFullscreenProps {
  isOpen: boolean
  onClose: () => void
  /** Label dialog untuk pembaca layar. */
  ariaLabel: string
  /** Isi sisi kiri header (label + chip badge). */
  headerLeft: ReactNode
  /** Isi sisi kanan header (jumlah section, tombol aksi). */
  headerRight: ReactNode
  children: ReactNode
}

export function OverlayFullscreen({
  isOpen,
  onClose,
  ariaLabel,
  headerLeft,
  headerRight,
  children,
}: OverlayFullscreenProps) {
  useOverlayClose(isOpen, onClose)

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-surface"
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
    >
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-line px-5 py-3">
        <div className="flex items-center gap-2">{headerLeft}</div>
        <div className="flex items-center gap-2">{headerRight}</div>
      </div>
      <div className="flex-1 overflow-y-auto px-5 pb-8">{children}</div>
    </div>
  )
}

/**
 * Chip badge kecil di header overlay ("Mode baca", "Simulasi"). Satu markup
 * untuk dua overlay supaya gayanya tidak saling menarik.
 */
export function OverlayChip({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-line bg-surface-2 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
      {children}
    </span>
  )
}
