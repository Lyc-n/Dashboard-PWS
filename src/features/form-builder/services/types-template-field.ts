/**
 * Tipe katalog komponen siap pakai.
 *
 * Dipisah dari `template-field.ts` supaya `template-field.test.ts` bisa
 * mengimpor tipe tanpa ikut seluruh katalog, dan supaya tipe ini bisa dipakai
 * modul lain (palette) tanpa menarik data ke mana pun.
 */
import type { TipeField } from './validasi'

export type KelompokTemplate = 'Data warga' | 'Kategori warga' | 'Petugas & fasilitas'

export interface TemplateField {
  /**
   * Kunci stabil untuk id drag dan lookup.
   *
   * Tidak boleh berubah: `id` dipakai `handleDragEnd` untuk mencari template
   * dari sumber drag. Mengganti nilainya membuat drag lama tidak dikenali.
   */
  id: string
  /**
   * Nama teknis yang ditulis ke `form_fields.nama`. Bentuk pendek, tanpa prefix.
   *
   * Dipakai kode saat membaca isian, jadi tidak boleh berubah setelah form
   * terbit. Semua nilainya harus lolos `POLA_NAMA_FIELD` (huruf kecil, angka,
   * garis bawah).
   */
  nama: string
  /** Teks pertanyaan yang dilihat petugas. */
  label: string
  tipe: TipeField
  kelompok: KelompokTemplate
  /** Isi `form_fields.option_source_type`. null = field tanpa sumber daftar. */
  optionSourceType: string | null
  /** Isi `form_fields.option_source_key`. null kalau `optionSourceType` null. */
  optionSourceKey: string | null
  /** Petunjuk singkat di palette: apa yang terisi kalau ditarik. */
  hint: string
  /** Nama ikon di `lucide-react`, dipetakan di `BlockPalette.tsx`. */
  ikon: string
}