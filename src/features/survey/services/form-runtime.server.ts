/**
 * Runtime form generik: baca definisi form yang tayang, lalu simpan isiannya.
 *
 * PEMISAHAN DENGAN FORM BUILDER
 * ----------------------------
 * Builder (define + publish) memegang hak tulis atas `forms`, `form_versions`,
 * `form_sections`, `form_fields`, dan `form_field_rules`. File ini tidak pernah
 * menulis ke tabel-tabel itu — semuanya hanya `SELECT`. Satu-satunya tabel yang
 * ditulis runtime adalah `surveys` + `survey_entries`.
 *
 * Kenapa hanya versi `published` yang boleh dibaca: `surveys` menyimpan
 * `formVersionId` dan `survey_entries` menyimpan `fieldId`, jadi jawaban lama
 * harus tetap punya arti. Kalau draft ikut dibaca, satu field bisa punya dua
 * bentuk berbeda tergantung versi yang dipakai petugas, dan rekap historis jadi
 * salah tanpa ada yang menyadari. Ini bedrock dari arsitektur define/publish
 * di proyek ini, makanya penjaganya di dalam resolver, bukan di pemanggil.
 *
 * CATATAN SOAL FIELD `image` dan `file`: keduanya BELUM didukung fase ini.
 * Lampirannya hidup di `survey_files`, bukan `survey_entries`, jadi di sini
 * keduanya tetap dikembalikan sebagai field biasa (klien menampilkannya sebagai
 * "belum didukung") dan jawaban untuk field itu ditolak dengan pesan yang
 * terbaca. Tidak ada penanganan file yang dikarang di sini supaya tidak ada
 * jalur penyimpanan yang setengah jadi.
 */
import { and, asc, eq, inArray, sql } from 'drizzle-orm'
import { db } from '@/lib/db.server'
import {
  dataWargaTable,
  formFields,
  formFieldRules,
  formSections,
  formVersions,
  forms,
  surveys,
  surveyEntries,
} from '@/lib/schema/schema'
import {
  validasiNilaiField,
  validasiNilaiOpsiTerpilih,
  validasiNik,
} from '@/features/form-builder/services/validasi'
import type { HasilValidasi, TipeField } from '@/features/form-builder/services/validasi'
import { KesalahanValidasi } from '@/features/form-builder/services/form-version.server'
import { resolveOpsiDinamis } from '@/features/form-builder/services/option-source.server'
import { catatAudit } from '@/features/form-builder/services/audit.server'
import { pastikanPetugasValid } from '@/lib/user-registry.server'

type Db = typeof db
/** Handle transaksi dari `db.transaction(...)`, sama seperti form-version.server. */
type DbTx = Parameters<Parameters<typeof db.transaction>[0]>[0]
/**
 * Kueri boleh jalan di koneksi biasa (`db`) atau di transaksi yang sedang
 * berjalan. Resolver ini menerima executor supaya pemanggilnya (halaman isi
 * dan penyimpanan) memakai satu jalur kode yang sama.
 */
type Executor = Db | DbTx

/**
 * Batas atas kedalaman section. Sama alasannya dengan `section.server.ts`:
 * `form_sections.parentId` hanya FK ke id, jadi rantai ancestor bisa berputar
 * kalau datanya rusak, dan perhitungannya tidak boleh berjalan tanpa henti.
 */
const MAX_DEPTH = 20

/** Field yang jawabannya berupa daftar, jadi keanggotaannya diperiksa terpisah. */
const TIPE_LAMPIRAN: readonly TipeField[] = ['image', 'file']

function pastikan(hasil: HasilValidasi): void {
  if (!hasil.ok) throw new KesalahanValidasi(hasil)
}

function tolak(kode: Extract<HasilValidasi, { ok: false }>['kode'], pesan: string): never {
  throw new KesalahanValidasi({ ok: false, kode, pesan })
}

// ---------------------------------------------------------------------------
// Daftar form yang bisa diisi
// ---------------------------------------------------------------------------

export interface BarisFormulirTerisi {
  formId: number
  nama: string
  deskripsi: string | null
  /** true = tiap isian wajib menunjuk satu warga di `surveys.wargaNik`. */
  subjekWargaWajib: boolean
  formVersionId: string
  version: number
  publishedAt: Date | null
  /** Section aktif pada versi tayang; form tanpa section tidak ditampilkan. */
  jumlahSection: number
  /** Field aktif pada section aktif, untuk indeks form yang panjang. */
  jumlahField: number
}

