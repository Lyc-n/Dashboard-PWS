/**
 * Nilai enum Postgres yang dipakai sebagai pilihan jawaban form.
 *
 * Dipisah dari `src/lib/schema/type-enum.ts` karena file itu mendefinisikan
 * `pgEnum(...)`, yang menarik `drizzle-orm/pg-core` ke bundle. Katalog sumber
 * opsi (`sumber-opsi.ts`) dan preview Form Builder membutuh daftar nilai ini di
 * sisi klien, jadi nilainya harus hidup di modul yang bebas drizzle.
 *
 * Nilai di sini adalah sumber kebenaran yang sama dengan enum di database:
 * `pgEnum('agama', AGAMA_VALUES)` memakai array ini juga. Mengubah daftar di sini
 * berarti mengubah tipe enum, jadi perlu ALTER TYPE — bukan sekadar edit kode.
 */

export const STATUS_KAWIN_VALUES = [
  'belum kawin',
  'kawin',
  'cerai mati',
  'cerai hidup',
] as const
export const JENIS_KELAMIN_VALUES = ['laki-laki', 'perempuan'] as const
export const HUBUNGAN_KELUARGA_VALUES = [
  'Kepala Keluarga',
  'Orang Tua',
  'Suami',
  'Istri',
  'Anak',
  'Mertua',
  'Menantu',
  'Cucu',
  'Pembantu',
  'Famili lain',
  'Lainnya',
] as const
export const PENDIDIKAN_VALUES = [
  'SLTA/Sederajat',
  'Tidak/Belum Sekolah',
  'Belum Tamat SD/Sederajat',
  'SLTP/Sederajat',
  'Strata III',
  'Diploma IV/Strata I',
  'Akademi/Diploma III/ Sarjana Muda',
  'Tamat SD/Sederajat',
  'Strata-II',
  'Diploma I/II',
] as const
export const AGAMA_VALUES = [
  'Budha',
  'Hindu',
  'Islam',
  'Katholik',
  'Kristen',
  'Konghucu',
] as const
export const PEKERJAAN_VALUES = [
  'Petani',
  'Buruh',
  'Nelayan',
  'PNS',
  'Pedagang',
  'SWASTA',
  'IRT',
  'Pelajar/Mahasiswa',
  'Tidak Bekerja',
  'Lainnya',
] as const
export const FAS_KES_VALUES = ['Posyandu', 'Pustu'] as const
