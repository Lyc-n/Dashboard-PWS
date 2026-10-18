import { useEffect } from 'react'

/**
 * Tutup overlay dengan Esc dan kunci scroll badan dokumen saat aktif.
 *
 * Dulu logika ini ditulis rangkap di PratinjauOverlay dan SimulasiPreview
 * (builder) sementara empat modal kelola tidak punya keduanya — perilaku
 * menutup jadi berbeda antar layar. Sekarang semua overlay memakai hook ini,
 * jadi Esc dan scroll-lock adalah bagian dari kontrak "overlay" repo ini.
 *
 * `isOpen=false` memasang tidak sama sekali: pemanggil boleh memanggil hook
 * tanpa syarat meski overlaynya di-render kondisional.
 */
export function useOverlayClose(isOpen: boolean, onClose: () => void) {
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    // Simpan nilai sebelumnya: overlay bisa menumpuk (dialog di atas dialog)
    // dan masing-masing hanya boleh mengembalikan kondisi awal miliknya saat
    // unmount, bukan memaksa `overflow` kosong.
    const overflowAwal = window.document.body.style.overflow
    window.document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      window.document.body.style.overflow = overflowAwal
      window.removeEventListener('keydown', onKey)
    }
  }, [isOpen, onClose])
}