/**
 * Daftar form yang sedang bisa diisi petugas.
 *
 * Hanya form aktif yang punya versi `published`, jadi daftar ini persis
 * "form yang tayang". Partial unique index `form_versions_one_published_per_form`
 * menjamin paling banyak satu baris per form, tidak perlu `distinct` atau
 * agregasi per form.
 *
 * Jumlah section dan field dihitung dengan dua query terelompok, bukan satu
 * query per form: Kunjungan Rumah punya belasan section dan ratusan field, dan
 * N+1 di daftar ini berartiofficer menunggu satu round-trip per form.
 */
export async function daftarFormulirTerisi(): Promise<BarisFormulirTerisi[]> {
  const baris = await db
    .select({
      formId: forms.id,
      nama: forms.nama,
      deskripsi: forms.deskripsi,
      subjekWargaWajib: forms.subjekWargaWajib,
      formVersionId: formVersions.id,
      version: formVersions.version,
      publishedAt: formVersions.publishedAt,
    })
    .from(forms)
    .innerJoin(formVersions, eq(formVersions.formId, forms.id))
    .where(and(eq(formVersions.status, 'published'), eq(forms.aktif, true)))
    .orderBy(asc(forms.nama))

  if (baris.length === 0) return []

  const versiIds = baris.map((b) => b.formVersionId)

  const hitungSection = await db
    .select({
      formVersionId: formSections.formVersionId,
      total: sql<number>`count(*)`,
    })
    .from(formSections)
    .where(
      and(inArray(formSections.formVersionId, versiIds), eq(formSections.aktif, true)),
    )
    .groupBy(formSections.formVersionId)

  // Field dihitung lewat join ke section supaya field di section nonaktif tidak
  // ikut terhitung; jumlahnya harus sama dengan yang benar-benar dirender.
  const hitungField = await db
    .select({
      formVersionId: formFields.formVersionId,
      total: sql<number>`count(*)`,
    })
    .from(formFields)
    .innerJoin(formSections, eq(formFields.sectionId, formSections.id))
    .where(
      and(
        inArray(formFields.formVersionId, versiIds),
        eq(formFields.aktif, true),
        eq(formSections.aktif, true),
      ),
    )
    .groupBy(formFields.formVersionId)

  const totalSection = new Map(hitungSection.map((b) => [b.formVersionId, b.total]))
  const totalField = new Map(hitungField.map((b) => [b.formVersionId, b.total]))

  return baris.map((b) => ({
    ...b,
    jumlahSection: totalSection.get(b.formVersionId) ?? 0,
    jumlahField: totalField.get(b.formVersionId) ?? 0,
  }))
}

// ---------------------------------------------------------------------------
// Definisi runtime untuk halaman isi
// ---------------------------------------------------------------------------

/** Opsi statis dari `form_field_rules` bertipe 'option' dengan `value` terisi. */
export interface OpsiRuntime {
  value: string
  label: string | null
  urutan: number
  aktif: boolean
}

/** Opsi hasil resolver sumber dinamis, mis. daftar petugas dari `users`. */
export interface OpsiDinamisRuntime {
  value: string
  label: string
}

/** Aturan visibility. `sourceFieldId` null berarti sumbernya sudah dihapus. */
export interface AturanRuntime {
  id: string
  sourceFieldId: string | null
  operator: 'equals' | 'not_equals' | null
  value: string | null
  label: string | null
  urutan: number
  aktif: boolean
}

export interface FieldRuntime {
  id: string
  /** Identifier teknis; kode tidak memakainya, jadi opsional bagi petugas. */
  nama: string
  label: string
  tipe: TipeField
  deskripsi: string | null
  placeholder: string | null
  wajib: boolean
  urutan: number
  /** Hanya untuk tipe `group`; null untuk tipe lain. */
  jumlahKolom: number | null
  aktif: boolean
  opsi: OpsiRuntime[]
  /**
   * null = field memakai opsi statis. Array (bisa kosong) = opsinya dibaca dari
   * sumber lain saat render, jadi ikut berubah bersama datanya.
   */
  opsiDinamis: OpsiDinamisRuntime[] | null
  /** Sumber opsi dinamis tidak dikenali atau hasil resolvernya kosong. */
  sumberOpsiTidakDikenali: boolean
  /** Label sumber untuk ditampilkan di layar isi, mis. "Agama". null = opsi manual. */
  sumberOpsiLabel: string | null
  /**
   * Daftar saran auto-complete. Hanya terisi untuk sumber `suggest` pada field
   * teks, dan TIDAK membatasi jawaban: petugas boleh mengetik nilai lain.
   */
  saran: string[]
  aturan: AturanRuntime[]
}

