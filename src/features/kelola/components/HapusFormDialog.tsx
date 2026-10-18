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
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/atoms/Button'
import { Input } from '@/components/atoms'
import { PeringatanBox } from '@/components/organisms'
import { Angka, ModalOverlay } from '@/components/ui/ModalOverlay'
import type { RingkasanHapusForm } from '@/features/form-builder/services/validasi'

interface Props {
  nama: string
  ringkasan: RingkasanHapusForm | null
  busy?: boolean
  onClose: () => void
  onConfirm: (konfirmasiNama: string | null) => void
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
    <ModalOverlay
      title="Hapus form"
      ariaLabel="Hapus form"
      onClose={onClose}
      width="max-w-[520px]"
      footer={
        <>
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
        </>
      }
    >
      <div className="mt-1 text-[13px] text-ink-2">
        <span className="font-semibold">{nama}</span>
      </div>

      <div className="mt-3.5 grid grid-cols-3 gap-2">
        <Angka label="Versi" value={ringkasan.jumlahVersi} />
        <Angka label="Isian" value={ringkasan.jumlahSubmit} />
        <Angka label="Jawaban" value={ringkasan.jumlahJawaban} />
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
          <PeringatanBox className="mt-3">
            {ringkasan.jumlahSubmit} isian dari{' '}
            {ringkasan.jumlahWarga || 'beberapa'} warga akan hilang permanen
            dari dashboard, laporan, tab Riwayat Submit Form, dan detail
            sasaran. Versi, section, dan pertanyaan ikut terhapus. Tindakan ini
            tidak bisa dibatalkan.
          </PeringatanBox>
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
          Form ini belum pernah diisi, jadi yang terhapus hanya versi, section,
          pertanyaan, dan opsinya.
        </p>
      )}
    </ModalOverlay>
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
