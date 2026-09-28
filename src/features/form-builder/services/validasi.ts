/**
 * Validasi murni untuk Form Builder.
 *
 * Semua fungsi di file ini TIDAK menyentuh database, jadi bisa diuji tanpa DB.
 * Bagian yang butuh query database ada di `*.server.ts` dan memanggil fungsi ini
 * setelah data diambil.
 *
 * Kenapa validasi versi tidak dijamin database: composite FK untuk
 * `form_sections.parentId` dan `survey_entries.fieldId` butuh trigger supaya
 * pesannya bisa dibaca petugas, dan trigger itu sulit dirawat. Partial unique
 * index untuk "satu form satu versi published" tetap dipakai di database karena
 * murah dicek dan berguna menahan race condition saat dua request publish paralel.
 */

export type KodeValidasi =
  | 'PARENT_BEDA_VERSI'
  | 'PARENT_SAMA_DIRI'
  | 'PARENT_SIKLUS'
  | 'OPSI_KOSONG'
  | 'ATURAN_TIDAK_LENGKAP'
  | 'ATURAN_SUMBER_BEDA_VERSI'
  | 'VERSI_BUKAN_DRAFT'
  | 'VERSI_SUDAH_TERBIT'
  | 'VERSI_TIDAK_ADA'
  | 'SURVEI_TIDAK_ADA'
  | 'FIELD_TIDAK_ADA'
  | 'NILAI_TIDAK_COCOK'
  | 'NIK_TIDAK_VALID'
  | 'GROUP_BARIS_SISIP'
  | 'GROUP_BARIS_TERLALU_BANYAK'
  | 'GROUP_NILAI_SISIP'

export type HasilValidasi =
  | { ok: true }
  | { ok: false; kode: KodeValidasi; pesan: string }

const lolos: HasilValidasi = { ok: true }

function gagal(kode: KodeValidasi, pesan: string): HasilValidasi {
  return { ok: false, kode, pesan }
}

export type TipeField =
  | 'text'
  | 'textarea'
  | 'number'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'date'
  | 'time'
  | 'image'
  | 'file'
  | 'group'

/** Tipe yang jawabannya dipilih dari daftar, jadi butuh opsi. */
export const TIPE_BUTUH_OPSI: readonly TipeField[] = ['select', 'radio', 'checkbox']

/** Tipe yang boleh menyimpan lebih dari satu nilai. */
export const TIPE_BISA_NAIK: readonly TipeField[] = ['checkbox', 'group']

/**
 * Batas atas jumlah baris untuk satu field `group`.
 *
 * Nilai ini hanya divalidasi di backend, bukan lewat CHECK di database, karena
 * array-nya disimpan di `survey_entries.value` (jsonb) yang tidak bisa punya
 * constraint per-isi. Dipasang supaya satu field yang tidak sengaja dikirim
 * dengan array sangat besar tidak bisa membebani tabel: array 100rb baris akan
 * lolos validasi bentuk lalu menggagalkan seluruh transaksi saat di-insert.
 */
export const MAX_BARIS_GROUP = 500

/** Nilai yang boleh muncul di dalam satu sel group. */
type NilaiGroup = string | number | boolean | null

function selGroupValid(nilai: unknown): nilai is NilaiGroup {
  return (
    typeof nilai === 'string' ||
    typeof nilai === 'number' ||
    typeof nilai === 'boolean' ||
    nilai === null
  )
}

/**
 * Field `group` menyimpan baris berulang (anggota keluarga, daftar peserta,
 * daftar masalah) sebagai array of object di dalam satu baris `survey_entries`.
 * Kolom `value` jsonb sudah bisa menampungnya, jadi tidak ada tabel anak.
 *
 * Yang dicek: harus array, tiap baris harus object biasa (bukan array atau
 * object bersarang), nilai di dalam sel harus primitif, dan jumlah baris tidak
 * melebihi batas. Bentuk object flattened (`{kolom1, kolom2, ...}`) yang
 * dipakai komponen editor; struktur kolom anak tidak disimpan di database,
 * jadi `jumlahKolom` tidak ikut divalidasi di sini.
 */