export interface SectionRuntime {
  id: string
  nama: string
  deskripsi: string | null
  urutan: number
  parentId: string | null
  /** Kedalaman dari root, dihitung server supaya klien tidak menelusuri parent. */
  depth: number
  fields: FieldRuntime[]
}

export interface DefinisiRuntime {
  form: {
    id: number
    nama: string
    deskripsi: string | null
    subjekWargaWajib: boolean
  }
  version: {
    id: string
    version: number
    status: string
    publishedAt: Date | null
  }
  sections: SectionRuntime[]
}

/**
 * Kedalaman setiap section, dihitung dari `parentId`.
 *
 * Dihitung di memori karena semua section satu versi sudah terambil dalam satu
 * query. Rantai dihentikan di `MAX_DEPTH` dan saat id yang sama muncul dua
 * kali supaya data rusak menghasilkan angka yang bisa dipakai (ind-dat), bukan
 * loop tak berujung.
 */
function hitungDepth(
  sections: readonly { id: string; parentId: string | null }[],
): Map<string, number> {
  const parentOf = new Map(sections.map((s) => [s.id, s.parentId]))
  const depth = new Map<string, number>()

  for (const section of sections) {
    let nilai = 0
    let kursor = section.parentId
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

    depth.set(section.id, nilai)
  }

  return depth
}

/** Kunci cache resolver opsi dinamis: satu sumber = satu query. */
function kunciSumber(type: string | null, key: string | null): string {
  return `${type ?? ''}\u0000${key ?? ''}`
}

/**
 * Muat definisi runtime satu versi form.
 *
 * Satu-satunya tempat yang membaca struktur form untuk runtime, dipakai oleh
 * halaman isi (baca) dan oleh penyimpanan (validasi terhadap definisi yang
 * sama). Kalau keduanya punya jalur sendiri, form yang tampil dan form yang
 * diterima bisa berbeda.
 *
 * Section dan field nonaktif TIDAK ikut dikembalikan. Konsekuensinya untuk
 * penyimpanan: field yang di-nonaktifkan ikut hilang dari peta field, jadi
 * jawaban untuk field itu ditolak sebagai "field tidak ada" — bukan diterima
 * lalu diabaikan.
 */
