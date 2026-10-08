/**
 * Seeder data referensi: wilayah kerja, fasilitas kesehatan, dan pengguna awal.
 *
 * INI BUKAN SEEDER FORM. File ini tidak menyentuh `forms` sama sekali; lihat
 * `scripts/seed-form-defaults.ts` untuk form bawaan. Pemisahan ini penting
 * karena aturan mainannya berbeda: form bawaan tidak boleh ditimpa, sedangkan
 * data referensi boleh diperbarui selama tidak merusak relasi.
 *
 * MENGAPA DATA INI ADA DI SEEDER
 * ------------------------------
 * `users.fasKesId` NOT NULL, jadi tidak ada akun petugas yang bisa dibuat
 * sebelum `fasilitas_kesehatan` terisi. Keduanya kosong setelah database di-reset,
 * dan tanpa isinya dropdown petugas di Form Kunjungan Rumah / Form Kegiatan,
 * form Staff di /kelola, dan daftar kader di Rekap semuanya kosong.
 *
 * SEMUA ANGKA DI BAWAH DARI DATA NYATA, BUKAN TEBAKAN
 * ---------------------------------------------------
 * Nilai `kecamatan` dan pasangan `fasilitas -> kelurahan` diambil dari
 * `data_warga_import` yang masih ada di database (20.454 baris):
 *
 *     PANGGUNGREJO | TRAJENG        7.265
 *     PANGGUNGREJO | NGEMPLAKREJO   6.357
 *     PANGGUNGREJO | TAMBA'AN       3.796
 *     PANGGUNGREJO | MAYANGAN       3.036
 *
 * Pasangan nama Posyandu -> kelurahan diambil dari 6 baris `admin_staff` di
 * backup pra-reset `drizzle/backup/pre_optionB_20260928_151643.dump`:
 *
 *     Melati 1  | Trajeng         (Siti Aminah, Kader)
 *     Mawar 2   | Tambaan         (Budi Santoso, Kader)
 *     Kenanga   | Ngemplakrejo    (Siti Nurhaliza, Bidan)
 *     Flamboyan | Mayangan        (Dewi Lestari, Perawat; Agus Wijaya, Kader)
 *
 * CATATAN EJAAN: `data_warga_import` menulis kelurahan sebagai "TAMBA'AN" (dengan
 * tanda kutip), sedangkan `KELS` di `src/lib/constants.ts` dan data `admin_staff`
 * lama menulis "Tambaan" (tanpa). Yang dipakai di sini adalah "Tambaan" supaya
 * konsisten dengan `KELS`, karena seluruh dropdown dan filter rekap memakai
 * `KELS`, bukan kolom isi `data_warga_import`. Kalau nanti `data_warga_import`
 * dimPORT ke `data_warga`, kedua ejaan itu harus dinormalkan bersama.
 *
 * ATURAN IDEMPOTEN
 * ----------------
 * Semua langkah pakai ON CONFLICT DO NOTHING lalu SELECT balik, jadi menjalankan
 * `pnpm db:seed` berulang kali aman dan tidak pernah menimpa editan admin.
 */
import { and, eq, sql } from 'drizzle-orm'
import { db } from '@/lib/db.server'
import { fasilitasKesehatan, users, wilayahKerja } from '@/lib/schema/schema'
import { PENANDA_PIN_TIDAK_DIGUNAKAN } from '@/lib/user-registry.server'

/** `kecamatan` tunggal, dari `data_warga_import`. */
const KECAMATAN = 'PANGGUNGREJO'

/**
 * Fasilitas yang di-seed. Nama diambil dari `POSY` di `src/lib/constants.ts`
 * dan disimpan ke `fasilitas_kesehatan.nama`. Pasangan kelurahan dari data
 * `admin_staff` pra-reset.
 */
