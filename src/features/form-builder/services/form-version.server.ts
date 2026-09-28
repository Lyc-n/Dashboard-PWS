import { and, eq, sql } from 'drizzle-orm'
import { db } from '@/lib/db.server'
import { formVersions } from '@/lib/schema/schema'
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
 * Dipanggil sebelum setiap perubahan struktur (section, field, aturan).
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
 * Satu form hanya boleh punya satu versi `published`, dan itu dijamin database
 * lewat partial unique index `form_versions_one_published_per_form`. Service ini
 * karena itu WAJIB mengarsipkan versi published lama di transaksi yang sama,
 * kalau tidak publish kedua akan gagal dengan error unique yang tidak jelas
 * untuk petugas.
 *
 * Transaksi dipakai karena archiving lalu publishing harus atomik: kalau tidak,
 * ada celah di mana form tidak punya versi published sama sekali dan petugas
 * yang sedang mengisi survei tidak bisa memuat definisi form.
 */
export async function terbitkanVersiForm(
  formVersionId: string,
  opts: { actorId?: string | null; now?: Date } = {},
): Promise<{ formId: number; version: number; publishedAt: Date }> {
  const now = opts.now ?? new Date()

  const hasil = await db.transaction(async (tx) => {
    // Kunci baris versi dulu supaya dua publish paralel tidak sama-sama membaca
    // status lama lalu sama-sama memutuskan untuk mengarsipkan versi yang sama.
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
 * Buat draft berikutnya dari versi yang ada.
 *
 * Dipakai saat admin mau mengubah form yang sudah tayang: versi published lama
 * dibekukan (lihat assertVersiBisaDiubah), jadi perubahan harus punya tempat
 * baru. Nomor versi dihitung dari yang terbesar, bukan dari jumlah baris, supaya
 * aman dari versi archived bernomor lebih besar. Dengan begitu penomoran selalu
 * naik dan tidak bentrok dengan unique index (formId, version).
 */
export async function buatDraftBerikutnya(
  formId: number,
  opts: { dariVersiId?: string } = {},
): Promise<string> {
  return db.transaction(async (tx) => {
    if (opts.dariVersiId) {
      const asal = await tx
        .select({ formId: formVersions.formId })
        .from(formVersions)
        .where(eq(formVersions.id, opts.dariVersiId))
        .limit(1)
      if (!asal[0] || asal[0].formId !== formId) {
        throw new KesalahanValidasi({
          ok: false,
          kode: 'VERSI_TIDAK_ADA',
          pesan: 'Versi asal tidak ditemukan atau bukan milik form ini.',
        })
      }
    }

    const [tertinggi] = await tx
      .select({ maks: sql<number>`coalesce(max(${formVersions.version}), 0)` })
      .from(formVersions)
      .where(eq(formVersions.formId, formId))

    const baris = await tx
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
    return baru.id
  })
}
