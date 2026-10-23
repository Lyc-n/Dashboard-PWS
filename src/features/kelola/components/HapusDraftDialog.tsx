/**
 * Dialog hapus satu versi draft dari Form Builder.
 *
 * Lebih ringan dari `HapusFormDialog`, dan itu disengaja. Draft belum pernah
 * dipakai petugas — isian hanya bisa masuk ke versi yang sudah tayang (lihat
 * `form-runtime.server.ts`), jadi tidak ada data lapangan yang hilang di sini.
 * Yang hilang cuma pekerjaan admin: pertanyaan yang belum diterbitkan.
 *
 * Karena itu dialog ini tidak mewajibkan mengetik nama. Yang ditampilkan tetap
 * jumlah section dan field supaya admin tahu sedang membuang berapa banyak
 * pekerjaan, dan supaya "Hapus" yang diklik terasa disengaja.
 *
 * Angka dikirim server lewat `ringkasanHapusDraftBuilder`, dan kelayakan hapus
 * ditegakkan ulang di `validasiHapusDraftVersi` saat penghapusan benar-benar
 * dijalankan. Dialog tidak menentukan sendiri apa yang boleh dihapus.
 */
import { AlertTriangle, Trash2 } from 'lucide-react'
import { Button } from '@/components/atoms/Button'
import type { RingkasanHapusDraft } from '@/features/form-builder/services/validasi'

interface Props {
  /** Nomor versi yang akan dihapus, untuk menyebut di teks dialog. */
  version: number
  ringkasan: RingkasanHapusDraft | null
  busy?: boolean
  onClose: () => void
  onConfirm: () => void
}

function Angka({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-line bg-surface-2 px-2.5 py-2">
      <div className="text-[10px] font-semibold uppercase tracking-wide text-muted">
        {label}
      </div>
      <div className="text-[15px] font-bold text-ink">{value}</div>
    </div>
  )
}

export function HapusDraftDialog({
  version,
  ringkasan,
  busy = false,
  onClose,
  onConfirm,
}: Props) {
  if (!ringkasan) return null

  return (
    <div
      className="fixed inset-0 z-40 grid place-items-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Hapus draft form"
    >
      <div className="absolute inset-0 bg-black/45" onClick={onClose} />
      <div className="relative max-h-[85vh] w-full max-w-[480px] overflow-auto rounded-xl border border-line bg-surface p-4 shadow-elev">
        <div className="text-sm font-bold text-ink">Hapus draft v{version}</div>

        <div className="mt-3.5 grid grid-cols-2 gap-2">
          <Angka label="Section" value={ringkasan.jumlahSection} />
          <Angka label="Pertanyaan" value={ringkasan.jumlahField} />
        </div>

        {ringkasan.jumlahSubmit > 0 ? (
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-destructive bg-destructive/10 p-3 text-[12.5px] text-destructive">
            <AlertTriangle className="mt-0.5 w-4 h-4 shrink-0" />
            <span>
              Draft ini sudah punya {ringkasan.jumlahSubmit} isian, jadi tidak
              bisa dihapus. Isian form tidak bisa ikut hilang bersama drafnya.
            </span>
          </div>
        ) : (
          <p className="mt-3 text-[12.5px] text-muted">
            Draft ini belum pernah dipakai petugas, jadi isian yang sudah ada
            tidak tersentuh. Yang hilang cuma section, pertanyaan, dan opsinya —
            pekerjaan yang belum pernah terbit tidak bisa dipulihkan.
          </p>
        )}

        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <Button onClick={onClose} disabled={busy}>
            Batal
          </Button>
          <Button
            variant="danger"
            onClick={onConfirm}
            disabled={busy || ringkasan.jumlahSubmit > 0}
          >
            <Trash2 className="w-4 h-4" /> Hapus Draft
          </Button>
        </div>
      </div>
    </div>
  )
}