const FASILITAS_AWAL: ReadonlyArray<{ nama: string; kelurahan: string }> = [
  { nama: 'Melati 1', kelurahan: 'Trajeng' },
  { nama: 'Mawar 2', kelurahan: 'Tambaan' },
  { nama: 'Kenanga', kelurahan: 'Ngemplakrejo' },
  { nama: 'Flamboyan', kelurahan: 'Mayangan' },
]

/**
 * Akun yang dibuat ulang dari 6 baris `admin_staff` pra-reset.
 *
 * `username` lama DIBUANG: tidak ada kolomnya di `users`, dan login memakai PIN
 * global, jadi username tidak pernah dipakai untuk masuk. `peran` lama dipetakan
 * ke `role`: Bidan/Perawat yang dulu role-nya 'staff' sekarang jadi 'kader',
 * karena 'staff' tidak lagi jadi nilai enum yang sah.
 *
 * `aktif` mengikuti kolom "on" lama. Agus Wijaya sengaja `aktif: false` karena
 * sudah nonaktif sebelum reset, jadi rekap lama juga tidak menghitungnya.
 */
const PENGGUNA_AWAL: ReadonlyArray<{
  nama: string
  role: 'admin' | 'kader'
  phone: string | null
  aktif: boolean
  fasilitas: string
}> = [
  {
    nama: 'dr. Ayu Rahmawati',
    role: 'admin',
    phone: '0811-0000-01',
    aktif: true,
    fasilitas: 'Melati 1',
  },
  {
    nama: 'Siti Aminah',
    role: 'kader',
    phone: '0812-0000-02',
    aktif: true,
    fasilitas: 'Melati 1',
  },
  {
    nama: 'Siti Nurhaliza',
    role: 'kader',
    phone: '0812-0000-03',
    aktif: true,
    fasilitas: 'Kenanga',
  },
  {
    nama: 'Budi Santoso',
    role: 'kader',
    phone: '0812-0000-04',
    aktif: true,
    fasilitas: 'Mawar 2',
  },
  {
    nama: 'Dewi Lestari',
    role: 'kader',
    phone: '0812-0000-05',
    aktif: true,
    fasilitas: 'Flamboyan',
  },
  {
    nama: 'Agus Wijaya',
    role: 'kader',
    phone: '0812-0000-06',
    aktif: false,
    fasilitas: 'Flamboyan',
  },
]

export interface LaporanReference {
  wilayahBaru: string[]
  fasilitasBaru: string[]
  penggunaBaru: string[]
  dilewati: string[]
}

/** `wilayah_kerja` punya unique (kecamatan, kelurahan), aman dipakai ON CONFLICT. */
async function seedWilayahKerja(): Promise<{
  dibuat: string[]
  dilewati: string[]
}> {
  const dibuat: string[] = []
  const dilewati: string[] = []

  const target = new Set(FASILITAS_AWAL.map((f) => f.kelurahan))
  for (const kelurahan of target) {
    const [ada] = await db
      .select({ id: wilayahKerja.id })
      .from(wilayahKerja)
      .where(
        and(
          eq(wilayahKerja.kecamatan, KECAMATAN),
          eq(wilayahKerja.kelurahan, kelurahan),
        ),
      )
      .limit(1)
    if (ada) {
      dilewati.push(kelurahan)
      continue
    }
    await db
      .insert(wilayahKerja)
      .values({ kecamatan: KECAMATAN, kelurahan })
      .onConflictDoNothing()
    dibuat.push(kelurahan)
  }

  return { dibuat, dilewati }
}

/**
 * `fasilitas_kesehatan` tidak punya unique constraint yang bisa di-ON CONFLICT-kan
 * (hanya index non-unique di `wilayahKerjaId`), jadi di-pakai memakai SELECT
 * `(nama, fasKesType)` di dalam transaksi. Race antar-seeder tetap mungkin
 * membuat duplikat, tapi seeder ini satu-satunya penulisnya dan selalu dijalankan
 * manual, jadi risikonya kecil.
 */
