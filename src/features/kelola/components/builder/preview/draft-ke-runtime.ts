/**
 * Adapter dari draft editor ke bentuk yang bisa dirender `DynamicField`.
 *
 * Pratinjau membaca DRAFT yang sedang diedit, bukan baris database. Jadi bentuk
 * pratinjaunya harus mengikuti bentuk `SectionRuntime`/`FieldRuntime` yang
 * dipakai halaman isi, tanpa memanggil server dan tanpa menyentuh schema.
 *
 * Tipe diimport type-only dari `form-runtime.server.ts` supaya modul drizzle
 * tidak ikut terbawa ke bundle klien. Konsekuensinya `hitungDepth` dari sana
 * TIDAK bisa dipakai: file itu `.server.ts` dan nilai runtime-nya menarik driver
 * database. Algoritmanya ditulis ulang di bawah dengan batas rantai yang sama.
 *
 * `opsiDinamis` diisi untuk sumber yang bisa di-resolve tanpa database — yaitu
 * enum (agama, jenis kelamin, dst.) dan daftar saran. Sumber yang harus query
 * (petugas, fasilitas, distinct data warga) TIDAK bisa di-resolve di browser,
 * jadi pratinjau menandainya dengan `sumberOpsiLabel` dan membiarkan
 * `opsiDinamis` null: lebih jujur daripada menampilkan daftar tebakan.
 *
 * Blok meta pencatatan (petugas, tanggal, warga) tidak ikut, karena tidak ada
 * di dokumen draft.
 */
import type {
  AturanRuntime,
  FieldRuntime,
  OpsiDinamisRuntime,
  OpsiRuntime,
  SectionRuntime,
} from '@/features/survey/services/form-runtime.server'
import type {
  DraftAturan,
  DraftField,
  DraftFormDocument,
  DraftOpsi,
  DraftSection,
} from '../types'
import { SUMBER_SUGGEST, cariSumber, nilaiEnum } from '@/features/form-builder/services/sumber-opsi'

/** Batas rantai parent, sama dengan `MAX_DEPTH` di service server. */
const MAX_DEPTH = 5

export interface DefinisiPratinjau {
  sections: SectionRuntime[]
  /**
   * Field yang section-nya tidak ada di draft. Tidak dirender sebagai section
   * (tidak punya tempat), tapi dikembalikan supaya pratinjau bisa
   * menampilkannya terpisah dan admin tahu field itu tidak akan tayang.
   */
  fieldYatim: FieldRuntime[]
}

/**
 * Kedalaman setiap section dari `parentClientId`.
 *
 * Rantai dihentikan di `MAX_DEPTH` dan saat id yang sama muncul dua kali, supaya
 * draft rusak (parent hilang, atau siklus dari drag-drop) menghasilkan angka yang
 * bisa dirender, bukan loop tak berujung.
 */
export function hitungDepthClient(
  sections: readonly DraftSection[],
): Map<string, number> {
  const parentOf = new Map(sections.map((s) => [s.clientId, s.parentClientId]))
  const depth = new Map<string, number>()

  for (const section of sections) {
    let nilai = 0
    let kursor = section.parentClientId
    const sudahDilihat = new Set<string>()

    while (
      kursor !== null &&
      nilai < MAX_DEPTH &&
      parentOf.has(kursor) &&
      !sudahDilihat.has(kursor)
    ) {
      sudahDilihat.add(kursor)
      nilai += 1
      kursor = parentOf.get(kursor) ?? null
    }

    depth.set(section.clientId, nilai)
  }

  return depth
}

function opsiKeRuntime(opsi: readonly DraftOpsi[]): OpsiRuntime[] {
  return opsi.map((o, urutan) => ({
    value: o.value.trim(),
    label: o.label.trim() || o.value.trim(),
    urutan,
    aktif: o.aktif,
  }))
}

/** `sourceClientId` menunjuk field di draft, jadi id itu yang dibawa. */
function aturanKeRuntime(aturan: readonly DraftAturan[]): AturanRuntime[] {
  return aturan.map((a, urutan) => ({
    id: a.clientId,
    sourceFieldId: a.sourceClientId,
    operator: a.operator,
    value: a.value.trim() || null,
    label: null,
    urutan,
    aktif: a.aktif,
  }))
}

