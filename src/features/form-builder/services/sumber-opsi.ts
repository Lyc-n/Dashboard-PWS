/**
 * Katalog sumber pilihan jawaban untuk Form Builder.
 *
 * Sebagian field tidak menyimpan pilihan jawabannya di `form_field_rules`,
 * melainkan menunjuk ke data yang sudah ada lewat
 * `form_fields.optionSourceType` + `optionSourceKey`. Jadi admin tidak perlu
 * mengetik ulang pilihan yang isinya sudah jelas: agama, jenis kelamin,
 * pendidikan, pekerjaan, status kawin, hubungan keluarga (enum Postgres),
 * nama petugas dari `users`, fasilitas kesehatan, wilayah kerja, atau nilai
 * distinct yang benar-benar ada di data warga.
 *
 * Modul ini SENGAJA bebas import apa pun dari server: dipakai panel
 * pengaturan (klien), validator (server), resolver (server), dan preview
 * (klien). Satu daftar, satu tempat, supaya pilihan yang bisa dipilih admin dan
 * yang bisa dibaca resolver tidak pernah berbeda.
 *
 * Bentuk nyimpanan
 * ----------------
 * `optionSourceType` = `enum`   → `optionSourceKey` = nama enum (`agama`, dst)
 * `optionSourceType` = `users`  → `optionSourceKey` = bebas (seed memakai `petugas`)
 * `optionSourceType` = `faskes` → key `nama` (baris tabel) atau `jenis` (enum)
 * `optionSourceType` = `warga`  → `optionSourceKey` = kolom sumber distinct
 * `optionSourceType` = `suggest` → daftar sarannya disimpan sebagai baris
 *   `form_field_rules` bertipe `option` milik field itu sendiri (pola yang sama
 *   dengan prefix `bucket=` di `src/lib/utils.server.ts`), jadi ikut terhapus
 *   bersama field dan ikut ter-backup bersama form.
 *
 * CATATAN: `optionSourceKey` juga dipakai prefix `bucket=` untuk field bucket
 * Form Kunjungan Rumah. Builder hanya menyentuh form tanpa `kode` (lihat
 * `listFormBaru` di `src/features/form-builder/services/form.server.ts`), jadi
 * keduanya tidak bentrok; `validasiSumberOpsi` tetap menolak key `bucket=`.
 */
import {
  AGAMA_VALUES,
  FAS_KES_VALUES,
  HUBUNGAN_KELUARGA_VALUES,
  JENIS_KELAMIN_VALUES,
  PEKERJAAN_VALUES,
  PENDIDIKAN_VALUES,
  STATUS_KAWIN_VALUES,
} from '@/lib/enum-values'
import { TIPE_BUTUH_OPSI } from './validasi'
import type { TipeField } from './validasi'

export type KelompokSumber =
  'Kategori warga' | 'Petugas & fasilitas' | 'Data warga' | 'Saran'

export interface SumberOpsi {
  /** Nilai untuk `form_fields.option_source_type`. */
  type: string
  /** Nilai untuk `form_fields.option_source_key`. */
  key: string
  /** Teks yang dilihat admin di picker. */
  label: string
  kelompok: KelompokSumber
  /**
   * true kalau daftar jawabannya harus dibaca dari database saat form dibuka.
   * Sumber false bisa di-resolve di klien (enum), jadi preview bisa menampilkannya
   * tanpa memanggil server.
   */
  perluServer: boolean
  /**
   * Saran hanya boleh untuk field teks: `<datalist>` hanya berlaku untuk input
   * teks di browser, jadi menempelkannya di select/checkbox tidak berguna.
   */
  tipeField?: readonly string[]
}

/**
 * Kolom data warga/riwayat yang bisa jadi daftar pilihan.
 *
 * `nama_art` dan `alamat` diambil dengan `LIMIT`, bukan seluruh isinya —
 * `data_warga` sudah puluhan ribu baris dan nilainya bebas teks.
 */
export const WARGA_KEYS = [
  'kelurahan',
  'kecamatan',
  'nama_art',
  'alamat',
  'jenis_jamban_saniter',
  'jenis_sumber_air_terlindung',
] as const

export type WarnaKey = (typeof WARGA_KEYS)[number]

/** Batas nilai distinct yang dikirim ke satu field. */
export const BATAS_NILAI_DISTINCT = 300

