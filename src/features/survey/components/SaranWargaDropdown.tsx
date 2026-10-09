/**
 * Dropdown hasil pencarian warga.
 *
 * Dipakai tiga tempat: pencarian NIK/nama KK di Form Kunjungan Rumah, pemilih
 * warga sasaran di layar isi form generic, dan pencarian di dalam satu field
 * (`FieldCariWarga`). Semuanya satu komponen supaya baris yang tampil di
 * ketiganya benar-benar sama.
 *
 * Sifatnya yang perlu diingat:
 *   - Daftar dari `data_warga` (sudah tersimpan) dan `data_warga_import`
 *     (belum tersimpan). Baris import yang NIK-nya sudah ada di `data_warga`
 *     dibuang server supaya tidak dobel.
 *   - Memilih baris tidak otomatis mengisi apa pun. Yang terisi ditentukan
 *     pemanggil: form Kunjungan Rumah mengisi banyak field sekaligus, form
 *     generic mengisi satu field saja.
 *   - Klik di luar menutup dropdown. Komponen ini tidak pernah memvalidasi
 *     nilai: keputusan itu milik pemanggil.
 */
import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'
import type { SasaranSuggestion } from '@/features/kunjungan-rumah/lib/warga-row'

export interface SaranWargaDropdownProps {
  rows: SasaranSuggestion[]
  /** true saat query sedang jalan; teks "mencari…" yang ditampilkan. */
  busy: boolean
  onPilih: (row: SasaranSuggestion) => void
  /**
   * Dipanggil saat dropdown ditutup oleh klik di luar.
   *
   * Wajib ada: tanpa itu dropdown akan tetap menempel setelah pengguna menekan
   * Escape atau klik field lain. `onTutup` boleh tidak mengubah state apa pun
   * kalau pemanggil memang tidak butuh.
   */
  onTutup?: () => void
  /**
   * Tampilkan baris alamat di bawah NIK dan KK.
   *
   * Form Kunjungan Rumah butuh ini supaya petugas bisa membandingkan alamat
   * saat memilih warga sasaran. Form generic tidak butuh: isinya jadi lebih
   * tinggi tanpa menambah informasi yang dipakai.
   */
  tampilkanAlamat?: boolean
  /** Tampilkan kelurahan. Dipakai layar isi form generic. */
  tampilkanKelurahan?: boolean
  /** Teks saat hasil kosong. Default "Isi manual." */
  pesanKosong?: string
  /**
   * Elemen yang jadi pemicu dropdown ini (input tempat pengguna mengetik).
   *
   * Wajar diteruskan kalau dropdown punya `onTutup`: tanpa ini, `mousedown` di
   * input sendiri ikut dihitung "klik luar" dan menutup dropdown. Karena `focus`
   * tidak memicu ulang pada input yang sudah fokus, cadre harus klik field lain
   * dulu sebelum bisa buka lagi di field yang sama.
   */
  anchorRef?: RefObject<HTMLElement | null>
}

export function SaranWargaDropdown({
  rows,
  busy,
  onPilih,
  onTutup,
  tampilkanAlamat = false,
  tampilkanKelurahan = false,
  pesanKosong = 'Isi manual.',
  anchorRef,
}: SaranWargaDropdownProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!onTutup) return
    const klik = (e: MouseEvent) => {
      const target = e.target as Node | null
      if (ref.current?.contains(target)) return
      if (target && anchorRef?.current?.contains(target)) return
      onTutup()
    }
    document.addEventListener('mousedown', klik)
    return () => document.removeEventListener('mousedown', klik)
  }, [onTutup, anchorRef])

  return (
    <div
      ref={ref}
      className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-line bg-surface shadow-lg"
    >
      {busy ? (
        <p className="px-3 py-2 text-[11px] text-muted">
          Mencari data sasaran…
        </p>
      ) : null}
      {!busy && rows.length === 0 ? (
        <p className="px-3 py-2 text-[11px] text-muted">{pesanKosong}</p>
      ) : null}
      {rows.map((r) => (
        <button
          key={r.rawId}
          type="button"
          onClick={() => onPilih(r)}
          className="block w-full px-3 py-2 text-left hover:bg-[var(--color-accent-light)]"
        >
          <span className="block text-[12px] font-semibold text-ink">
            {r.namaArt || r.namaKk || '—'}
          </span>
          <span className="block text-[11px] text-muted">
            {r.nik ? `NIK ${r.nik}` : 'NIK belum ada'} · KK {r.namaKk || '—'}
            {tampilkanKelurahan && r.kelurahan ? ` · ${r.kelurahan}` : ''}
          </span>
          {tampilkanAlamat && r.alamat ? (
            <span className="block text-[11px] text-muted">{r.alamat}</span>
          ) : null}
        </button>
      ))}
    </div>
  )
}
