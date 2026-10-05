import { and, asc, desc, eq, inArray, sql } from 'drizzle-orm'
import { db } from '@/lib/db.server'
import { formFieldOptions, formFields, formSections, formVersions } from '@/lib/schema/schema'
import {
  validasiEdisiVersi,
  validasiTerbitkanVersi
  
  
} from './validasi'
import type {HasilValidasi, KodeValidasi} from './validasi';
import { catatAudit } from './audit.server'

/**
 * Error validasi Form Builder. Dibedakan dari error lain supaya route bisa
 * membalas 400 dengan pesan yang bisa ditampilkan ke petugas, bukan 500.
 */
export class KesalahanValidasi extends Error {
  readonly kode: KodeValidasi
  readonly status = 400

  constructor(hasil: Extract<HasilValidasi, { ok: false }>) {
    super(hasil.pesan)
    this.name = 'KesalahanValidasi'
    this.kode = hasil.kode
  }
}

function pastikan(hasil: HasilValidasi): void {
  if (!hasil.ok) throw new KesalahanValidasi(hasil)
}

type Db = typeof db
/**
 * Handle transaksi dari `db.transaction(...)`. Diturunkan dari tipe `db` sendiri
 * supaya tidak perlu paket atau file lain hanya untuk satu alias.
 */
type DbTx = Parameters<Parameters<typeof db.transaction>[0]>[0]
/**
 * Kueri boleh jalan di koneksi biasa (`db`) atau di transaksi yang sedang
 * berjalan. Dipakai pemanggil yang menerima transaksi dari luar supaya seluruh
 * pekerjaannya ikut commit/rollback bersama pemanggil.
 */
type Executor = Db | DbTx

async function ambilStatusVersi(
  executor: Pick<Db, 'select'>,
  formVersionId: string,
): Promise<string | null> {
  const baris = await executor
    .select({ status: formVersions.status })
    .from(formVersions)
    .where(eq(formVersions.id, formVersionId))
    .limit(1)
  return baris[0]?.status ?? null
}

/**
 * Dipanggil sebelum setiap perubahan struktur (section, field, pilihan jawaban).
 * Ini penjaga utama "versi published tidak diedit langsung": begitu published,
 * struktur form membeku dan perubahan harus lewat versi baru.
 */
export async function assertVersiBisaDiubah(
  formVersionId: string,
  executor: Pick<Db, 'select'> = db,
): Promise<void> {
  pastikan(validasiEdisiVersi(await ambilStatusVersi(executor, formVersionId)))
}

/**
 * Terbitkan satu versi form.
 *
 * Satu form hanya boleh punya satu versi `published`. Aturan itu dijaga di sini:
 * versi published lama DIARSIPKAN lebih dulu, lalu versi baru ditulis, dan
 * keduanya dalam satu transaksi. Kalau archiving tidak dilakukan, form punya
 * dua versi published dan pemanggil seperti `daftarFormulirTerisi()` akan
 * menampilkan form yang sama dua kali.
 *
 * Transaksi dipakai karena archiving lalu publishing harus atomik: kalau tidak,
 * ada celah di mana form tidak punya versi published sama sekali dan petugas
 * yang sedang mengisi survei tidak bisa memuat definisi form.
 *
 * Kunci baris `for update` di bawah mencegah dua publish paralel mengarsipkan
 * versi published yang sama. Kalau nanti aturan ini perlu ditegakkan database
 * juga, partial unique index-nya satu baris: `create unique index
 * form_versions_one_published_per_form on form_versions (formId) where status =
 * 'published';`
 */
