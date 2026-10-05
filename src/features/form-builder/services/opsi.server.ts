/**
 * Penulis isi `form_field_options`: pilihan jawaban untuk setiap field.
 *
 * Fungsi di sini sengaja TIDAK membuka transaksi sendiri. Pemanggilnya hanya
 * `build.server.ts`, yang menulis `form_fields` dan opsi ini dalam satu
 * transaksi. Kalau opsi punya transaksi sendiri, field bisa tersimpan tanpa
 * opsi padahal kode simpan jawaban sudah memanggil nama field itu.
 *
 * Modul ini internal, bukan entry point route: pemanggil dari route harus lewat
 * `buildFormVersion` supaya validasi struktur jalan.
 */
import type { db } from '@/lib/db.server'
import { formFieldOptions } from '@/lib/schema/schema'
import type { HasilValidasi } from './validasi'
import { KesalahanValidasi } from './form-version.server'

type Db = typeof db

/** Cukup untuk insert; `tx` dari pemanggil sedikit lebih lebar dari ini. */
type Penulis = { insert: Db['insert'] }

export interface OpsiInput {
  /**
   * Nilai yang disimpan di `survey_entries.value`. Wajib ada dan tidak boleh
   * kosong: kolom `value` di `form_field_options` NOT NULL, dan jawaban yang
   * sudah tersimpan harus tetap bisa dicocokkan.
   */
  value: string
  /** Teks yang dilihat petugas. Kosong berarti pakai `value`. */
  label?: string | null
  urutan: number
  aktif?: boolean
}

function pastikan(hasil: HasilValidasi): void {
  if (!hasil.ok) throw new KesalahanValidasi(hasil)
}

/**
 * Tulis opsi jawaban untuk satu field. Opsi lama dihapus pemanggil
 * (`build.server.ts`) sebelum fungsi ini dipanggil, jadi tidak ada nilai lama
 * yang tertinggal di tabel.
 */
export async function sisipkanOpsi(
  tx: Penulis,
  fieldId: string,
  opsi: OpsiInput[],
): Promise<void> {
  if (opsi.length === 0) return

  const baris = opsi.map((o) => {
    const value = o.value.trim()
    if (value === '') {
      pastikan({
        ok: false,
        kode: 'OPSI_FIELD_KOSONG',
        pesan: 'Nilai opsi jawaban wajib diisi.',
      })
    }
    return {
      fieldId,
      value,
      label: o.label?.trim() || value,
      urutan: o.urutan,
      aktif: o.aktif ?? true,
    }
  })

  await tx.insert(formFieldOptions).values(baris)
}
