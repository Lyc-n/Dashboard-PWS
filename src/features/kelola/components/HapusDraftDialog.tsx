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
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/atoms/Button'
import { Angka, ModalOverlay } from '@/components/ui/ModalOverlay'
import { PeringatanBox } from '@/components/organisms'
import type { RingkasanHapusDraft } from '@/features/form-builder/services/validasi'

interface Props {
  /** Nomor versi yang akan dihapus, untuk menyebut di teks dialog. */
  version: number
  ringkasan: RingkasanHapusDraft | null
  busy?: boolean
  onClose: () => void
  onConfirm: () => void
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
    <ModalOverlay
      title={`Hapus draft v${version}`}
      ariaLabel="Hapus draft form"
      onClose={onClose}
      width="max-w-[480px]"
      footer={
        <>
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
        </>
      }
    >
      <div className="mt-3.5 grid grid-cols-2 gap-2">
        <Angka label="Section" value={ringkasan.jumlahSection} />
        <Angka label="Pertanyaan" value={ringkasan.jumlahField} />
      </div>

      {ringkasan.jumlahSubmit > 0 ? (
        <PeringatanBox className="mt-3">
          Draft ini sudah punya {ringkasan.jumlahSubmit} isian, jadi tidak bisa
          dihapus. Isian form tidak bisa ikut hilang bersama drafnya.
        </PeringatanBox>
      ) : (
        <p className="mt-3 text-[12.5px] text-muted">
          Draft ini belum pernah dipakai petugas, jadi isian yang sudah ada
          tidak tersentuh. Yang hilang cuma section, pertanyaan, dan opsinya —
          pekerjaan yang belum pernah terbit tidak bisa dipulihkan.
        </p>
      )}
    </ModalOverlay>
  )
}