/**
 * Pilihan jawaban yang bisa ditampilkan tanpa menyentuh database.
 *
 * Null kalau sumbernya butuh query server — lihat catatan di atas.
 */
function opsiLokal(field: DraftField): OpsiDinamisRuntime[] | null {
  if (!field.optionSourceType) return null

  if (field.optionSourceType === SUMBER_SUGGEST) {
    return opsiKeRuntime(field.opsi).map((o) => ({
      value: o.value,
      label: o.label ?? o.value,
    }))
  }

  const source = cariSumber(field.optionSourceType, field.optionSourceKey)
  if (!source || source.perluServer) return null

  const nilai = nilaiEnum(source.key)
  if (!nilai) return null

  return nilai.map((v, i) => ({ value: v, label: v, urutan: i }))
}

/**
 * Satu field draft → `FieldRuntime`.
 *
 * `id` memakai `clientId` supaya tetap unik walau `nama` kosong, dan anchor
 * `fieldAnchorId` yang dipakai `DynamicField` tetap menunjuk satu tempat.
 * `nama` tidak pernah ditampilkan halaman isi, jadi tidak dikarang di sini.
 */
export function fieldKeRuntime(
  field: DraftField,
  urutan: number,
): FieldRuntime {
  return {
    id: field.clientId,
    nama: field.nama.trim(),
    label: field.label.trim() || field.nama.trim() || '(tanpa label)',
    tipe: field.tipe,
    deskripsi: field.deskripsi?.trim() ?? null,
    placeholder: field.placeholder?.trim() ?? null,
    wajib: field.wajib,
    urutan,
    jumlahKolom: field.jumlahKolom,
    aktif: field.aktif,
    opsi: opsiKeRuntime(field.opsi),
    opsiDinamis: opsiLokal(field),
    // Sumber yang butuh query tidak boleh ditandai "tidak dikenali": daftarnya
    // memang belum diambil, bukan salah konfigurasi.
    sumberOpsiTidakDikenali: false,
    sumberOpsiLabel: cariSumber(field.optionSourceType, field.optionSourceKey)?.label ?? null,
    saran:
      field.optionSourceType === SUMBER_SUGGEST
        ? opsiKeRuntime(field.opsi).map((o) => o.label ?? o.value)
        : [],
    aturan: aturanKeRuntime(field.aturan),
  }
}

/**
 * Susun definisi pratinjau dari dokumen draft.
 *
 * Section dan field nonaktif dibuang, sama seperti `muatDefinisiRuntime` di
 * service server: yang nonaktif memang tidak akan tampil saat diisi. Section
 * yatim (parent-nya menunjuk id yang tidak ada) tetap dirender sebagai root,
 * sama seperti `flattenTree` di editor.
 */
export function draftKeRuntime(document: DraftFormDocument): DefinisiPratinjau {
  const sectionsAktif = document.sections.filter((s) => s.aktif)
  const idsSectionAktif = new Set(sectionsAktif.map((s) => s.clientId))
  const idsSectionAda = new Set(document.sections.map((s) => s.clientId))

  // `depth` dihitung dari semua section, bukan hanya yang aktif: anak yang aktif
  // tetap perlu tahu levelnya kalau parent-nya sedang dimatikan.
  const depth = hitungDepthClient(document.sections)

  const fieldsAktif = document.fields.filter(
    (f) => f.aktif && idsSectionAktif.has(f.sectionClientId),
  )

  const sections: SectionRuntime[] = sectionsAktif.map((s, urutan) => {
    const yatim =
      s.parentClientId !== null && !idsSectionAda.has(s.parentClientId)
    const fields = fieldsAktif
      .filter((f) => f.sectionClientId === s.clientId)
      .map((f, i) => fieldKeRuntime(f, i))

    return {
      id: s.clientId,
      nama: s.nama.trim() || '(section tanpa nama)',
      deskripsi: s.deskripsi?.trim() ?? null,
      urutan,
      parentId: yatim ? null : s.parentClientId,
      depth: depth.get(s.clientId) ?? 0,
      fields,
    }
  })

  const fieldYatim = document.fields
    .filter((f) => f.aktif && !idsSectionAda.has(f.sectionClientId))
    .map((f, urutan) => fieldKeRuntime(f, urutan))

  return { sections, fieldYatim }
}