export function validasiNilaiGroup(params: {
  value: unknown
  maxBaris?: number
}): HasilValidasi {
  const { value, maxBaris = MAX_BARIS_GROUP } = params

  if (!Array.isArray(value)) {
    return gagal('GROUP_BARIS_SISIP', 'Field group harus diisi daftar baris.')
  }
  if (value.length > maxBaris) {
    return gagal(
      'GROUP_BARIS_TERLALU_BANYAK',
      `Field group maksimal ${maxBaris} baris, terkirim ${value.length}.`,
    )
  }

  for (const [i, baris] of value.entries()) {
    if (typeof baris !== 'object' || baris === null || Array.isArray(baris)) {
      return gagal(
        'GROUP_NILAI_SISIP',
        `Baris ${i + 1} pada field group harus berupa objek, bukan ${Array.isArray(baris) ? 'daftar' : typeof baris}.`,
      )
    }
    for (const [kolom, isi] of Object.entries(baris as Record<string, unknown>)) {
      if (!selGroupValid(isi)) {
        return gagal(
          'GROUP_NILAI_SISIP',
          `Nilai kolom "${kolom}" pada baris ${i + 1} harus teks, angka, atau boolean.`,
        )
      }
    }
  }

  return lolos
}

export interface OpsiField {
  value: string
  aktif?: boolean
}

/**
 * Field select/radio/checkbox tanpa opsi tidak bisa diisi, jadi petugas akan
 * melihat pertanyaan yang mustahil dijawab. Divalidasi saat simpan, bukan saat render.
 */
export function validasiOpsiField(params: {
  tipe: TipeField
  opsi: Pick<OpsiField, 'value' | 'aktif'>[]
}): HasilValidasi {
  const { tipe, opsi } = params
  if (!TIPE_BUTUH_OPSI.includes(tipe)) return lolos

  const aktif = opsi.filter((o) => o.aktif !== false)
  if (aktif.length === 0) {
    return gagal(
      'OPSI_KOSONG',
      `Field bertipe ${tipe} wajib punya minimal satu opsi jawaban.`,
    )
  }

  const nilai = aktif.map((o) => o.value.trim())
  if (nilai.some((v) => v === '')) {
    return gagal('OPSI_KOSONG', 'Nilai opsi tidak boleh kosong.')
  }
  if (new Set(nilai).size !== nilai.length) {
    return gagal('OPSI_KOSONG', 'Ada opsi jawaban dengan nilai yang sama.')
  }
  return lolos
}

/**
 * Section dengan parent dari versi form lain akan membuat hierarki form rusak:
 * field anak ikut terhapus bersama form yang salah.
 */
export function validasiParentSection(params: {
  formVersionId: string
  /** null = section ini jadi root. */
  parentId: string | null
  /** Id section yang sedang disimpan; null saat create. */
  sectionId: string | null
  /** formVersionId milik parent, null kalau parent tidak ada. */
  parentFormVersionId: string | null
  /** Rantai ancestor dari parent ke root, root terakhir. */
  ancestorIds?: readonly string[]
}): HasilValidasi {
  const { formVersionId, parentId, sectionId, parentFormVersionId, ancestorIds } = params

  if (parentId === null) return lolos

  if (parentFormVersionId === null) {
    return gagal('PARENT_BEDA_VERSI', 'Section parent tidak ditemukan.')
  }
  if (parentFormVersionId !== formVersionId) {
    return gagal(
      'PARENT_BEDA_VERSI',
      'Section parent harus berasal dari form versi yang sama.',
    )
  }
  if (sectionId !== null && parentId === sectionId) {
    return gagal('PARENT_SAMA_DIRI', 'Section tidak boleh jadi parent dirinya sendiri.')
  }
  if (sectionId !== null && ancestorIds?.includes(sectionId)) {
    return gagal(
      'PARENT_SIKLUS',
      'Hierarki akan berputar. Section ini sudah menjadi ancestor-nya.',
    )
  }
  return lolos
}

