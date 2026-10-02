import { pgEnum } from "drizzle-orm/pg-core";

export const STATUS_KAWIN_VALUES = [
  'belum kawin',
  'kawin',
  'cerai mati',
  'cerai hidup',
] as const;
export const JENIS_KELAMIN_VALUES = [
  'laki-laki',
  'perempuan',
] as const;
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
] as const;
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
] as const;
export const AGAMA_VALUES = ['Budha', 'Hindu', 'Islam', 'Katholik', 'Kristen', 'Konghucu'] as const;
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
] as const;

export const statusKawinEnum = pgEnum('status_kawin', STATUS_KAWIN_VALUES)
export const jenisKelaminEnum = pgEnum('jenis_kelamin', JENIS_KELAMIN_VALUES)
export const hubunganKeluargaEnum = pgEnum('hubungan_keluarga', HUBUNGAN_KELUARGA_VALUES)
export const pendidikanEnum = pgEnum('pendidikan', PENDIDIKAN_VALUES)
export const agama = pgEnum('agama', AGAMA_VALUES);
export const pekerjaan = pgEnum('pekerjaan', PEKERJAAN_VALUES);
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
// `role` = hak akses, bukan jabatan. Hanya ada dua peran: 'admin' mengelola
// aplikasi, 'kader' mencatat kunjungan. Rekap Kunjungan Rumah memfilter
// pencatat lewat 'kader', dan `requireAdmin` memeriksa 'admin'.
export const role = pgEnum('role', [
  'admin',
  'kader',
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
    // Field yang jawaban-nya baris berulang (anggota keluarga, daftar
    // peserta, daftar masalah). Satu field = satu baris `survey_entries`,
    // isinya array of object di kolom `value` jsonb, jadi unique index
    // (surveyId, fieldId) tetap berlaku. Jumlah baris yang boleh disimpan
    // tidak dibatasi database; validasi batasnya ada di backend.
    "group",
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
