/**
 * Pasangan input tanggal awal/akhir filter laporan.
 *
 * Dua layar (Filter umum laporan, Riwayat Submit Form) menulis dua `<Input
 * type="date">` dengan aria-label dan max-width yang identik; pasangan ini
 * tinggal dipasang sekali, dan label/lebar bisa dikunci dari satu tempat.
 */
import { Input } from '@/components/atoms/Input'

const KELAS = 'max-w-42.5 max-md:max-w-none'

export interface DateRangeProps {
  dari: string
  sampai: string
  onDari: (v: string) => void
  onSampai: (v: string) => void
  className?: string
}

export function DateRange({
  dari,
  sampai,
  onDari,
  onSampai,
  className,
}: DateRangeProps) {
  return (
    <>
      <Input
        type="date"
        value={dari}
        onChange={(e) => onDari(e.target.value)}
        aria-label="Tanggal awal"
        className={className ?? KELAS}
      />
      <Input
        type="date"
        value={sampai}
        onChange={(e) => onSampai(e.target.value)}
        aria-label="Tanggal akhir"
        className={className ?? KELAS}
      />
    </>
  )
}