export async function terbitkanVersiForm(
  formVersionId: string,
  opts: { actorId?: string | null; now?: Date } = {},
): Promise<{ formId: number; version: number; publishedAt: Date }> {
  const now = opts.now ?? new Date()

  const hasil = await db.transaction(async (tx) => {
    // Kunci baris versi dulu supaya dua publish paralel tidak sama-sama membaca
    // status lama lalu sama-sama memutuskan untuk mengarsipkan versi yang sama.
    // Satu-satunya tempat publish dilindungi dari konkurensi.
    await tx.execute(sql`select 1 from form_versions where id = ${formVersionId} for update`)

    const target = await tx
      .select({ formId: formVersions.formId, version: formVersions.version, status: formVersions.status })
      .from(formVersions)
      .where(eq(formVersions.id, formVersionId))
      .limit(1)

    const versi = target[0]
    if (!versi) {
      throw new KesalahanValidasi({ ok: false, kode: 'VERSI_TIDAK_ADA', pesan: 'Form versi tidak ditemukan.' })
    }
    pastikan(validasiTerbitkanVersi(versi.status))

    // publishedAt ikut dikosongkan saat diarsipkan. Ini aman karena check
    // constraint hanya mewajibkan publishedAt pada baris berstatus 'published'.
    await tx
      .update(formVersions)
      .set({ status: 'archived', publishedAt: null, updatedAt: now })
      .where(and(eq(formVersions.formId, versi.formId), eq(formVersions.status, 'published')))

    await tx
      .update(formVersions)
      .set({ status: 'published', publishedAt: now, updatedAt: now })
      .where(eq(formVersions.id, formVersionId))

    return { formId: versi.formId, version: versi.version, publishedAt: now }
  })

  // Audit ditulis DI LUAR transaksi. Kalau publish dibatalkan, tidak boleh ada
  // jejak audit yang menyatakan versi tayang padahal sebenarnya tidak tayang.
  await catatAudit({
    userId: opts.actorId ?? null,
    aksi: 'publish',
    entitas: 'form_versions',
    entitasId: formVersionId,
    sesudah: {
      status: 'published',
      version: hasil.version,
      publishedAt: hasil.publishedAt.toISOString(),
    },
  })

  return hasil
}

/**
 * Versi asal yang strukturnya akan disalin ke draft baru.
 *
 * Kalau `dariVersiId` diberikan, versinya divalidasi dulu: sumber dari form lain
 * harus ditolak, bukan diam-diam menghasilkan draft kosong. Tanpa sumber
 * eksplisit, dipakai versi published terbaru supaya perubahan tayang tidak
 * hilang. Form yang belum pernah tayang memang tidak punya sumber, dan itu
 * bukan error: draft-nya tetap dibuat kosong.
 */
async function cariVersiAsal(
  executor: Executor,
  formId: number,
  dariVersiId: string | undefined,
): Promise<string | null> {
  if (dariVersiId) {
    const asal = await executor
      .select({ formId: formVersions.formId })
      .from(formVersions)
      .where(eq(formVersions.id, dariVersiId))
      .limit(1)
    const baris = asal[0]
    if (!baris || baris.formId !== formId) {
      throw new KesalahanValidasi({
        ok: false,
        kode: 'VERSI_TIDAK_ADA',
        pesan: 'Versi asal tidak ditemukan atau bukan milik form ini.',
      })
    }
    return dariVersiId
  }

  const terbaru = await executor
    .select({ id: formVersions.id })
    .from(formVersions)
    .where(and(eq(formVersions.formId, formId), eq(formVersions.status, 'published')))
    .orderBy(desc(formVersions.version))
    .limit(1)

  return terbaru[0]?.id ?? null
}

/**
 * Salin struktur (section, field, pilihan jawaban) dari satu versi ke versi baru.
 *
 * Semuanya bulk insert: form nyata punya ratusan field, jadi insert per baris
 * akan jadi ratusan round-trip ke database. Id baru dipetakan ke id lama
 * karena `form_fields.sectionId` menunjuk baris versi asal, sedangkan versi baru
 * harus hanya menunjuk baris versi baru.
 */
