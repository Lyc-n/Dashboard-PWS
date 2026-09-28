import { pgEnum } from "drizzle-orm/pg-core";

export const statusKawinEnum = pgEnum('status_kawin', [
  'belum kawin',
  'kawin',
  'cerai mati',
  'cerai hidup',
])
export const jenisKelaminEnum = pgEnum('jenis_kelamin', [
  'laki-laki',
  'perempuan',
])
export const hubunganKeluargaEnum = pgEnum('hubungan_keluarga', [
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
])
export const pendidikanEnum = pgEnum('pendidikan', [
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
])
export const agama = pgEnum('agama', ['Budha', 'Hindu', 'Islam', 'Katholik', 'Kristen', 'Konghucu']);
export const pekerjaan = pgEnum('pekerjaan', [
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
]);
// CATATAN: enum `jamban_keluarga` dan `sarana_air_bersih` yang dulu ada di file ini
// sudah dihapus. Keduanya tidak pernah dipakai kolom mana pun (baik di database
// maupun di kode), dan tipe-nya juga sudah tidak ada di database. Kalau dibiarkan,
// `drizzle-kit generate` akan membuat `CREATE TYPE` untuk enum yang tidak pernah
// dipakai. Nilai aslinya masih hidup sebagai kolom `text` di riwayat_ks_import
// (jenis_jamban_saniter, jenis_sumber_air_terlindung).
// Nama tipenya `jenis_fas_kes`, BUKAN `fasilitas_kesehatan`. Setiap tabel di
// Postgres diam-diam punya composite type dengan nama yang sama, jadi
// `create table fasilitas_kesehatan` akan gagal dengan "type already exists"
// kalau enum-nya juga bernama `fasilitas_kesehatan`.
export const fasKes = pgEnum('jenis_fas_kes', [
  'Posyandu',
  'Pustu'
])
export const role = pgEnum('role', [
  'admin',
  'staff',
])
export const formFieldType = pgEnum("form_field_type", [
  "text",
  "textarea",
  "number",
  "select",
  "radio",
  "checkbox",
  "date",
  "time",
  "image",
  "file",
]);
export const formFieldRuleType = pgEnum("form_field_rule_type", [
  "option",
  "visibility",
]);
export const formFieldRuleOperator = pgEnum("form_field_rule_operator", [
  "equals",
  "not_equals",
]);

// Aksi yang dicatat di audit_logs. Sengaja enum, bukan varchar bebas: supaya query
// "tampilkan semua yang menghapus data" tidak bergantung pada ejaan. Penulis perlu
// menambah nilai baru lewat ALTER TYPE, bukan diam-diam menambah string baru.
export const auditAction = pgEnum("audit_action", [
  "create",
  "read",
  "update",
  "delete",
  "publish",
  "login",
  "logout",
]);
