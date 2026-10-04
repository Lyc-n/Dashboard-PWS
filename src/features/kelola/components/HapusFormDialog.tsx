/**
 * Dialog hapus form dari Form Builder.
 *
 * `ConfirmModal` yang biasa dipakai tidak cukup untuk kasus ini: form yang sudah
 * pernah diisi tidak bisa dihapus lewat `DELETE FROM forms` — foreign key
 * `surveys.formVersionId` tidak meng-cascade, jadi Postgres menolaknya dengan
 * pesan yang tidak berguna untuk petugas. Karena itu dialog ini menampilkan
 * angka dulu (versi, isian, jawaban, warga, tanggal terakhir) dan, kalau ada
 * isian, mewajibkan admin mengetik nama form sebelum tombolnya aktif.
 *
 * Angka dihitung server lewat `ringkasanHapusFormBuilder` dan sudah jadi
 * keputusan di backend: dialog ini hanya menampilkan dan mengirim apa yang
 * diketik, tidak menentukan sendiri boleh atau tidaknya dihapus.
 */
import { useState } from 'react'
import { AlertTriangle, Trash2 } from 'lucide-react'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms'
import type { RingkasanHapusForm } from '@/features/form-builder/services/validasi'

interface Props {
  nama: string
  ringkasan: RingkasanHapusForm | null
  busy?: boolean
  onClose: () => void
  onConfirm: (konfirmasiNama: string | null) => void
}

function Angka({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border border-line bg-surface-2 px-2.5 py-2">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-muted">
        {label}
      </div>
      <div className="text-[15px] font-bold text-ink">{value}</div>
    </div>
  )
}

export function HapusFormDialog({
  nama,
  ringkasan,
  busy = false,
  onClose,
  onConfirm,
}: Props) {
  const [ketikan, setKetikan] = useState('')

  if (!ringkasan) return null

  const adaIsian = ringkasan.jumlahSubmit > 0
  // Konfirmasi nama dibandingkan apa adanya (kecuali spasi di tepi) supaya
  // tidak bisa lolos karena ketikan tidak sengaja sama kapitalnya.
  const namaCocok = ketikan.trim() === nama
  const bolehHapus = !adaIsian || namaCocok

  return (
    <div
      className="fixed inset-0 z-40 grid place-items-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Hapus form"
    >
      <div className="absolute inset-0 bg-black/45" onClick={onClose} />
      <div className="relative max-h-[85vh] w-full max-w-[520px] overflow-auto rounded-xl border border-line bg-surface p-4 shadow-elev">
        <div className="text-sm font-bold text-ink">Hapus form</div>
        <div className="mt-1 text-[13px] text-ink-2">
          <span className="font-semibold">{nama}</span>
        </div>

        <div className="mt-3.5 grid grid-cols-3 gap-2">
          <Angka label="Versi" value={ringkasan.jumlahVersi} />
          <Angka label="Isian" value={ringkasan.jumlahSubmit} />
          <Angka label="Jawaban" value={ringkasan.jumlahJawaban} />
          <Angka label="Lampiran" value={ringkasan.jumlahLampiran} />
          <Angka label="Warga" value={ringkasan.jumlahWarga} />
          <Angka
            label="Isian terakhir"
            value={
              ringkasan.tanggalTerakhir
                ? fmtTanggal(ringkasan.tanggalTerakhir)
                : '—'
            }
          />
        </div>

        {adaIsian ? (
          <>
            <div className="mt-3 flex items-start gap-2 rounded-lg border border-destructive bg-destructive/10 p-3 text-[12.5px] text-destructive">
              <AlertTriangle className="mt-0.5 w-4 h-4 shrink-0" />
              <span>
                {ringkasan.jumlahSubmit} isian dari{' '}
                {ringkasan.jumlahWarga || 'beberapa'} warga akan hilang permanen
                dari dashboard, laporan, tab Riwayat Submit Form, dan detail
                sasaran. Versi, section, dan pertanyaan ikut terhapus. Tindakan
                ini tidak bisa dibatalkan.
              </span>
            </div>
            <label className="mt-3 grid gap-1.5 text-[12.5px] font-semibold text-ink-2">
              Ketik nama form untuk melanjutkan
              <Input
                value={ketikan}
                onChange={(e) => setKetikan(e.target.value)}
                placeholder={nama}
                aria-label="Konfirmasi nama form"
              />
              <span className="text-[11px] font-normal text-muted">
                Nama harus sama persis.
              </span>
            </label>
          </>
        ) : (
          <p className="mt-3 text-[12.5px] text-muted">
            Form ini belum pernah diisi, jadi yang terhapus hanya versi,
            section, pertanyaan, dan opsinya.
          </p>
        )}

        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <Button onClick={onClose} disabled={busy}>
            Batal
          </Button>
          <Button
            variant="danger"
            onClick={() => onConfirm(adaIsian ? ketikan : null)}
            disabled={busy || !bolehHapus}
          >
            <Trash2 className="w-4 h-4" />
            {adaIsian ? 'Hapus permanen' : 'Hapus'}
          </Button>
        </div>
      </div>
    </div>
  )
}

/** Tanggal `YYYY-MM-DD` → `12 Mei 2026`, sama seperti format di halaman lain. */
function fmtTanggal(iso: string): string {
  const [tahun, bulan, tanggal] = iso.split('-').map((v) => Number(v))
  if (!tahun || !bulan || !tanggal) return iso
  return new Date(tahun, bulan - 1, tanggal).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}
