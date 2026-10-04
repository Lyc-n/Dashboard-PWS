import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db.server";
import {
  formFields,
  formFieldRules,
  formSections,
  formVersions,
  forms,
} from "@/lib/schema/schema";
import { validasiFieldPenuh } from "./validasi";
import type { HasilValidasi, TipeField } from "./validasi";
import { KesalahanValidasi, assertVersiBisaDiubah } from "./form-version.server";
import { namaDenganPrefix, namaTanpaPrefix, validasiStrukturBawaan } from "../lib/kode-bawaan";
import { catatAudit } from "./audit.server";
import { sisipkanOpsi, sisipkanAturanVisibility } from "./rule.server";
import type { AturanInput, OpsiInput } from "./rule.server";
import type { BuildFormVersionInput, BuildFormVersionResult } from "@/features/kelola/components/builder/types";

function pastikan(hasil: HasilValidasi): void {
  if (!hasil.ok) throw new KesalahanValidasi(hasil);
}

type Db = typeof db;
type DbTx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type Executor = Db | DbTx;

interface SectionInput {
  clientId: string;
  id: string | null;
  parentClientId: string | null;
  nama: string;
  deskripsi: string | null;
  aktif: boolean;
}

/** Aturan dalam payload masih memakai clientId (belum jadi DB id). */
interface FieldRuleInput {
  sourceClientId: string;
  operator: "equals" | "not_equals";
  value: string | null;
  aktif: boolean;
  urutan: number;
}

interface FieldInput {
  clientId: string;
  id: string | null;
  sectionClientId: string;
  nama: string;
  label: string;
  tipe: TipeField;
  wajib: boolean;
  aktif: boolean;
  placeholder: string | null;
  deskripsi: string | null;
  jumlahKolom: number | null;
  /**
   * Sumber pilihan jawaban dari data yang sudah ada. null = admin mengetik
   * sendiri pilihannya di `opsi`. Katalog `sumber-opsi.ts` yang menentukan nilai
   * mana yang sah; `validasiFieldPenuh` menolak yang tidak dikenal.
   */
  optionSourceType: string | null;
  optionSourceKey: string | null;
  opsi: OpsiInput[];
  aturan: FieldRuleInput[];
}

/**
 * `forms.kode` untuk form pemilik sebuah versi.
 *
 * Yang menentukan apakah draft ini boleh diubah bentuknya atau tidak. `null`
 * berarti form manual: seluruh strukturnya bebas, jadi penjaga bawaan dilewati.
 */
async function ambilKodeFormVersi(executor: Executor, formVersionId: string): Promise<string | null> {
  const [baris] = await executor
    .select({ kode: forms.kode })
    .from(formVersions)
    .innerJoin(forms, eq(forms.id, formVersions.formId))
    .where(eq(formVersions.id, formVersionId))
    .limit(1);
  return baris?.kode ?? null;
}