export const SUMBER_OPSI: readonly SumberOpsi[] = [
  // --- Kategori warga: enum Postgres, nilainya sama persis dengan yang dipakai
  //     kolom `data_warga`, jadi rekap dan peta wilayah langsung cocok.
  {
    type: 'enum',
    key: 'agama',
    label: 'Agama',
    kelompok: 'Kategori warga',
    perluServer: false,
  },
  {
    type: 'enum',
    key: 'jenis_kelamin',
    label: 'Jenis kelamin',
    kelompok: 'Kategori warga',
    perluServer: false,
  },
  {
    type: 'enum',
    key: 'pendidikan',
    label: 'Pendidikan',
    kelompok: 'Kategori warga',
    perluServer: false,
  },
  {
    type: 'enum',
    key: 'pekerjaan',
    label: 'Pekerjaan',
    kelompok: 'Kategori warga',
    perluServer: false,
  },
  {
    type: 'enum',
    key: 'status_kawin',
    label: 'Status kawin',
    kelompok: 'Kategori warga',
    perluServer: false,
  },
  {
    type: 'enum',
    key: 'hubungan_keluarga',
    label: 'Hubungan dalam keluarga',
    kelompok: 'Kategori warga',
    perluServer: false,
  },

  // --- Petugas & fasilitas
  {
    type: 'users',
    key: 'petugas',
    label: 'Nama petugas (akun aktif)',
    kelompok: 'Petugas & fasilitas',
    perluServer: true,
  },
  {
    type: 'faskes',
    key: 'nama',
    label: 'Fasilitas kesehatan',
    kelompok: 'Petugas & fasilitas',
    perluServer: true,
  },
  {
    type: 'faskes',
    key: 'jenis',
    label: 'Jenis fasilitas (Posyandu / Pustu)',
    kelompok: 'Petugas & fasilitas',
    perluServer: false,
  },
  {
    type: 'wilayah',
    key: 'kelurahan',
    label: 'Kelurahan (wilayah kerja)',
    kelompok: 'Petugas & fasilitas',
    perluServer: true,
  },
  {
    type: 'wilayah',
    key: 'kecamatan',
    label: 'Kecamatan (wilayah kerja)',
    kelompok: 'Petugas & fasilitas',
    perluServer: true,
  },

  // --- Data warga: nilai distinct yang benar-benar ada di tabel.
  {
    type: 'warga',
    key: 'kelurahan',
    label: 'Kelurahan yang ada di data warga',
    kelompok: 'Data warga',
    perluServer: true,
  },
  {
    type: 'warga',
    key: 'kecamatan',
    label: 'Kecamatan yang ada di data warga',
    kelompok: 'Data warga',
    perluServer: true,
  },
  {
    type: 'warga',
    key: 'nama_art',
    label: `Nama warga (maks ${BATAS_NILAI_DISTINCT} nilai)`,
    kelompok: 'Data warga',
    perluServer: true,
  },
  {
    type: 'warga',
    key: 'alamat',
    label: `Alamat warga (maks ${BATAS_NILAI_DISTINCT} nilai)`,
    kelompok: 'Data warga',
    perluServer: true,
  },
  {
    type: 'warga',
    key: 'jenis_jamban_saniter',
    label: 'Jenis jamban saniter (data riwayat)',
    kelompok: 'Data warga',
    perluServer: true,
  },
  {
    type: 'warga',
    key: 'jenis_sumber_air_terlindung',
    label: 'Jenis sumber air terlindung (data riwayat)',
    kelompok: 'Data warga',
    perluServer: true,
  },

  // --- Saran: admin yang menyusun daftarnya, petugas tetap bebas mengetik.
  {
    type: 'suggest',
    key: 'text',
    label: 'Daftar saran dari admin (petugas bebas isi)',
    kelompok: 'Saran',
    perluServer: false,
    tipeField: ['text'],
  },
]

const KELOMPOK_URUT: readonly KelompokSumber[] = [
  'Kategori warga',
  'Petugas & fasilitas',
  'Data warga',
  'Saran',
]

/** Katalog dikelompokkan sesuai urutan di atas, untuk `<optgroup>` di picker. */
export function sumberOpsiPerKelompok(): Array<{
  kelompok: KelompokSumber
  daftar: SumberOpsi[]
}> {
  return KELOMPOK_URUT.map((kelompok) => ({
    kelompok,
    daftar: SUMBER_OPSI.filter((s) => s.kelompok === kelompok),
  })).filter((g) => g.daftar.length > 0)
}

/**
 * Sumber yang terpasang pada satu field.
 *
 * `suggest` dicocokkan hanya dari `type`: field-nya tidak butuh key, daftar
 * sarannya ada di baris `form_field_rules` milik field itu sendiri.
 */
export function cariSumber(
  type: string | null | undefined,
  key: string | null | undefined,
): SumberOpsi | null {
  if (!type) return null
  if (type === SUMBER_SUGGEST) return typeSumber(SUMBER_SUGGEST)

  // `key` kosong hanya terjadi pada data lama yang memang tidak punya key (mis.
  // `optionSourceType: 'users'` tanpa key). Type itu sudah cukup untuk mencari
  // sumbernya.
  if (!key) return typeSumber(type)

  return SUMBER_OPSI.find((s) => s.type === type && s.key === key) ?? null
}

export function typeSumber(type: string): SumberOpsi | null {
  return SUMBER_OPSI.find((s) => s.type === type) ?? null
}

/** Daftar nilai enum untuk sumber `enum`. null kalau key-nya bukan enum. */
export function nilaiEnum(key: string): readonly string[] | null {
  switch (key) {
    case 'agama':
      return AGAMA_VALUES
    case 'jenis_kelamin':
      return JENIS_KELAMIN_VALUES
    case 'pendidikan':
      return PENDIDIKAN_VALUES
    case 'pekerjaan':
      return PEKERJAAN_VALUES
    case 'status_kawin':
      return STATUS_KAWIN_VALUES
    case 'hubungan_keluarga':
      return HUBUNGAN_KELUARGA_VALUES
    case 'jenis':
      return FAS_KES_VALUES
    default:
      return null
  }
}

export const SUMBER_SUGGEST = 'suggest'



/**
 * Sumber hanya boleh dipasang pada field yang butuh pilihan, kecuali `suggest`
 * yang memang untuk field teks (daftar saran bukan daftar jawaban wajib).
 */
export function tipeBolehPakaiSumber(params: {
  tipe: TipeField
  type: string | null | undefined
  key: string | null | undefined
}): boolean {
  const { tipe, type, key } = params
  if (!type) return true
  if (type === SUMBER_SUGGEST)
    return (typeSumber(SUMBER_SUGGEST)?.tipeField ?? []).includes(tipe)
  if (!TIPE_BUTUH_OPSI.includes(tipe)) return false
  return cariSumber(type, key) !== null
}
