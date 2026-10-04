import { eq, inArray } from 'drizzle-orm'
import { db } from '@/lib/db.server'
import { formFieldRules, formFields, formSections, formVersions, forms } from '@/lib/schema/schema'
import { KesalahanValidasi } from './form-version.server'
import { namaTanpaPrefix } from '../lib/kode-bawaan'

/** Baris `form_field_rules` bertipe 'option' yang sudah dipisah dari aturan. */
export interface OpsiDefinisiField {
  id: string
  fieldId: string
  value: string | null
  label: string | null
  urutan: number
  aktif: boolean
}

/**
 * Baris `form_field_rules` bertipe 'visibility'. `sourceFieldId` boleh null
 * kalau field sumbernya sudah dihapus, jadi editor harus menandai aturan ini
 * sendiri, bukan menganggapnya error.
 */
export interface AturanDefinisiField {
  id: string
  fieldId: string
  sourceFieldId: string | null
  operator: 'equals' | 'not_equals' | null
  value: string | null
  label: string | null
  urutan: number
  aktif: boolean
}

/**
 * Versi form beserta section, field, opsi, dan aturan visibility-nya, untuk
 * render editor.
 *
 * Field dan aturan diambil satu query per tabel memakai `inArray`, lalu
 * dikelompokkan di memori. Opsi dan aturan sama-sama tabelnya
 * (`form_field_rules`), jadi dipisah berdasarkan kolom `tipe` supaya totalnya
 * tetap empat query dan tidak N+1 per section.
 *
 * Nama field form bawaan dikembalikan dalam bentuk pendeknya. Database menyimpan
 * `<section>::<id>` supaya nama tetap unik per versi form walau id-nya dipakai
 * ulang antar section, dan bentuk itu tidak pantas tampil di form editor — admin akan
 * mengira `keluargaInfo::nik` adalah nama field yang harus diketik ulang. Prefix
 * ditambahkan kembali di `buildFormVersion` (lihat `namaTersimpan`), jadi kedua
 * arah harus berubah bersamaan.
 *
 * Form manual tidak menyentuh jalur ini: isian yang tidak ber-prefix
 * dikembalikan utuh oleh `namaTanpaPrefix`.
 */
export async function ambilDefinisiVersi(formVersionId: string) {
  const versi = await db
    .select({
      id: formVersions.id,
      formId: formVersions.formId,
      version: formVersions.version,
      status: formVersions.status,
      publishedAt: formVersions.publishedAt,
    })
    .from(formVersions)
    .where(eq(formVersions.id, formVersionId))
    .limit(1)

  if (!versi[0]) {
    throw new KesalahanValidasi({
      ok: false,
      kode: 'VERSI_TIDAK_ADA',
      pesan: 'Form versi tidak ditemukan.',
    })
  }

  // `forms.kode` menentukan apakah nama field dikembalikan dalam bentuk
  // pendek. Form manual disimpan apa adanya, jadi bentuk pendek dan bentuk
  // tersimpan sama dan jalur ini tidak berpengaruh untuk form manual.
  const [form] = await db
    .select({ kode: forms.kode })
    .from(forms)
    .where(eq(forms.id, versi[0].formId))
    .limit(1)
  const bawaan = (form?.kode ?? null) !== null
  const namaUntukEditor = (nama: string): string => (bawaan ? namaTanpaPrefix(nama) : nama)

  const sections = await db
    .select({
      id: formSections.id,
      formVersionId: formSections.formVersionId,
      parentId: formSections.parentId,
      nama: formSections.nama,
      deskripsi: formSections.deskripsi,
      urutan: formSections.urutan,
      aktif: formSections.aktif,
    })
    .from(formSections)
    .where(eq(formSections.formVersionId, formVersionId))

  // Versi tanpa section tidak punya field, jadi query field dan aturan dilewati
  // saja. `inArray` dengan daftar kosong justru tetap memindai tabel.
  if (sections.length === 0) {
    return { ...versi[0], sections: [] }
  }

  const fieldRows = await db
    .select({
      id: formFields.id,
      sectionId: formFields.sectionId,
      nama: formFields.nama,
      label: formFields.label,
      tipe: formFields.tipe,
      optionSourceType: formFields.optionSourceType,
      optionSourceKey: formFields.optionSourceKey,
      deskripsi: formFields.deskripsi,
      placeholder: formFields.placeholder,
      wajib: formFields.wajib,
      urutan: formFields.urutan,
      jumlahKolom: formFields.jumlahKolom,
      aktif: formFields.aktif,
    })
    .from(formFields)
    .where(inArray(formFields.sectionId, sections.map((s) => s.id)))
    .orderBy(formFields.urutan)

  const fieldsBySection = new Map<string, typeof fieldRows>()
  for (const baris of fieldRows) {
    const list = fieldsBySection.get(baris.sectionId)
    if (list) list.push(baris)
    else fieldsBySection.set(baris.sectionId, [baris])
  }

  if (fieldRows.length === 0) {
    return {
      ...versi[0],
      sections: sections.map((section) => ({ ...section, fields: [] })),
    }
  }

  const ruleRows = await db
    .select({
      id: formFieldRules.id,
      fieldId: formFieldRules.fieldId,
      tipe: formFieldRules.tipe,
      value: formFieldRules.value,
      label: formFieldRules.label,
      sourceFieldId: formFieldRules.sourceFieldId,
      operator: formFieldRules.operator,
      urutan: formFieldRules.urutan,
      aktif: formFieldRules.aktif,
    })
    .from(formFieldRules)
    .where(inArray(formFieldRules.fieldId, fieldRows.map((f) => f.id)))
    .orderBy(formFieldRules.urutan)

  const opsiByField = new Map<string, OpsiDefinisiField[]>()
  const aturanByField = new Map<string, AturanDefinisiField[]>()

  for (const rule of ruleRows) {
    if (rule.tipe === 'option') {
      const list = opsiByField.get(rule.fieldId)
      const opsi: OpsiDefinisiField = {
        id: rule.id,
        fieldId: rule.fieldId,
        value: rule.value,
        label: rule.label,
        urutan: rule.urutan,
        aktif: rule.aktif,
      }
      if (list) list.push(opsi)
      else opsiByField.set(rule.fieldId, [opsi])
      continue
    }

    // `formFieldRuleType` hanya punya dua nilai, jadi selain 'option' pasti
    // 'visibility'; tidak perlu guard tipe ketiga.
    const list = aturanByField.get(rule.fieldId)
    const aturan: AturanDefinisiField = {
      id: rule.id,
      fieldId: rule.fieldId,
      sourceFieldId: rule.sourceFieldId,
      operator: rule.operator,
      value: rule.value,
      label: rule.label,
      urutan: rule.urutan,
      aktif: rule.aktif,
    }
    if (list) list.push(aturan)
    else aturanByField.set(rule.fieldId, [aturan])
  }

  return {
    ...versi[0],
    sections: sections.map((section) => ({
      ...section,
      fields: (fieldsBySection.get(section.id) ?? []).map((field) => ({
        ...field,
        nama: namaUntukEditor(field.nama),
        opsi: opsiByField.get(field.id) ?? [],
        aturan: aturanByField.get(field.id) ?? [],
      })),
    })),
  }
}