async function muatDefinisiRuntime(
  executor: Executor,
  formVersionId: string,
): Promise<DefinisiRuntime> {
  const versi = await executor
    .select({
      versionId: formVersions.id,
      version: formVersions.version,
      status: formVersions.status,
      publishedAt: formVersions.publishedAt,
      formId: forms.id,
      nama: forms.nama,
      deskripsi: forms.deskripsi,
      subjekWargaWajib: forms.subjekWargaWajib,
      formAktif: forms.aktif,
    })
    .from(formVersions)
    .innerJoin(forms, eq(forms.id, formVersions.formId))
    .where(eq(formVersions.id, formVersionId))
    .limit(1)

  const baris = versi[0]
  if (!baris) {
    tolak('VERSI_TIDAK_ADA', 'Form versi tidak ditemukan.')
  }
  if (baris.status !== 'published') {
    tolak(
      'VERSI_TIDAK_ADA',
      'Form ini belum diterbitkan, jadi belum bisa diisi. Pilih form lain.',
    )
  }
  if (!baris.formAktif) {
    tolak('VERSI_TIDAK_ADA', 'Form ini sedang dinonaktifkan, jadi belum bisa diisi.')
  }

  const semuaSection = await executor
    .select({
      id: formSections.id,
      parentId: formSections.parentId,
      nama: formSections.nama,
      deskripsi: formSections.deskripsi,
      urutan: formSections.urutan,
      aktif: formSections.aktif,
    })
    .from(formSections)
    .where(eq(formSections.formVersionId, formVersionId))
    .orderBy(asc(formSections.urutan))

  // Section nonaktif ikut diambil untuk menghitung `depth` child-nya: kalau
  // parent-nya hilang dari daftar, klien tidak bisa tahu anak itu berada di
  // level berapa.
  const depth = hitungDepth(semuaSection)
  const sections = semuaSection.filter((s) => s.aktif)

  if (sections.length === 0) {
    return {
      form: {
        id: baris.formId,
        nama: baris.nama,
        deskripsi: baris.deskripsi,
        subjekWargaWajib: baris.subjekWargaWajib,
      },
      version: {
        id: baris.versionId,
        version: baris.version,
        status: baris.status,
        publishedAt: baris.publishedAt,
      },
      sections: [],
    }
  }

  // Pakai `formVersionId` dan bukan daftar id section: FK komposit
  // (sectionId, formVersionId) sudah menjamin keduanya selalu satu versi, jadi
  // satu filter ini cukup.
  const semuaField = await executor
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
    .where(eq(formFields.formVersionId, formVersionId))
    .orderBy(asc(formFields.urutan))

  const sectionAktifId = new Set(sections.map((s) => s.id))
  const fields = semuaField.filter((f) => f.aktif && sectionAktifId.has(f.sectionId))

  // Dikelompokkan per section supaya penyusunan payload tidak menyaring ulang
  // seluruh daftar field untuk tiap section.
  const fieldsBySection = new Map<string, typeof fields>()
  for (const field of fields) {
    const list = fieldsBySection.get(field.sectionId)
    if (list) list.push(field)
    else fieldsBySection.set(field.sectionId, [field])
  }

  if (fields.length === 0) {
    return {
      form: {
        id: baris.formId,
        nama: baris.nama,
        deskripsi: baris.deskripsi,
        subjekWargaWajib: baris.subjekWargaWajib,
      },
      version: {
        id: baris.versionId,
        version: baris.version,
        status: baris.status,
        publishedAt: baris.publishedAt,
      },
      sections: sections.map((s) => ({
        id: s.id,
        nama: s.nama,
        deskripsi: s.deskripsi,
        urutan: s.urutan,
        parentId: s.parentId,
        depth: depth.get(s.id) ?? 0,
        fields: [],
      })),
    }
  }

  // Opsi dan aturan satu query karena satu tabelnya; dipisah berdasarkan
  // `tipe` supaya jumlah query tetap empat, bukan satu per field.
  const semuaRule = await executor
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
    .where(inArray(formFieldRules.fieldId, fields.map((f) => f.id)))
    .orderBy(asc(formFieldRules.urutan))

  const opsiPerField = new Map<string, OpsiRuntime[]>()
  const aturanPerField = new Map<string, AturanRuntime[]>()

  for (const rule of semuaRule) {
    if (rule.tipe === 'option') {
      // Kolom `value` nullable karena tabelnya dipakai aturan visibility juga.
      const list = opsiPerField.get(rule.fieldId) ?? []
      if (rule.value !== null) {
        list.push({
          value: rule.value,
          label: rule.label,
          urutan: rule.urutan,
          aktif: rule.aktif,
        })
      }
      opsiPerField.set(rule.fieldId, list)
      continue
    }

    const list = aturanPerField.get(rule.fieldId) ?? []
    list.push({
      id: rule.id,
      sourceFieldId: rule.sourceFieldId,
      operator: rule.operator,
      value: rule.value,
      label: rule.label,
      urutan: rule.urutan,
      aktif: rule.aktif,
    })
    aturanPerField.set(rule.fieldId, list)
  }

  // Opsi dinamis di-resolve sekali per pasangan sumber yang berbeda, bukan sekali
  // per field. `fasKesId` sengaja tidak diisi: sesi tidak pernah tahu
  // `users.id` pemohon (login satu PIN global, lihat
  // src/lib/user-registry.server.ts), jadi daftar petugas yang sah tetap
  // dijaga `pastikanPetugasValid()` saat penyimpanan.
  const cacheOpsiDinamis = new Map<
    string,
    { opsi: OpsiDinamisRuntime[]; tidakDikenali: boolean; label: string | null }
  >()
  const opsiDinamisField = new Map<
    string,
    { opsi: OpsiDinamisRuntime[]; tidakDikenali: boolean; label: string | null; saran: string[] }
  >()

  for (const field of fields) {
    if (!field.optionSourceType) continue
    // Saran menempel pada field-nya sendiri (baris form_field_rules-nya),
    // jadi tidak ikut cache bersama sumber.
    const perField = field.optionSourceType === 'suggest'
    const kunci = perField ? field.id : kunciSumber(field.optionSourceType, field.optionSourceKey)
    let hasil = cacheOpsiDinamis.get(kunci)
    if (!hasil) {
      const resolved = await resolveOpsiDinamis({
        optionSourceType: field.optionSourceType,
        optionSourceKey: field.optionSourceKey,
        fieldId: field.id,
      })
      hasil = { opsi: resolved.opsi, tidakDikenali: resolved.sumberTidakDikenali, label: resolved.label }
      cacheOpsiDinamis.set(kunci, hasil)
    }
    opsiDinamisField.set(field.id, {
      ...hasil,
      saran: perField ? hasil.opsi.map((o) => o.label) : [],
    })
  }

  return {
    form: {
      id: baris.formId,
      nama: baris.nama,
      deskripsi: baris.deskripsi,
      subjekWargaWajib: baris.subjekWargaWajib,
    },
    version: {
      id: baris.versionId,
      version: baris.version,
      status: baris.status,
      publishedAt: baris.publishedAt,
    },
    sections: sections.map((section) => ({
      id: section.id,
      nama: section.nama,
      deskripsi: section.deskripsi,
      urutan: section.urutan,
      parentId: section.parentId,
      depth: depth.get(section.id) ?? 0,
      fields: (fieldsBySection.get(section.id) ?? []).map((field) => {
        const dinamis = opsiDinamisField.get(field.id) ?? null
        return {
          id: field.id,
          nama: field.nama,
          label: field.label,
          tipe: field.tipe,
          deskripsi: field.deskripsi,
          placeholder: field.placeholder,
          wajib: field.wajib,
          urutan: field.urutan,
          jumlahKolom: field.jumlahKolom,
          aktif: field.aktif,
          opsi: opsiPerField.get(field.id) ?? [],
          opsiDinamis: dinamis ? dinamis.opsi : null,
          sumberOpsiTidakDikenali: dinamis ? dinamis.tidakDikenali : false,
          sumberOpsiLabel: dinamis ? dinamis.label : null,
          saran: dinamis ? dinamis.saran : [],
          aturan: aturanPerField.get(field.id) ?? [],
        }
      }),
    })),
  }
}

