/**
 * Banner peringatan merah (token `destructive`).
 *
 * Tujuh tempat menyalin kelas header ini dengan margin, ikon, dan orientasi
 * yang sedikit berbeda; kalau satu warna token berubah, sisanya diam. Ikon dan
 * orientasi kini parameter, margin lewat `className` — satu tempat untuk
 * mengubah intensitas warna atau radius milik semua peringatan.
 */
import type { ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface PeringatanBoxProps {
  /** Teks peringatan; string dibungkus `<span>` agar align-nya bekerja. */
  children: ReactNode
  /** Margin posisi (mis. `mb-4`), bukan warna atau layout dalam. */
  className?: string
  /** `start` untuk teks dua baris, `center` untuk peringatan satu baris. */
  align?: 'start' | 'center'
  /** Ikon gantian; `null` menyembunyikan. Bawaan: segitiga peringatan kecil. */
  icon?: ReactNode | null
}

export function PeringatanBox({
  children,
  className,
  align = 'start',
  icon = <AlertTriangle className="mt-0.5 w-4 h-4 shrink-0" />,
}: PeringatanBoxProps) {
  return (
    <div
      className={cn(
        'flex items-start gap-2 rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive',
        align === 'center' && 'items-center',
        className,
      )}
    >
      {icon}
      {typeof children === 'string' ? <span>{children}</span> : children}
    </div>
  )
}
