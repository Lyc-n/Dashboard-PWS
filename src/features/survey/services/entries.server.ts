import { and, eq, inArray } from 'drizzle-orm'
import { db } from '@/lib/db.server'
import { formFieldRules, formFields, surveys, surveyEntries } from '@/lib/schema/schema'
import { validasiNilaiField } from '@/features/form-builder/services/validasi'
import type {HasilValidasi, TipeField} from '@/features/form-builder/services/validasi';
import { KesalahanValidasi } from '@/features/form-builder/services/form-version.server'
import { catatAudit } from '@/features/form-builder/services/audit.server'
import { resolveOpsiDinamis } from '@/features/form-builder/services/option-source.server'

/**
 * Integritas versi untuk sisi survei.
 *
 * `survey_entries` dan `survey_files` punya FK ke `form_fields` dan `surveys`
 * secara terpisah, jadi database tidak tahu apakah field yang dijawab benar
 * milik form versi milik survei tersebut. Tanpa pengecekan, petugas bisa
 * menjawab pertanyaan versi 2 pada survei yang dicatat sebagai versi 1, dan
 * rekap historis jadi salah tanpa ada yang menyadari.
 *
 * Sesuai keputusan proyek, aturan ini divalidasi di backend sebelum insert,
 * bukan lewat composite FK atau trigger.
 */

function pastikan(hasil: HasilValidasi): void {
  if (!hasil.ok) throw new KesalahanValidasi(hasil)
}

type Db = typeof db

/** Cukup untuk select; dipakai agar bisa menerima `db` maupun objek transaksi. */
type Pemilih = { select: Db['select'] }

export interface CekField {
  id: string
  formVersionId: string
  tipe: TipeField
  /**
   * Sumber opsi dinamis dari `form_fields.optionSourceType`, mis. "users" untuk
   * field Petugas. null = field pakai opsi statis dari `form_field_rules`.
   */
  optionSourceType: string | null
}

/**
 * Opsi aktif sebuah field, untuk memvalidasi pilihan jawaban.
 *
 * `value` di database nullable karena kolom yang sama dipakai aturan visibility
 * yang tidak punya nilai tersimpan. Baris dengan `value` null diabaikan di sini.
 */
async function ambilOpsi(
  executor: Pemilih,
  fieldId: string,
): Promise<{ value: string; aktif: boolean }[]> {
  const baris = await executor
    .select({ value: formFieldRules.value, aktif: formFieldRules.aktif })
    .from(formFieldRules)
    .where(and(eq(formFieldRules.fieldId, fieldId), eq(formFieldRules.tipe, 'option')))

  return baris
    .filter((b): b is { value: string; aktif: boolean } => b.value !== null)
    .map((b) => ({ value: b.value, aktif: b.aktif }))
}

/**
 * Pastikan seluruh field yang akan dijawab benar milik form versi milik survei.
 *
 * Semua field dicek dalam satu query. Kalau satu per satu, setiap field menambah
 * satu round-trip ke database, dan forms dengan ratusan field terasa lambat.
 */
export async function assertFieldMilikVersiSurvei(
  surveyId: string,
  fieldIds: readonly string[],
): Promise<Map<string, CekField>> {
  const unik = [...new Set(fieldIds)]
  if (unik.length === 0) return new Map()

  const barisSurvey = await db
    .select({ formVersionId: surveys.formVersionId })
    .from(surveys)
    .where(eq(surveys.id, surveyId))
    .limit(1)

  const survey = barisSurvey[0]
  if (!survey) {
    throw new KesalahanValidasi({
      ok: false,
      kode: 'SURVEI_TIDAK_ADA',
      pesan: 'Survei tidak ditemukan.',
    })
  }

  const ditemukan = await db
    .select({
      id: formFields.id,
      formVersionId: formFields.formVersionId,
      tipe: formFields.tipe,
      optionSourceType: formFields.optionSourceType,
    })
    .from(formFields)
    .where(inArray(formFields.id, unik))

  const peta = new Map<string, CekField>()
  for (const field of ditemukan) {
    if (field.formVersionId !== survey.formVersionId) {
      throw new KesalahanValidasi({
        ok: false,
        kode: 'FIELD_TIDAK_ADA',
        pesan: 'Field ini bukan bagian dari form versi yang dipakai survei ini.',
      })
    }
    peta.set(field.id, {
      id: field.id,
      formVersionId: field.formVersionId,
      tipe: field.tipe,
      optionSourceType: field.optionSourceType,
    })
  }

  const hilang = unik.filter((id) => !peta.has(id))
  if (hilang.length > 0) {
    throw new KesalahanValidasi({
      ok: false,
      kode: 'FIELD_TIDAK_ADA',
      pesan: `${hilang.length} field tidak ditemukan pada form versi survei ini.`,
    })
  }

  return peta
}