/**
 * Definisi runtime untuk halaman isi form.
 *
 * Sama dengan `muatDefinisiRuntime`, hanya dipanggil dengan `db` supaya
 * pemanggil di luar tidak perlu tahu bentuk executor-nya.
 */
export async function ambilFormulirUntukIsi(formVersionId: string): Promise<DefinisiRuntime> {
  return await muatDefinisiRuntime(db, formVersionId)
}

// ---------------------------------------------------------------------------
// Penyimpanan isian generik
// ---------------------------------------------------------------------------

export interface JawabanFormulir {
  fieldId: string
  value: unknown
}

export interface SimpanFormulirInput {
  formVersionId: string
  /** `users.id` petugas pencatat. */
  petugasId: string
  /** Wajib diisi kalau `forms.subjekWargaWajib` true, dan harus null kalau tidak. */
  wargaNik?: string | null
  /** `YYYY-MM-DD`. */
  tanggal: string
  jawaban: readonly JawabanFormulir[]
  /**
   * Selalu null: login aplikasi memakai satu PIN global tanpa pemetaan ke
   * `users.id` (lihat catatan autentikasi di src/lib/user-registry.server.ts).
   * Fieldnya tetap ada supaya bentuknya sama dengan service Form Builder.
   */
  actorId?: string | null
}

export interface HasilSimpanFormulir {
  surveyId: string
  jumlahJawaban: number
}

/**
 * Bandingkan jawaban sumber aturan dengan nilai pembandingnya sebagai daftar
 * teks. `survey_entries.value` jsonb bisa berisi apa saja, jadi hanya teks,
 * angka, boolean, dan daftar dari ketiganya yang bisa dibandingkan; nilai lain
 * diperlakukan sebagai tidak ada.
 *
 * Daftar ikut dibaca karena field `checkbox` mengirim array, dan untuk checkbox
 * "sama dengan Y" berarti "Y ada di dalam daftarnya".
 */
