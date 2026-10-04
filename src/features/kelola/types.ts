// Tab "Prioritas" dihapus. Prioritas dan item kegiatan sekarang hanya hidup di
// `PRIOS`/`JENIS_KEGIATAN` pada `src/lib/constants.ts` dan dibaca langsung oleh
// SasaranForm, jadi tabel `admin_priorities`/`admin_items` beserta UI-nya tidak
// pernah jadi sumber kebenaran.
//
// Tab "Form Kunjungan Rumah" juga dihapus. Definisi form kunjungan rumah sekarang
// disunting lewat Form Builder seperti form lain, dan bagian yang tidak boleh
// diubah dikunci di editor (lihat `kunciEditorForm`). Catatan lama yang menyuruh
// form bawaan disunting lewat tab sendiri tidak berlaku lagi sejak form bawaan
// ikut tampil di Form Builder.
export const TABS = [
  { key: "form-builder", label: "Form Builder" },
  { key: "staff", label: "Kader" },
] as const;

export type KelolaTab = (typeof TABS)[number]["key"];