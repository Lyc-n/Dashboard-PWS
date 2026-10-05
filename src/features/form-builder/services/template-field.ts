/**
 * Komponen siap pakai untuk Form Builder.
 *
 * Masalah yang diselesaikan: admin yang menyusun form harus mengingat nama
 * teknis (`tgl_lahir`, bukan "Tanggal Lahir"), memilih tipe yang benar, lalu
 * untuk field daftar harus memilih sumber jawaban dari katalog. Tiga langkah
 * per field, dan dua di antaranya bisa salah tanpa langsung ketahuan — baru
 * ketahuan saat Build ditolak.
 *
 * Template shorten pekerjaan itu: satu tarikan sudah jadi field lengkap — nama
 * teknis, label, tipe, dan (untuk field daftar) sumber jawabannya terisi. Admin
 * masih boleh mengubah apa pun lewat panel Pengaturan; template cuma titik awal.
 *
 * Hubungan dengan katalog sumber
 * ------------------------------
 * `optionSourceType` dan `optionSourceKey` tidak menyalin nilainya dari
 * {@link SUMBER_OPSI}; katalog ini hanya menyebut `type::key`-nya. Daftar
 * jawabannya tetap dibaca dari `nilaiEnum()` atau dari database saat form diisi,
 * jadi nilai enum tetap punya satu sumber kebenaran.
 *
 * Prefix `section::`
 * ------------------
 * TIDAK ikut di template. Nama di sini adalah bentuk pendek yang dilihat admin
 * dan divalidasi `POLA_NAMA_FIELD`. Prefix ditambahkan server saat Build untuk
 * form berkode saja (lihat `namaTersimpan` di `build.server.ts`), jadi template
 * dan ketik manual berakhir dengan baris database yang sama persis.
 *
 * Modul ini bebas import apa pun dari server: dipakai palette (klien) dan test,
 * sama seperti `sumber-opsi.ts`.
 */
import type { TipeField } from './validasi'
import { SUMBER_CARI_WARGA } from './sumber-opsi'
import type { KelompokTemplate, TemplateField } from './types-template-field'

export type { KelompokTemplate, TemplateField } from './types-template-field'



/** Field data warga: isinya sama dengan kolom tabel `data_warga`. */
function warga(
  id: string,
  nama: string,
  label: string,
  tipe: TipeField,
  ikon: string,
  hint: string,
): TemplateField {
  return {
    id,
    nama,
    label,
    tipe,
    kelompok: 'Data warga',
    optionSourceType: null,
    optionSourceKey: null,
    hint,
    ikon,
  }
}

/**
 * Field daftar dari enum Postgres.
 *
 * `radio` dipilih karena semua enum ini punya 2-11 nilai pendek. Nilai enum
 * dibaca dari `nilaiEnum()` saat render — tidak disimpan di katalog ini.
 */
function enumWarga(
  id: string,
  nama: string,
  label: string,
  key: string,
  ikon: string,
): TemplateField {
  return {
    id,
    nama,
    label,
    tipe: 'radio',
    kelompok: 'Kategori warga',
    optionSourceType: 'enum',
    optionSourceKey: key,
    hint: `Pilihan diambil dari enum \`${key}\``,
    ikon,
  }
}

/**
 * Field daftar dari tabel yang sudah ada.
 *
 * Daftar jawabannya diambil dari database saat form diisi, jadi ikut berubah
 * sendiri mengikuti datanya — petugas tidak perlu menyunting formnya tiap kali
 * petugas atau fasilitas baru ditambah.
 */
function sumberData(
  id: string,
  nama: string,
  label: string,
  type: string,
  key: string,
  ikon: string,
  hint: string,
): TemplateField {
  return {
    id,
    nama,
    label,
    tipe: 'select',
    kelompok: 'Petugas & fasilitas',
    optionSourceType: type,
    optionSourceKey: key,
    hint,
    ikon,
  }
}

/**
 * Field teks yang isinya bisa diambil dari Data Sasaran.
 *
 * `key` menentukan kolom mana yang mengisi field saat petugas memilih satu
 * baris: `nama_art` untuk field "Nama warga", `nik` untuk field "NIK". Field lain
 * tidak ikut terisi.
 */
function cariWarga(
  id: string,
  nama: string,
  label: string,
  key: 'nama_art' | 'nama_kk' | 'nik',
  ikon: string,
  hint: string,
): TemplateField {
  return {
    id,
    nama,
    label,
    tipe: 'text',
    kelompok: 'Data warga',
    optionSourceType: SUMBER_CARI_WARGA,
    optionSourceKey: key,
    hint,
    ikon,
  }
}