function teksPembanding(nilai: unknown): string[] {
  if (nilai === null || nilai === undefined) return []
  if (typeof nilai === 'string') {
    const teks = nilai.trim()
    return teks === '' ? [] : [teks]
  }
  if (typeof nilai === 'number' || typeof nilai === 'boolean') return [String(nilai)]
  if (Array.isArray(nilai)) {
    const keluar: string[] = []
    for (const isi of nilai as unknown[]) keluar.push(...teksPembanding(isi))
    return keluar
  }
  return []
}

/**
 * Apakah satu aturan visibility terpenuhi oleh jawaban yang dikirim.
 *
 * Aturan dianggap terpenuhi kalau sumbernya sudah hilang, operatornya kosong,
 * atau nilai pembandingnya kosong. Ketiganya berarti aturan tidak bisa
 * dievaluasi, dan semuanya diperlakukan "terpenuhi" supaya satu baris rusak di
 * editor tidak menyembunyikan field-nya selamanya — petugas tidak punya jalan
 * lain untuk memperbaikinya dari layar isi.
 */
function aturanTerpenuhi(aturan: AturanRuntime, nilai: Map<string, unknown>): boolean {
  if (aturan.sourceFieldId === null) return true
  if (aturan.operator === null) return true

  const target = (aturan.value ?? '').trim()
  if (target === '') return true

  const isi = teksPembanding(nilai.get(aturan.sourceFieldId))
  return aturan.operator === 'equals' ? isi.includes(target) : !isi.includes(target)
}

/** `''`, `null`, `undefined`, dan daftar kosong dianggap belum diisi. */
function nilaiKosong(nilai: unknown): boolean {
  if (nilai === null || nilai === undefined) return true
  if (typeof nilai === 'string') return nilai.trim() === ''
  if (Array.isArray(nilai)) return nilai.length === 0
  return false
}

/**
 * Daftar opsi yang sah untuk satu field — sama persis dengan yang dirender,
 * supaya nilai yang bisa dipilih petugas dan nilai yang diterima server tidak
 * bisa berbeda.
 */
function opsiSah(field: FieldRuntime): { value: string; aktif: boolean }[] {
  if (field.opsiDinamis !== null) {
    return field.opsiDinamis.map((o) => ({ value: o.value, aktif: true }))
  }
  return field.opsi
}

/** Batas label yang ditulis di pesan error, supaya pesannya tetap terbaca. */
const MAKS_LABEL_DISEBUTKAN = 8

function sebutkan(list: readonly string[]): string {
  const bagian = list.slice(0, MAKS_LABEL_DISEBUTKAN).join(', ')
  const sisa = list.length - MAKS_LABEL_DISEBUTKAN
  return sisa > 0 ? `${bagian}, dan ${sisa} lainnya` : bagian
}

/**
 * Simpan satu isian form generik.
 *
 * SEMUA validasi selesai sebelum ada satu baris pun ditulis. Alasannya: petugas
 * mengisi form yang panjang di lapangan, dan menemukan lima kesalahan sekaligus
 * jauh lebih murah daripada lima kali kirim ulang. Karena itu jawaban yang
 * tidak valid tidak pernah sampai ke database, dan tidak ada keadaan setengah
 * terisi.
 *
 * Urutan pemeriksaan dari yang paling merusak kalau dilewati: bentuk isian dulu
 * supaya tidak ada yang sampai ke database, baru isi yang butuh dokumen warga.
 *   1. Versi masih tayang? (form bisa saja sudah diganti sejak halaman dibuka)
 *   2. Petugasnya akun aktif yang boleh mencatat?
 *   3. Tanggalnya tanggal sungguhan?
 *   4. Semua `fieldId` berasal dari form versi ini? (id dari klien tidak pernah
 *      dipercaya, dan FK `survey_entries.fieldId` ke `form_fields` tidak tahu
 *      versi form-nya)
 *   5. Warga sesuai aturan form, dan NIK-nya benar-benar ada di `data_warga`
 *   6. Aturan visibility: jawaban field tersembunyi dibuang
 *   7. Semua field wajib yang terlihat terisi (semuanya sekaligus)
 *   8. Bentuk nilai dan pilihan jawaban sesuai definisi
 */