async function salinStruktur(
  executor: Executor,
  formVersionIdBaru: string,
  formVersionIdAsal: string,
): Promise<void> {
  const asalSection = await executor
    .select({
      id: formSections.id,
      nama: formSections.nama,
      deskripsi: formSections.deskripsi,
      urutan: formSections.urutan,
      aktif: formSections.aktif,
    })
    .from(formSections)
    .where(eq(formSections.formVersionId, formVersionIdAsal))
    .orderBy(asc(formSections.urutan))

  if (asalSection.length === 0) return

  const baruSection = await executor
    .insert(formSections)
    .values(
      asalSection.map((baris) => ({
        formVersionId: formVersionIdBaru,
        nama: baris.nama,
        deskripsi: baris.deskripsi,
        urutan: baris.urutan,
        aktif: baris.aktif,
      })),
    )
    .returning({ id: formSections.id })

  // `orderBy` di query asal yang menjaga urutan: baris ke-i hasil insert
  // adalah salinan baris ke-i versi lama.
  const petaSection = new Map<string, string>()
  asalSection.forEach((asal, i) => {
    const baru = baruSection[i]
    if (baru) petaSection.set(asal.id, baru.id)
  })

  const asalField = await executor
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
    .where(inArray(formFields.sectionId, [...petaSection.keys()]))
    .orderBy(asc(formFields.urutan))

  // Field yang section-nya tidak ikut tersalin (hanya mungkin kalau struktur asal
  // sudah rusak) dilewati, supaya tidak ada field menunjuk section versi lain.
  const fieldTersalin = asalField.flatMap((asal) => {
    const sectionBaru = petaSection.get(asal.sectionId)
    return sectionBaru ? [{ asal, sectionBaru }] : []
  })
  if (fieldTersalin.length === 0) return

  const baruField = await executor
    .insert(formFields)
    .values(
      fieldTersalin.map(({ asal, sectionBaru }) => ({
        formVersionId: formVersionIdBaru,
        sectionId: sectionBaru,
        nama: asal.nama,
        label: asal.label,
        tipe: asal.tipe,
        optionSourceType: asal.optionSourceType,
        optionSourceKey: asal.optionSourceKey,
        deskripsi: asal.deskripsi,
        placeholder: asal.placeholder,
        wajib: asal.wajib,
        urutan: asal.urutan,
        jumlahKolom: asal.jumlahKolom,
        aktif: asal.aktif,
      })),
    )
    .returning({ id: formFields.id })

  const petaField = new Map<string, string>()
  fieldTersalin.forEach(({ asal }, i) => {
    const baru = baruField[i]
    if (baru) petaField.set(asal.id, baru.id)
  })

  const asalOpsi = await executor
    .select({
      fieldId: formFieldOptions.fieldId,
      value: formFieldOptions.value,
      label: formFieldOptions.label,
      urutan: formFieldOptions.urutan,
      aktif: formFieldOptions.aktif,
    })
    .from(formFieldOptions)
    .where(inArray(formFieldOptions.fieldId, [...petaField.keys()]))
    .orderBy(asc(formFieldOptions.urutan))

  const opsiTersalin = asalOpsi.flatMap((asal) => {
    const fieldBaru = petaField.get(asal.fieldId)
    return fieldBaru ? [{ asal, fieldBaru }] : []
  })
  if (opsiTersalin.length === 0) return

  await executor
    .insert(formFieldOptions)
    .values(
      opsiTersalin.map(({ asal, fieldBaru }) => ({
        fieldId: fieldBaru,
        value: asal.value,
        label: asal.label,
        urutan: asal.urutan,
        aktif: asal.aktif,
      })),
    )
    .returning({ id: formFieldOptions.id })
}

/**
 * Buat draft berikutnya dari versi yang ada.
 *
 * Dipakai saat admin mau mengubah form yang sudah tayang: versi published lama
 * dibekukan (lihat assertVersiBisaDiubah), jadi perubahan harus punya tempat
 * baru. Nomor versi dihitung dari yang terbesar, bukan dari jumlah baris, supaya
 * aman dari versi archived bernomor lebih besar. Dengan begitu penomoran selalu
 * naik dan tidak bentrok dengan unique index (formId, version).
 *
 * `opts.tx` dipakai pemanggil yang sudah punya transaksi sendiri. Tanpa itu
 * fungsi ini membuka `db.transaction` baru, yang mengambil koneksi pool lain
 * dan tidak melihat baris yang belum commit pemanggil — termasuk baris `forms`
 * baru, sehingga insert versi gagal FK.
 */
export async function buatDraftBerikutnya(
  formId: number,
  opts: { dariVersiId?: string; tx?: DbTx } = {},
): Promise<string> {
  const buat = async (executor: Executor): Promise<string> => {
    const versiAsalId = await cariVersiAsal(executor, formId, opts.dariVersiId)

    const [tertinggi] = await executor
      .select({ maks: sql<number>`coalesce(max(${formVersions.version}), 0)` })
      .from(formVersions)
      .where(eq(formVersions.formId, formId))

    const baris = await executor
      .insert(formVersions)
      .values({ formId, version: (tertinggi?.maks ?? 0) + 1, status: 'draft' })
      .returning({ id: formVersions.id })

    const baru = baris[0]
    if (!baru) {
      throw new KesalahanValidasi({
        ok: false,
        kode: 'VERSI_TIDAK_ADA',
        pesan: 'Gagal membuat draft versi form.',
      })
    }

    // Struktur ikut disalin supaya petugas mengubah form yang sudah ada dari
    // isian yang sudah ada, bukan dari layar kosong.
    if (versiAsalId) {
      await salinStruktur(executor, baru.id, versiAsalId)
    }

    return baru.id
  }

  // Transaksi dibuka tepat satu kali: kalau pemanggil sudah memberi `tx`,
  // membuka `db.transaction` kedua akan memecah atomisitasnya.
  return opts.tx ? await buat(opts.tx) : await db.transaction(buat)
}
