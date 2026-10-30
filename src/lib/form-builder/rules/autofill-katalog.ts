/**
 * Katalog kolom untuk autofill dari data warga
 */

export const KOLOM_WARGA = [
  { value: 'nik', label: 'NIK' },
  { value: 'nama_art', label: 'Nama ART' },
  { value: 'nama_kk', label: 'Nama KK' },
  { value: 'tgl_lahir', label: 'Tanggal Lahir' },
  { value: 'alamat', label: 'Alamat' },
  { value: 'rt', label: 'RT' },
  { value: 'rw', label: 'RW' },
  { value: 'kelurahan', label: 'Kelurahan' },
  { value: 'kecamatan', label: 'Kecamatan' },
  { value: 'kota', label: 'Kota/Kabupaten' },
  { value: 'jenis_kelamin', label: 'Jenis Kelamin' },
  { value: 'status_kawin', label: 'Status Kawin' },
  { value: 'agama', label: 'Agama' },
  { value: 'pendidikan', label: 'Pendidikan' },
  { value: 'pekerjaan', label: 'Pekerjaan' },
  { value: 'wanita_usia_hamil', label: 'Wanita Usia Hamil' },
] as const

export type KolomWargaKey = (typeof KOLOM_WARGA)[number]['value']