export async function simpanFormulir(input: SimpanFormulirInput): Promise<HasilSimpanFormulir> {
  const { formVersionId, petugasId, actorId, jawaban } = input

  // 1. Definisi dimuat ulang di sini, bukan diambil dari layar isi. Halaman
  //    bisa sudah terbuka sejak admin menerbitkan versi lain atau menonaktifkan
  //    form, dan isian yang terkirim harus ditolak kalau yang tayang sudah
  //    berganti — bukan disimpan ke versi yang sudah tidak dipakai.
  const definisi = await muatDefinisiRuntime(db, formVersionId)

  // 2. `pastikanPetugasValid` melempar `Error` biasa supaya bisa dipakai juga
  //    dari alur lama. Di sini errornya dibungkus jadi `KesalahanValidasi`
  //    supaya route membalas 400 dengan pesan yang sama, bukan 500.
  let petugas: { id: string; nama: string }
  try {
    petugas = await pastikanPetugasValid(petugasId)
  } catch (err) {
    tolak(
      'NILAI_TIDAK_COCOK',
      err instanceof Error ? err.message : 'Petugas yang dipilih tidak valid.',
    )
  }

  // 3. `validasiNilaiField` untuk tipe `date` dipakai ulang supaya pemeriksaan
  //    "tanggal sungguhan, bukan 2026-02-31" hanya ada di satu tempat.
  const tanggal = input.tanggal.trim()
  const cekTanggal = validasiNilaiField({ tipe: 'date', value: tanggal })
  if (!cekTanggal.ok) {
    tolak('NILAI_TIDAK_COCOK', 'Tanggal isian harus ditulis YYYY-MM-DD dan berupa tanggal yang sah.')
  }

  const petaField = new Map<string, FieldRuntime>()
  for (const section of definisi.sections) {
    for (const field of section.fields) petaField.set(field.id, field)
  }

  // 4. Id field dari klien tidak pernah dipercaya. Peta ini hanya berisi field
  //    AKTIF pada versi ini, jadi field yang dinonaktifkan atau dihapus ikut
  //    tertangkap di sini.
  const nilaiTerkirim = new Map<string, unknown>()
  const takDikenal: string[] = []
  const dobel: string[] = []

  for (const item of jawaban) {
    const field = petaField.get(item.fieldId)
    if (!field) {
      takDikenal.push(item.fieldId)
      continue
    }
    // `survey_entries` punya unique (surveyId, fieldId), jadi dua jawaban untuk
    // field yang sama akan menggagalkan seluruh transaksi dengan pesan error
    // database. Ditolak di sini supaya penyebabnya bisa dibaca petugas.
    if (nilaiTerkirim.has(item.fieldId)) {
      dobel.push(field.label)
      continue
    }
    nilaiTerkirim.set(item.fieldId, item.value)
  }

  if (takDikenal.length > 0) {
    tolak(
      'FIELD_TIDAK_ADA',
      `${takDikenal.length} jawaban diisi untuk field yang tidak ada di form versi ini. ` +
        'Muat ulang halaman form lalu isian ulang.',
    )
  }
  if (dobel.length > 0) {
    tolak(
      'NILAI_TIDAK_COCOK',
      `Field berikut diisi lebih dari sekali: ${sebutkan(dobel)}. ` +
        'Hapus jawaban ganda lalu kirim ulang.',
    )
  }

  // 5. Warga. Aturan "form ini wajib atau tidak punya warga tetap per isian"
  //    datang dari `forms.subjekWargaWajib`, dan hanya bisa dijaga di backend.
  //    NIK yang tidak boleh atau tidak dikenal ditolak di sini, bukan disimpan
  //    lalu dibiarkan menggantung: `surveys.wargaNik` dipakai rekap dan detail
  //    warga, jadi NIK ngawar akan membuat dua layar itu salah.
  const nikDiminta = (input.wargaNik ?? '').trim()
  if (definisi.form.subjekWargaWajib) {
    if (nikDiminta === '') {
      tolak('NIK_TIDAK_VALID', 'Form ini wajib menunjuk satu warga. Pilih warga terlebih dahulu.')
    }
    pastikan(validasiNik(nikDiminta))
    const [warga] = await db
      .select({ nik: dataWargaTable.nik })
      .from(dataWargaTable)
      .where(eq(dataWargaTable.nik, nikDiminta))
      .limit(1)
    if (!warga) {
      tolak('NIK_TIDAK_VALID', `Warga dengan NIK ${nikDiminta} tidak ditemukan di data warga.`)
    }
  } else if (nikDiminta !== '') {
    tolak(
      'NIK_TIDAK_VALID',
      'Form ini tidak punya warga tetap per isian, jadi NIK warga tidak boleh diisi.',
    )
  }
  const wargaNik = definisi.form.subjekWargaWajib ? nikDiminta : null

  // 6. Visibility. Jawaban field tersembunyi dibuang, bukan ditolak: petugas
  //    bisa saja membuka form saat kondisinya masih terpenuhi, lalu berubah
  //    sebelum mengirim. Field wajib yang tersembunyi juga tidak ikut diminta
  //    di langkah 7.
  const jawabanTersimpan: JawabanFormulir[] = []
  const belumTerisi: string[] = []

  for (const field of petaField.values()) {
    const tersembunyi = field.aturan
      .filter((a) => a.aktif)
      .some((aturan) => !aturanTerpenuhi(aturan, nilaiTerkirim))

    if (tersembunyi) continue

    const value = nilaiTerkirim.get(field.id)
    if (field.wajib && nilaiKosong(value)) {
      belumTerisi.push(field.label)
      continue
    }
    if (!nilaiTerkirim.has(field.id)) continue

    jawabanTersimpan.push({ fieldId: field.id, value })
  }

  // 7. Semua field wajib yang belum terisi disebut sekaligus. Satu pesan berisi
  //    seluruh label membuat petugas bisa menyelesaikan formnya dalam satu
  //    putaran, bukan satu kesalahan per request.
  if (belumTerisi.length > 0) {
    tolak(
      'NILAI_TIDAK_COCOK',
      `Field wajib belum diisi: ${sebutkan(belumTerisi)}.`,
    )
  }

  // 8. Bentuk dan pilihan jawaban. Label ikut ditulis di pesan supaya petugas
  //    tahu pertanyaan mana yang ditolak, bukan cuma nama teknis field.
  for (const item of jawabanTersimpan) {
    const field = petaField.get(item.fieldId)
    if (!field) continue

    if (TIPE_LAMPIRAN.includes(field.tipe) && !nilaiKosong(item.value)) {
      tolak(
        'NILAI_TIDAK_COCOK',
        `Field "${field.label}" (${field.tipe}) belum didukung. Isian form ini belum bisa menyertakan foto atau berkas.`,
      )
    }

    const opsi = opsiSah(field)
    const bentuk = validasiNilaiField({ tipe: field.tipe, value: item.value, opsi })
    if (!bentuk.ok) {
      tolak(bentuk.kode, `Field "${field.label}": ${bentuk.pesan}`)
    }
    const pilihan = validasiNilaiOpsiTerpilih({ tipe: field.tipe, nilai: item.value, opsi })
    if (!pilihan.ok) {
      tolak(pilihan.kode, `Field "${field.label}": ${pilihan.pesan}`)
    }
  }

  const surveyId = crypto.randomUUID()
  const now = new Date()

  // `surveys` dan `survey_entries` satu transaksi: header tanpa jawaban atau
  // sebaliknya akan terlihat sebagai isian lengkap di rekap padahal tidak.
  await db.transaction(async (tx) => {
    await tx.insert(surveys).values({
      id: surveyId,
      formVersionId,
      wargaNik,
      petugasId: petugas.id,
      tanggal,
      createdAt: now,
      updatedAt: now,
    })

    if (jawabanTersimpan.length > 0) {
      await tx.insert(surveyEntries).values(
        jawabanTersimpan.map((item) => ({
          surveyId,
          fieldId: item.fieldId,
          value: item.value,
          createdAt: now,
          updatedAt: now,
        })),
      )
    }
  })

  // Audit ditulis DI LUAR transaksi: kalau commit dibatalkan, tidak boleh ada
  // jejak yang menyatakan isian tersimpan padahal sebenarnya tidak. NIK mentah
  // hanya lewat kolom `nik`, yang dimasking di dalam `catatAudit`; `sesudah`
  // ikut disalin ke backup, jadi NIK tidak boleh masuk ke sana.
  await catatAudit({
    userId: actorId ?? petugas.id,
    aksi: 'create',
    entitas: 'surveys',
    entitasId: surveyId,
    nik: wargaNik ?? undefined,
    sesudah: { formVersionId, jumlahJawaban: jawabanTersimpan.length, petugasId: petugas.id, tanggal },
  })

  return { surveyId, jumlahJawaban: jawabanTersimpan.length }
}