async function loadExisting(executor: Executor, formVersionId: string) {
  const existingSections = await executor
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
    .where(eq(formSections.formVersionId, formVersionId));
  
  const existingFields = await executor
    .select({
      id: formFields.id,
      formVersionId: formFields.formVersionId,
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
    .where(eq(formFields.formVersionId, formVersionId));
  
  return { existingSections, existingFields };
}

function validateAllSections(
  sections: SectionInput[],
  _existingSectionIds: Set<string>
): HasilValidasi {
  // Duplikat dicek global dalam payload (termasuk rename), bukan hanya section baru.
  const namaMap = new Map<string, string>();

  for (const section of sections) {
    const nama = section.nama.trim();
    if (!nama) {
      return { ok: false, kode: "VERSI_TIDAK_ADA", pesan: `Section ${section.clientId}: nama wajib diisi.` };
    }

    const pemilik = namaMap.get(nama);
    if (pemilik && pemilik !== section.clientId) {
      return { ok: false, kode: "NAMA_FIELD_BENTARAK", pesan: `Nama section "${nama}" duplikat.` };
    }
    namaMap.set(nama, section.clientId);
  }

  return { ok: true };
}

function validateAllFields(
  fields: FieldInput[],
  sections: SectionInput[],
  existingFieldIds: Set<string>,
  /** Bentuk nama yang divalidasi, kalau berbeda dari yang akan disimpan ke DB. */
  normalisasiNama?: (nama: string) => string,
  /** true kalau form ini form bawaan sistem, bukan form manual. */
  bawaan = false,
): HasilValidasi {
  const fieldsBySection = new Map<string, FieldInput[]>();
  for (const f of fields) {
    const list = fieldsBySection.get(f.sectionClientId) ?? [];
    list.push(f);
    fieldsBySection.set(f.sectionClientId, list);
  }
  
  for (const [sectionClientId, sectionFields] of fieldsBySection) {
    const section = sections.find((s) => s.clientId === sectionClientId);
    if (!section) {
      return { ok: false, kode: "VERSI_TIDAK_ADA", pesan: `Section ${sectionClientId} tidak ditemukan untuk field.` };
    }
    
    const fieldDefs = sectionFields.map((f) => ({
      nama: f.nama,
      label: f.label,
      tipe: f.tipe,
      optionSourceType: f.optionSourceType,
      optionSourceKey: f.optionSourceKey,
      jumlahKolom: f.jumlahKolom,
      opsi: f.opsi.map((o) => ({ value: o.value, aktif: o.aktif })),
      hapus: false,
      // Field bawaan form sistem sudah ada di database dan tidak bisa diubah
      // admin, jadi bentuknya mengikuti aturan form asal. Field yang baru
      // ditambahkan admin tetap diperiksa penuh.
      fieldBawaan: bawaan && f.id !== null && existingFieldIds.has(f.id),
    }));
    
    const validation = validasiFieldPenuh({ fields: fieldDefs, normalisasiNama });
    if (!validation.ok) {
      return { ok: false, kode: validation.kode, pesan: `Section ${section.nama}: ${validation.pesan}` };
    }
    // Duplikat nama antar field sudah dicek validasiFieldPenuh di atas, per
    // section (termasuk rename). Tidak ada cek tambahan di sini.
  }
  
  return { ok: true };
}

function validateParentRelations(
  sections: SectionInput[],
  _formVersionId: string
): HasilValidasi {
  const clientIdToSection = new Map(sections.map((s) => [s.clientId, s]));
  
  for (const section of sections) {
    if (!section.parentClientId) continue;
    
    const parent = clientIdToSection.get(section.parentClientId);
    if (!parent) {
      return { ok: false, kode: "PARENT_BEDA_VERSI", pesan: `Section ${section.nama}: parent tidak ditemukan.` };
    }
    if (parent.clientId === section.clientId) {
      return { ok: false, kode: "PARENT_SAMA_DIRI", pesan: `Section ${section.nama}: tidak boleh parent dirinya sendiri.` };
    }
    
    let current = parent;
    while (current.parentClientId) {
      const next = clientIdToSection.get(current.parentClientId);
      if (!next) break;
      if (next.clientId === section.clientId) {
        return { ok: false, kode: "PARENT_SIKLUS", pesan: `Section ${section.nama}: siklus hierarki.` };
      }
      current = next;
    }
  }
  
  return { ok: true };
}

function validateRules(fields: FieldInput[]): HasilValidasi {
  const clientIdToField = new Map(fields.map((f) => [f.clientId, f]));
  
  for (const field of fields) {
    for (const aturan of field.aturan) {
      if (!aturan.sourceClientId) {
        return { ok: false, kode: "ATURAN_TIDAK_LENGKAP", pesan: `Field ${field.nama}: aturan tanpa sumber.` };
      }
      const source = clientIdToField.get(aturan.sourceClientId);
      if (!source) {
        return { ok: false, kode: "FIELD_TIDAK_ADA", pesan: `Field ${field.nama}: sumber aturan tidak ditemukan.` };
      }
      if (source.clientId === field.clientId) {
        return { ok: false, kode: "ATURAN_TIDAK_LENGKAP", pesan: `Field ${field.nama}: tidak boleh jadi sumber aturannya sendiri.` };
      }
    }
  }
  
  return { ok: true };
}

export async function buildFormVersion(
  input: BuildFormVersionInput,
): Promise<BuildFormVersionResult> {
  const { formVersionId, sections: sectionsInput, fields: fieldsInput, actorId } = input;
  
  await assertVersiBisaDiubah(formVersionId);
  
  const { existingSections, existingFields } = await loadExisting(db, formVersionId);
  
  const existingSectionIds = new Set(existingSections.map((s) => s.id));
  const existingFieldIds = new Set(existingFields.map((f) => f.id));
  
  const incomingSectionIds = new Set(sectionsInput.filter((s) => s.id).map((s) => s.id!));
  const incomingFieldIds = new Set(fieldsInput.filter((f) => f.id).map((f) => f.id!));
  
  const sectionsToDelete = existingSections.filter((s) => !incomingSectionIds.has(s.id));
  const fieldsToDelete = existingFields.filter((f) => !incomingFieldIds.has(f.id));
  
// `forms.kode` menentukan apakah draft ini boleh diubah bentuknya atau tidak.
  // `null` berarti form manual: seluruh strukturnya bebas.
  const formKode = await ambilKodeFormVersi(db, formVersionId);
  const bawaan = formKode !== null;

  // Nama field form bawaan disimpan ber-namespace: `<section>::<id>`. Kedua form
  // bawaan (kunjungan rumah dan kegiatan) memakai skema ini karena id field-nya
  // dipakai ulang antar section — `nama`, `nik`, `tglLahir` muncul di banyak
  // section, sementara `form_fields.nama` wajib unik per versi form.
  //
  // Pola nama field menolak `::`, jadi yang divalidasi adalah bentuk pendeknya
  // sementara yang ditulis ke database memakai namespace. Form manual tidak
  // memakai namespace sama sekali, jadi bentuk keduanya sama dan pemanggil lain
  // tidak ikut berubah.
  const normalisasiNama = bawaan ? namaTanpaPrefix : undefined;
  // Prefix ditulis sekali saja di sini: di kolom `nama`, bukan di nama section.
  // Field yang sudah ber-prefix tetap aman karena `namaTanpaPrefix` dijalankan
  // lebih dulu, jadi builds berulang tidak menambah `::` ganda.
  const namaTersimpan = (nama: string, sectionNama: string): string =>
    bawaan ? namaDenganPrefix(sectionNama, namaTanpaPrefix(nama)) : nama;

  pastikan(validateAllSections(sectionsInput, existingSectionIds));
  pastikan(validateAllFields(fieldsInput, sectionsInput, existingFieldIds, normalisasiNama, bawaan));
  pastikan(validateParentRelations(sectionsInput, formVersionId));
  pastikan(validateRules(fieldsInput));

  // Form bawaan (kunjungan rumah) bentuknya dipetakan balik ke form kader lewat
  // nama section, prefix nama field, dan bucket. Validator di atas hanya melihat
  // keabilitas editor; yang satu ini melihat apa akibatnya ke form kader.
  const sectionClientIdKeId = new Map(sectionsInput.map((s) => [s.clientId, s.id ?? null]));
  pastikan(
    validasiStrukturBawaan({
      formKode,
      sections: sectionsInput.map((s) => ({ id: s.id, nama: s.nama })),
      fields: fieldsInput.map((f) => ({
        id: f.id,
        sectionId: sectionClientIdKeId.get(f.sectionClientId) ?? null,
        nama: f.nama,
        tipe: f.tipe,
        optionSourceType: f.optionSourceType,
        optionSourceKey: f.optionSourceKey,
      })),
      sectionsLama: existingSections.map((s) => ({ id: s.id, nama: s.nama })),
      fieldsLama: existingFields.map((f) => ({
        id: f.id,
        sectionId: f.sectionId,
        nama: f.nama,
        optionSourceKey: f.optionSourceKey,
      })),
      // Aturan yang disimpan builder semuanya bertipe `visibility` (lihat
      // `sisipkanAturanVisibility`), jadi satu flag sudah cukup.
      adaAturanVisibility: fieldsInput.some((f) => f.aturan.length > 0),
    }),
  );
  
  const now = new Date();
  
  const result = await db.transaction(async (tx) => {
    // Step 1: Upsert sections level-per-level (root dulu, lalu anak).
    // Urutan input tidak bisa diandalkan untuk sarang 3+ level.
    const sectionClientIdToId = new Map<string, string>();
    const byClientId = new Map(sectionsInput.map((s) => [s.clientId, s]));
    const depthOf = (clientId: string, seen = new Set<string>()): number => {
      const s = byClientId.get(clientId);
      if (!s || !s.parentClientId) return 0;
      if (seen.has(clientId)) return 0;
      seen.add(clientId);
      if (!byClientId.has(s.parentClientId)) return 1;
      return depthOf(s.parentClientId, seen) + 1;
    };
    const ordered = [...sectionsInput].sort((a, b) => depthOf(a.clientId) - depthOf(b.clientId));

    for (const s of ordered) {
      const urutan = sectionsInput.findIndex((x) => x.clientId === s.clientId);
      let parentId: string | null = null;
      if (s.parentClientId) {
        const resolved = sectionClientIdToId.get(s.parentClientId);
        if (!resolved) {
          throw new KesalahanValidasi({ ok: false, kode: "PARENT_BEDA_VERSI", pesan: `Parent ${s.parentClientId} tidak ditemukan.` });
        }
        parentId = resolved;
      }

      const existing = s.id ? existingSections.find((es) => es.id === s.id) : undefined;
      if (existing) {
        const [updated] = await tx
          .update(formSections)
          .set({
            nama: s.nama,
            deskripsi: s.deskripsi,
            urutan,
            aktif: s.aktif,
            parentId,
            updatedAt: now,
          })
          .where(eq(formSections.id, existing.id))
          .returning({ id: formSections.id });

        if (updated) sectionClientIdToId.set(s.clientId, updated.id);
      } else {
        const [inserted] = await tx
          .insert(formSections)
          .values({
            formVersionId,
            parentId,
            nama: s.nama,
            deskripsi: s.deskripsi,
            urutan,
            aktif: s.aktif,
          })
          .returning({ id: formSections.id });

        if (inserted) sectionClientIdToId.set(s.clientId, inserted.id);
      }
    }
    
    // Verify all sections have real IDs
    for (const section of sectionsInput) {
      if (!sectionClientIdToId.has(section.clientId)) {
        throw new KesalahanValidasi({ ok: false, kode: "VERSI_TIDAK_ADA", pesan: `Section ${section.clientId} gagal disimpan.` });
      }
    }
    
    // Step 2: Upsert ALL fields with their NEW sectionId (build fieldClientId -> real DB id map)
    const fieldClientIdToId = new Map<string, string>();
    
    for (const section of sectionsInput) {
      const sectionId = sectionClientIdToId.get(section.clientId)!;
      const sectionFields = fieldsInput.filter((f) => f.sectionClientId === section.clientId);
      
      for (const [i, field] of sectionFields.entries()) {
        const existing = existingFields.find((ef) => ef.id === field.id);
        let fieldId: string;
        
        const fieldData = {
          formVersionId,
          sectionId,
          nama: namaTersimpan(field.nama, section.nama),
          label: field.label,
          tipe: field.tipe,
          // Ditulis apa adanya dari payload, bukan diturunkan dari `opsi`.
          // Versi lama menurunkan optionSourceType dari panjang `opsi` dan
          // selalu mengosongkan optionSourceKey, sehingga pilihan dari sumber
          // data yang sudah ada hilang begitu admin Build.
          optionSourceType: field.optionSourceType,
          optionSourceKey: field.optionSourceKey,
          deskripsi: field.deskripsi,
          placeholder: field.placeholder,
          wajib: field.wajib,
          urutan: i,
          jumlahKolom: field.tipe === "group" ? field.jumlahKolom : null,
          aktif: field.aktif,
          updatedAt: now,
        };
        
        if (existing) {
          const [updated] = await tx
            .update(formFields)
            .set(fieldData)
            .where(eq(formFields.id, existing.id))
            .returning({ id: formFields.id });
          
          if (!updated) {
            throw new KesalahanValidasi({ ok: false, kode: "FIELD_TIDAK_ADA", pesan: `Field ${field.nama} gagal diupdate.` });
          }
          fieldId = updated.id;
        } else {
          const [inserted] = await tx
            .insert(formFields)
            .values(fieldData)
            .returning({ id: formFields.id });
          
          if (!inserted) {
            throw new KesalahanValidasi({ ok: false, kode: "VERSI_TIDAK_ADA", pesan: `Field ${field.nama} gagal disimpan.` });
          }
          fieldId = inserted.id;
        }
        
        fieldClientIdToId.set(field.clientId, fieldId);
      }
    }
    
    // Step 3: Delete fields that are in DB but NOT in payload (truly removed, not moved)
    for (const existingField of existingFields) {
      // Check if this field exists in payload (by DB id for existing, or by clientId for new)
      const inPayload = fieldsInput.some((f) => f.id === existingField.id);
      if (!inPayload) {
        await tx.delete(formFields).where(eq(formFields.id, existingField.id));
      }
    }
    
    // Step 4: Upsert rules for all fields (options + visibility) using REAL field IDs
    for (const field of fieldsInput) {
      const fieldId = fieldClientIdToId.get(field.clientId);
      if (!fieldId) continue; // should not happen
      
      // Options
      await tx
        .delete(formFieldRules)
        .where(and(eq(formFieldRules.fieldId, fieldId), eq(formFieldRules.tipe, "option")));
      if (field.opsi.length > 0) {
        await sisipkanOpsi(tx, fieldId, field.opsi);
      }
      
      // Visibility rules - now we have REAL field IDs for all source fields
      await tx
        .delete(formFieldRules)
        .where(and(eq(formFieldRules.fieldId, fieldId), eq(formFieldRules.tipe, "visibility")));
      
      const rulesWithRealSource: AturanInput[] = [];
      for (const a of field.aturan) {
        const sourceFieldId = fieldClientIdToId.get(a.sourceClientId);
        // validateRules menjamin sumber ada; skip defensif agar tak kirim null ke DB.
        if (!sourceFieldId) continue;
        rulesWithRealSource.push({
          sourceFieldId,
          operator: a.operator,
          value: a.value,
          urutan: a.urutan,
          aktif: a.aktif,
        });
      }

      if (rulesWithRealSource.length > 0) {
        await sisipkanAturanVisibility(tx, fieldId, rulesWithRealSource);
      }
    }
    
    // Step 5: Delete sections that are being removed (cascade handles any orphaned fields)
    for (const s of sectionsToDelete) {
      await tx.delete(formSections).where(eq(formSections.id, s.id));
    }
    
    return {
      jumlahSection: sectionsInput.length,
      jumlahField: fieldsInput.length,
      jumlahDihapus: sectionsToDelete.length + fieldsToDelete.length,
    };
  });
  
  await catatAudit({
    userId: actorId ?? null,
    aksi: "update",
    entitas: "form_versions",
    entitasId: formVersionId,
    sesudah: {
      formVersionId,
      jumlahSection: result.jumlahSection,
      jumlahField: result.jumlahField,
      jumlahDihapus: result.jumlahDihapus,
    },
  });
  
  return result;
}