/**
 * Penulis isi `form_field_rules`: opsi jawaban dan aturan visibility.
 *
 * Fungsi di sini sengaja TIDAK membuka transaksi sendiri. Pemanggilnya hanya
 * `build.server.ts`, yang menulis `form_fields` dan aturan ini dalam satu
 * transaksi. Kalau aturan punya transaksi sendiri, field bisa tersimpan tanpa
 * opsi padahal kode simpan jawaban sudah memanggil nama field itu.
 *
 * Modul ini internal, bukan entry point route: pemanggil dari route harus lewat
 * `buildFormVersion` supaya validasi struktur jalan.
 */
import { eq, inArray } from 'drizzle-orm'
import type { db } from '@/lib/db.server'
import { formFieldRules, formFields } from '@/lib/schema/schema'
import { validasiAturanField } from './validasi'
import type { HasilValidasi } from './validasi'
import { KesalahanValidasi } from './form-version.server'

type Db = typeof db

/** Cukup untuk insert; `tx` dari pemanggil sedikit lebih lebar dari ini. */
type Penulis = { insert: Db['insert'] }

/** Aturan visibility juga butuh select, untuk memastikan field sumber ada. */
type TxAturan = Penulis & { select: Db['select'] }

export interface OpsiInput {
  /**
   * Nilai yang disimpan di `survey_entries.value`. Wajib ada dan tidak boleh
   * kosong: `form_field_rules_option_check` menolak baris opsi tanpa nilai, dan
   * jawaban yang sudah tersimpan harus tetap bisa dicocokkan.
   */
  value: string
  /** Teks yang dilihat petugas. Kosong berarti pakai `value`. */
  label?: string | null
  urutan: number
  aktif?: boolean
}

export interface AturanInput {
  sourceFieldId: string
  operator: 'equals' | 'not_equals'
  value?: string | null
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
      tipe: 'option' as const,
      sourceFieldId: null,
      operator: null,
      value,
      label: o.label?.trim() || value,
      urutan: o.urutan,
      aktif: o.aktif ?? true,
    }
  })

  await tx.insert(formFieldRules).values(baris)
}

/**
 * Tulis aturan visibility untuk satu field, menggantikan aturan lama.
 *
 * `formVersionId` field target dibaca di sini dari `form_fields` supaya
 * pemeriksaan "field sumber harus satu versi form" di `validasiAturanField`
 * benar-benar dijalankan. Sumber yang tidak ada ditolak di backend, karena
 * aturan yang baru dibuat tidak mungkin berasal dari field yang sudah hilang.
 * Aturan yatim — sumbernya dihapus belakangan — tetap aman karena kolomnya
 * `on delete set null`.
 */
export async function sisipkanAturanVisibility(
  tx: TxAturan,
  fieldId: string,
  aturan: AturanInput[],
): Promise<void> {
  if (aturan.length === 0) return

  const [target] = await tx
    .select({ formVersionId: formFields.formVersionId })
    .from(formFields)
    .where(eq(formFields.id, fieldId))
    .limit(1)

  if (!target) {
    throw new KesalahanValidasi({
      ok: false,
      kode: 'FIELD_TIDAK_ADA',
      pesan: 'Field target aturan tidak ditemukan.',
    })
  }

  const sumberIds = [...new Set(aturan.map((a) => a.sourceFieldId))]
  const barisSumber = await tx
    .select({ id: formFields.id, formVersionId: formFields.formVersionId })
    .from(formFields)
    .where(inArray(formFields.id, sumberIds))
  const versiSumber = new Map(barisSumber.map((b) => [b.id, b.formVersionId]))

  const baris = aturan.map((a) => {
    const formVersionIdSumber = versiSumber.get(a.sourceFieldId) ?? null
    if (formVersionIdSumber === null) {
      pastikan({
        ok: false,
        kode: 'FIELD_TIDAK_ADA',
        pesan: 'Field sumber aturan tidak ditemukan.',
      })
    }
    const hasil = validasiAturanField({
      tipe: 'visibility',
      sourceFieldId: a.sourceFieldId,
      operator: a.operator,
      value: a.value ?? null,
      fieldFormVersionId: target.formVersionId,
      sourceFormVersionId: formVersionIdSumber,
    })
    pastikan(hasil)

    return {
      fieldId,
      tipe: 'visibility' as const,
      sourceFieldId: a.sourceFieldId,
      operator: a.operator,
      value: a.value ?? null,
      label: a.label?.trim() || null,
      urutan: a.urutan,
      aktif: a.aktif ?? true,
    }
  })

  await tx.insert(formFieldRules).values(baris)
}