export const TEMPLATE_FIELD: readonly TemplateField[] = [
  // --- Data warga
  // Tiga yang punya banyak baris di Data Sasaran dapat pencarian. Saran tidak
  // membatasi jawaban: nama yang tidak ada di sana tetap bisa diketik dan disimpan.
  cariWarga('warga-nama', 'nama', 'Nama warga', 'nama_art', 'User', 'Bisa diisi dari Data Sasaran'),
  cariWarga('warga-nama-kk', 'nama_kk', 'Nama kepala keluarga', 'nama_kk', 'Users', 'Bisa diisi dari Data Sasaran'),
  cariWarga('warga-nik', 'nik', 'NIK', 'nik', 'CreditCard', 'Bisa diisi dari Data Sasaran'),
  warga('warga-tgl-lahir', 'tgl_lahir', 'Tanggal lahir', 'date', 'Calendar', 'Format YYYY-MM-DD'),
  warga('warga-alamat', 'alamat', 'Alamat', 'text', 'MapPin', 'Alamat lengkap sesuai domisili'),
  warga('warga-rt', 'rt', 'RT', 'text', 'Hash', 'Nomor RT, boleh dengan nol di depan'),
  warga('warga-rw', 'rw', 'RW', 'text', 'Hash', 'Nomor RW, boleh dengan nol di depan'),

  // --- Kategori warga: enum Postgres yang sama dengan kolom `data_warga`
  enumWarga('enum-agama', 'agama', 'Agama', 'agama', 'Sparkles'),
  enumWarga('enum-jk', 'jenis_kelamin', 'Jenis kelamin', 'jenis_kelamin', 'Circle'),
  enumWarga('enum-pendidikan', 'pendidikan', 'Pendidikan', 'pendidikan', 'GraduationCap'),
  enumWarga('enum-pekerjaan', 'pekerjaan', 'Pekerjaan', 'pekerjaan', 'Briefcase'),
  enumWarga('enum-status-kawin', 'status_kawin', 'Status kawin', 'status_kawin', 'Heart'),
  enumWarga('enum-hubungan', 'hubungan_keluarga', 'Hubungan dalam keluarga', 'hubungan_keluarga', 'Users'),

  // --- Petugas & fasilitas
  sumberData(
    'sumber-petugas',
    'petugas',
    'Petugas pencatat',
    'users',
    'petugas',
    'UserCheck',
    'Akun petugas yang aktif',
  ),
  sumberData(
    'sumber-faskes',
    'faskes',
    'Fasilitas kesehatan',
    'faskes',
    'nama',
    'Hospital',
    'Semua fasilitas yang terdaftar',
  ),
]

const KELOMPOK_URUT: readonly KelompokTemplate[] = [
  'Data warga',
  'Kategori warga',
  'Petugas & fasilitas',
]

/** Katalog dikelompokkan sesuai urutan di atas, untuk palette. */
export function templatePerKelompok(): Array<{
  kelompok: KelompokTemplate
  daftar: TemplateField[]
}> {
  return KELOMPOK_URUT.map((kelompok) => ({
    kelompok,
    daftar: TEMPLATE_FIELD.filter((t) => t.kelompok === kelompok),
  })).filter((g) => g.daftar.length > 0)
}

/** Awalan id draggable di palette, dipakai `handleDragEnd` untuk mengenali. */
export const PREFIX_ID_TEMPLATE = 'template-'

export function idDragTemplate(templateId: string): string {
  return `${PREFIX_ID_TEMPLATE}${templateId}`
}

/** Satu template dari id drag-nya. null kalau id tidak dikenal. */
export function cariTemplate(idDrag: string): TemplateField | null {
  if (!idDrag.startsWith(PREFIX_ID_TEMPLATE)) return null
  const id = idDrag.slice(PREFIX_ID_TEMPLATE.length)
  return TEMPLATE_FIELD.find((t) => t.id === id) ?? null
}

/**
 * Bagian `DraftField` yang diisi satu template.
 *
 * `opsi` selalu kosong: kalau `optionSourceType` terisi, kewajiban punya opsi
 * statis dilewati oleh `validasiOpsiField`. Mengisi opsi di sini menyesatkan —
 * daftar jawabannya sudah ada di enum atau di database, bukan di baris form.
 *
 * `wajib` sengaja tidak ikut. Template tidak menebak apakah petugas harus
 * mengisinya; itu keputusan tiap form.
 *
 * Tipe ini apa yang dikembalikan fungsi di bawah, jadi tidak mungkin melenceng
 * dari isian yang benar-benar dipakai.
 */
export type PresetField = ReturnType<typeof presetDariTemplate>

export function presetDariTemplate(template: TemplateField): {
  nama: string
  label: string
  tipe: TipeField
  optionSourceType: string | null
  optionSourceKey: string | null
  opsi: never[]
} {
  return {
    nama: template.nama,
    label: template.label,
    tipe: template.tipe,
    optionSourceType: template.optionSourceType,
    optionSourceKey: template.optionSourceKey,
    opsi: [],
  }
}