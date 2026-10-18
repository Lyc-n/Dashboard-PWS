/**
 * Bar aksi Simpan yang dipakai footer SectionCard "Simpan" tiga layar isian
 * (kunjungan rumah, form generik, kegiatan).
 *
 * Promo dari features/kunjungan-rumah setelah FormulirScene dan kegiatan
 * terbukti menyalin markupnya dengan label tombol berbeda. `submitLabel`
 * wajib karena tiga pemanggil itu menamai tombolnya sendiri (biasanya berubah
 * jadi "Menyimpan…" saat busy); `children` untuk tombol ekstra di kiri Reset.
 */
import type { ReactNode } from 'react'
import { Button } from '@/components/atoms'
import { Toolbar } from '@/components/molecules/Toolbar'

export interface SaveBarProps {
  onReset: () => void
  onSubmit: () => void
  disabled?: boolean
  /** Label tombol simpan; biasanya berubah jadi "Menyimpan…" saat busy. */
  submitLabel: ReactNode
  children?: ReactNode
}

export function SaveBar({
  onReset,
  onSubmit,
  disabled,
  submitLabel,
  children,
}: SaveBarProps) {
  return (
    <Toolbar className="w-full">
      <span className="ml-auto text-xs text-muted">Simpan ke database.</span>
      <Button variant="default" onClick={onReset} disabled={disabled}>
        Reset
      </Button>
      {children}
      <Button variant="primary" onClick={onSubmit} disabled={disabled}>
        {submitLabel}
      </Button>{' '}
    </Toolbar>
  )
}