export interface AturanVisibility {
  tipe: 'option' | 'visibility'
  sourceFieldId: string | null
  operator: 'equals' | 'not_equals' | null
  value: string | null
  /** formVersionId milik field sumber, null kalau field sumber tidak ada. */
  sourceFormVersionId?: string | null
  /** formVersionId milik field yang jadi target aturan. */
  fieldFormVersionId: string
}

/**
 * Aturan visibility dan opsi jawaban dijejak di tabel yang sama, jadi tiap tipe
 * punya syarat isinya sendiri. Yang ditegakkan di sini: sumber aturan harus ada,
 * punya operator, dan berada di versi form yang sama dengan field targetnya.
 */
export function validasiAturanField(aturan: AturanVisibility): HasilValidasi {
  if (aturan.tipe === 'option') {
    if (aturan.value === null || aturan.value.trim() === '') {
      return gagal('ATURAN_TIDAK_LENGKAP', 'Opsi jawaban wajib punya nilai yang disimpan.')
    }
    return lolos
  }

  if (aturan.sourceFieldId === null) {
    return gagal('ATURAN_TIDAK_LENGKAP', 'Aturan visibility wajib punya field sumber.')
  }
  if (aturan.operator === null) {
    return gagal('ATURAN_TIDAK_LENGKAP', 'Aturan visibility wajib punya operator.')
  }
  if (aturan.value === null) {
    return gagal('ATURAN_TIDAK_LENGKAP', 'Aturan visibility wajib punya nilai pembanding.')
  }
  if (aturan.sourceFieldId === 'SAMA_DENGAN_FIELD_TARGET') {
    return gagal('ATURAN_TIDAK_LENGKAP', 'Field tidak boleh jadi sumber aturannya sendiri.')
  }
  if (
    aturan.sourceFormVersionId !== null &&
    aturan.sourceFormVersionId !== undefined &&
    aturan.sourceFormVersionId !== aturan.fieldFormVersionId
  ) {
    return gagal(
      'ATURAN_SUMBER_BEDA_VERSI',
      'Field sumber aturan harus berasal dari form versi yang sama.',
    )
  }
  return lolos
}

/** Versi yang sudah published atau archived tidak boleh diedit strukturnya. */
export function validasiEdisiVersi(status: string | null): HasilValidasi {
  if (status === null) {
    return gagal('VERSI_TIDAK_ADA', 'Form versi tidak ditemukan.')
  }
  if (status === 'published') {
    return gagal(
      'VERSI_SUDAH_TERBIT',
      'Versi ini sudah diterbitkan dan tidak bisa diedit. Buat versi baru untuk mengubah struktur form.',
    )
  }
  if (status === 'archived') {
    return gagal('VERSI_BUKAN_DRAFT', 'Versi ini sudah diarsipkan dan tidak bisa diedit.')
  }
  if (status !== 'draft') {
    return gagal('VERSI_BUKAN_DRAFT', `Status versi tidak dikenal: ${status}.`)
  }
  return lolos
}

/** Hanya draft yang boleh diterbitkan, dan tidak boleh dua kali. */
export function validasiTerbitkanVersi(status: string | null): HasilValidasi {
  if (status === null) {
    return gagal('VERSI_TIDAK_ADA', 'Form versi tidak ditemukan.')
  }
  if (status === 'published') {
    return gagal('VERSI_SUDAH_TERBIT', 'Versi ini sudah diterbitkan.')
  }
  if (status !== 'draft') {
    return gagal('VERSI_BUKAN_DRAFT', 'Hanya versi berstatus draft yang bisa diterbitkan.')
  }
  return lolos
}

const POLA_TANGGAL = /^\d{4}-\d{2}-\d{2}$/
const POLA_WAKTU = /^([01]\d|2[0-3]):[0-5]\d$/

