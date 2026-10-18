/**
 * `<select>` filter kelurahan dengan opsi "Semua" + daftar KELS.
 *
 * Lima layar filter menulis markup yang sama persis (laporan x2, riwayat
 * submit, kegiatan, sasaran) label aria-nya beda-beda dan opsi duplikat;
 * ini satu tempat untuk mengubah daftar atau labelnya. Pemanggil yang
 * memfilter apa pun selain `all` memutuskan sendiri nilai kosongnya.
 */
import type { ChangeEvent } from 'react'
import { KELS } from '@/lib/constants'
import { Select } from './Select'

export interface KelurahanSelectProps {
  value: string
  /** Menerima nilai string hasil `<select>`, bukan event, supaya pemanggil tahu opsi terpilih. */
  onChange: (kel: string) => void
  /** `true` (bawaan) menampilkan opsi "Semua kelurahan" ber.Nilai `all`. */
  allowSemua?: boolean
  /** Label aksesibilitas; filter terakhir pakai "Filter kelurahan". */
  ariaLabel?: string
  className?: string
}

export function KelurahanSelect({
  value,
  onChange,
  allowSemua = true,
  ariaLabel = 'Filter kelurahan',
  className,
}: KelurahanSelectProps) {
  const set = (e: ChangeEvent<HTMLSelectElement>) => onChange(e.target.value)
  return (
    <Select
      value={value}
      onChange={set}
      aria-label={ariaLabel}
      className={className}
    >
      {allowSemua ? <option value="all">Semua kelurahan</option> : null}
      {KELS.map((k) => (
        <option key={k}>{k}</option>
      ))}
    </Select>
  )
}