export interface Jawaban {
  fieldId: string
  value: unknown
}

/**
 * Simpan jawaban satu survei.
 *
 * Semua field divalidasi dulu, baru ditulis dalam satu transaksi. Kalau ada satu
 * field tidak valid, tidak ada jawaban yang tersimpan, jadi petugas tidak perlu
 * mengisi ulang form yang sudah setengah jalan.
 */
export async function simpanJawaban(params: {
  surveyId: string
  petugasId: string
  jawaban: readonly Jawaban[]
}): Promise<number> {
  const { surveyId, petugasId, jawaban } = params
  if (jawaban.length === 0) return 0

  const fields = await assertFieldMilikVersiSurvei(
    surveyId,
    jawaban.map((j) => j.fieldId),
  )

  // Opsi diambil sekali per field, bukan per jawaban, supaya field yang dijawab
  // beberapa kali tidak mengambil opsi berulang.
  //
  // Field dengan `optionSourceType` (mis. Petugas, yang opsinya adalah akun
  // `users` aktif) tidak punya baris di `form_field_rules`, jadi opsinya
  // di-resolve dari tabel tujuan. Tanpa ini, pilihan petugas yang sah akan
  // ditolak sebagai "nilai tidak cocok" hanya karena daftarnya kosong.
  const opsiPerField = new Map<string, { value: string; aktif: boolean }[]>()
  for (const fieldId of new Set(jawaban.map((j) => j.fieldId))) {
    const field = fields.get(fieldId)
    if (field?.optionSourceType) {
      const { opsi } = await resolveOpsiDinamis({ optionSourceType: field.optionSourceType })
      opsiPerField.set(fieldId, opsi.map((o) => ({ value: o.value, aktif: true })))
      continue
    }
    opsiPerField.set(fieldId, await ambilOpsi(db, fieldId))
  }

  for (const item of jawaban) {
    const field = fields.get(item.fieldId)
    if (!field) continue
    pastikan(
      validasiNilaiField({
        tipe: field.tipe,
        value: item.value,
        opsi: opsiPerField.get(item.fieldId) ?? [],
      }),
    )
  }

  const now = new Date()

  const banyak = await db.transaction(async (tx) => {
    // Upsert per baris, bukan satu insert banyak. `onConflictDoUpdate` memakai
    // satu nilai yang sama untuk semua baris yang konflik, jadi kalau dipakai
    // untuk array jawaban, semua baris akan tertimpa nilai field yang terakhir.
    for (const item of jawaban) {
      await tx
        .insert(surveyEntries)
        .values({ surveyId, fieldId: item.fieldId, value: item.value })
        .onConflictDoUpdate({
          target: [surveyEntries.surveyId, surveyEntries.fieldId],
          set: { value: item.value, updatedAt: now },
        })
    }
    return jawaban.length
  })

  await catatAudit({
    userId: petugasId,
    aksi: 'update',
    entitas: 'survey_entries',
    entitasId: surveyId,
    sesudah: { jumlahJawaban: banyak, fieldIds: jawaban.map((j) => j.fieldId) },
  })

  return banyak
}

/**
 * Lampiran punya aturan yang sama dengan jawaban: file harus menempel ke field
 * milik versi form milik survei. Batas satu file per field dijamin unique index
 * `survey_files_survey_id_field_id` di database.
 */
export async function assertFieldLampiranMilikSurvei(
  surveyId: string,
  fieldId: string,
): Promise<void> {
  await assertFieldMilikVersiSurvei(surveyId, [fieldId])
}