function tanggalNyata(nilai: string): boolean {
  if (!POLA_TANGGAL.test(nilai)) return false
  const bagian = nilai.split('-').map(Number)
  const y = bagian[0]
  const m = bagian[1]
  const d = bagian[2]
  if (y === undefined || m === undefined || d === undefined) return false
  const dt = new Date(Date.UTC(y, m - 1, d))
  return (
    dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d
  )
}

/**
 * Bentuk jawaban dicek per tipe supaya data sampah tidak masuk. Kolom `value`
 * bertipe jsonb, jadi tanpa ini database menerima apa saja dan rekap rusak diam-diam.
 *
 * Field `image` dan `file` tidak divalidasi di sini: lampirannya hidup di
 * survey_files, bukan survey_entries.
 *
 * `opsi` undefined berarti pemanggil tidak memuat daftar opsi, dan pengecekan
 * keanggotaan opsi dilewati. `opsi` yang ada tapi kosong atau seluruhnya nonaktif
 * tetap ditegakkan: field tanpa opsi aktif tidak boleh menerima jawaban apa pun.
 */
export function validasiNilaiField(params: {
  tipe: TipeField
  value: unknown
  opsi?: readonly Pick<OpsiField, 'value' | 'aktif'>[]
}): HasilValidasi {
  const { tipe, value, opsi } = params

  if (value === null || value === undefined || value === '') return lolos

  const opsiDiberikan = opsi !== undefined
  const nilaiAktif = opsi?.filter((o) => o.aktif !== false).map((o) => o.value) ?? []

  switch (tipe) {
    case 'text':
    case 'textarea':
      if (typeof value !== 'string') {
        return gagal('NILAI_TIDAK_COCOK', `Field ${tipe} harus diisi teks.`)
      }
      return lolos

    case 'number':
      if (typeof value !== 'number' || !Number.isFinite(value)) {
        return gagal('NILAI_TIDAK_COCOK', 'Field number harus diisi angka.')
      }
      return lolos

    case 'date':
      if (typeof value !== 'string' || !tanggalNyata(value)) {
        return gagal('NILAI_TIDAK_COCOK', 'Field date harus diisi tanggal YYYY-MM-DD yang sah.')
      }
      return lolos

    case 'time':
      if (typeof value !== 'string' || !POLA_WAKTU.test(value)) {
        return gagal('NILAI_TIDAK_COCOK', 'Field time harus diisi waktu HH:MM (24 jam).')
      }
      return lolos

    case 'select':
    case 'radio': {
      if (typeof value !== 'string') {
        return gagal('NILAI_TIDAK_COCOK', `Field ${tipe} harus diisi satu nilai teks.`)
      }
      if (opsiDiberikan && !nilaiAktif.includes(value)) {
        return gagal('NILAI_TIDAK_COCOK', 'Jawaban tidak ada di daftar opsi field ini.')
      }
      return lolos
    }

    case 'checkbox': {
      if (!Array.isArray(value)) {
        return gagal('NILAI_TIDAK_COCOK', 'Field checkbox harus diisi daftar pilihan.')
      }
      if (!value.every((v) => typeof v === 'string')) {
        return gagal('NILAI_TIDAK_COCOK', 'Field checkbox harus diisi daftar teks.')
      }
      if (opsiDiberikan) {
        const diLuar = value.filter((v) => !nilaiAktif.includes(v))
        if (diLuar.length > 0) {
          return gagal(
            'NILAI_TIDAK_COCOK',
            `Jawaban di luar opsi field ini: ${diLuar.join(', ')}.`,
          )
        }
      }
      return lolos
    }

    case 'image':
    case 'file':
      return lolos

    case 'group':
      return validasiNilaiGroup({ value })
  }
}

/**
 * NIK 16 digit. Tidak ikut divalidasi ulang di DB karena NIK adalah primary key
 * varchar(16) — cek ini cuma menangkap salah ketik di form_isian.
 */
export function validasiNik(nik: string): HasilValidasi {
  if (!/^\d{16}$/.test(nik)) {
    return gagal('NIK_TIDAK_VALID', 'NIK harus 16 digit angka.')
  }
  return lolos
}