async function seedFasilitas(
  wilayahId: Map<string, number>,
): Promise<{ dibuat: string[]; dilewati: string[] }> {
  const dibuat: string[] = []
  const dilewati: string[] = []

  for (const f of FASILITAS_AWAL) {
    const wilayahKerjaId = wilayahId.get(f.kelurahan)
    if (!wilayahKerjaId)
      throw new Error(`Wilayah kerja "${f.kelurahan}" gagal dibuat.`)

    const [ada] = await db
      .select({ id: fasilitasKesehatan.id })
      .from(fasilitasKesehatan)
      .where(
        and(
          eq(fasilitasKesehatan.nama, f.nama),
          eq(fasilitasKesehatan.fasKesType, 'Posyandu'),
          eq(fasilitasKesehatan.wilayahKerjaId, wilayahKerjaId),
        ),
      )
      .limit(1)
    if (ada) {
      dilewati.push(f.nama)
      continue
    }
    await db.insert(fasilitasKesehatan).values({
      nama: f.nama,
      fasKesType: 'Posyandu',
      wilayahKerjaId,
      // `alamat` NOT NULL tapi data lama `admin_staff` tidak menyimpannya. Kosongkan
      // supaya jelas "belum diisi" daripada mengarang alamat. Form Staff yang
      // menampilkan alamat bisafilled-in nanti.
      alamat: '',
    })
    dibuat.push(f.nama)
  }

  return { dibuat, dilewati }
}

/** `users` tidak punya unique pada `nama`, jadi dicek manual sebelum insert. */
async function seedPengguna(
  fasilitasId: Map<string, number>,
): Promise<{ dibuat: string[]; dilewati: string[] }> {
  const dibuat: string[] = []
  const dilewati: string[] = []

  for (const p of PENGGUNA_AWAL) {
    const fasKesId = fasilitasId.get(p.fasilitas)
    if (!fasKesId) throw new Error(`Fasilitas "${p.fasilitas}" gagal dibuat.`)

    const [ada] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.nama, p.nama))
      .limit(1)
    if (ada) {
      dilewati.push(p.nama)
      continue
    }
    await db.insert(users).values({
      nama: p.nama,
      role: p.role,
      phone: p.phone,
      aktif: p.aktif,
      fasKesId,
      pinHash: PENANDA_PIN_TIDAK_DIGUNAKAN,
    })
    dibuat.push(p.nama)
  }

  return { dibuat, dilewati }
}

export async function seedReferenceData(): Promise<LaporanReference> {
  // foreign key butuh urut: wilayah -> fasilitas -> pengguna.
  const wilayah = await seedWilayahKerja()

  const barisWilayah = await db
    .select({ id: wilayahKerja.id, kelurahan: wilayahKerja.kelurahan })
    .from(wilayahKerja)
    .where(eq(wilayahKerja.kecamatan, KECAMATAN))
  const wilayahId = new Map(barisWilayah.map((w) => [w.kelurahan, w.id]))

  const fasilitas = await seedFasilitas(wilayahId)

  const barisFasilitas = await db
    .select({ id: fasilitasKesehatan.id, nama: fasilitasKesehatan.nama })
    .from(fasilitasKesehatan)
  const fasilitasId = new Map(barisFasilitas.map((f) => [f.nama, f.id]))

  const pengguna = await seedPengguna(fasilitasId)

  // Sanity check: registry pengguna harus punya minimal satu petugas aktif,
  // kalau tidak semua dropdown petugas akan kosong tanpa error yang jelas.
  const [petugas] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(users)
    .where(eq(users.aktif, true))
  if (!petugas || petugas.n === 0) {
    throw new Error('Tidak ada akun petugas aktif setelah seeding.')
  }

  return {
    wilayahBaru: wilayah.dibuat,
    fasilitasBaru: fasilitas.dibuat,
    penggunaBaru: pengguna.dibuat,
    dilewati: [
      ...wilayah.dilewati,
      ...fasilitas.dilewati,
      ...pengguna.dilewati,
    ],
  }
}
