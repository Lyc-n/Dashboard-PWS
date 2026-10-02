/**
 * Operasi level form (bukan struktur isinya): buat form, ubah metadata, aktifkan.
 *
 * Form terbagi dua jenis dan bedanya ada di `forms.kode`: form bawaan punya kode
 * stabil (lihat KODE_FORM_BAWAAN di src/lib/constants.ts) supaya seeding
 * idempotent, form yang dibuat manual di editor selalu `kode is null`. Kode tidak
 * pernah ditulis dari sini — kolom itu milik seeder, bukan milik petugas.
 *
 * Service ini TIDAK memanggil `assertVersiBisaDiubah`: yang diedit di sini adalah
 * baris `forms`, bukan struktur form. Penjaga "published tidak bisa diedit" tetap
 * berlaku untuk section dan field (lihat build.server.ts).
 */
import { asc, desc, eq, isNull } from 'drizzle-orm'
import { db } from '@/lib/db.server'
import { forms, formVersions } from '@/lib/schema/schema'
import { KesalahanValidasi, buatDraftBerikutnya } from './form-version.server'
import { catatAudit } from './audit.server'

/**
 * Kode error PostgreSQL untuk unique violation. `forms.nama` punya unique
 * constraint, jadi nama form ganda harus dibalas sebagai pesan yang bisa dibaca
 * petugas, bukan error 500.
 */
const UNIQUE_VIOLATION = '23505'

function kodePostgres(err: unknown): string | null {
  if (typeof err !== 'object' || err === null) return null
  const kode = (err as { code?: unknown }).code
  return typeof kode === 'string' ? kode : null
}

/** Form yang dibuat manual di editor, urut nama. */
export async function listFormBaru() {
  return await db
    .select({
      id: forms.id,
      nama: forms.nama,
      deskripsi: forms.deskripsi,
      subjekWargaWajib: forms.subjekWargaWajib,
      aktif: forms.aktif,
      createdAt: forms.createdAt,
    })
    .from(forms)
    .where(isNull(forms.kode))
    .orderBy(asc(forms.nama))
}

/**
 * Daftar versi satu form, nomor versi terbesar di atas supaya draft terbaru
 * selalu baris pertama.
 *
 * `listFormBaru` hanya mengembalikan baris `forms`, jadi UI tidak bisa tahu
 * versi mana yang tayang dan mana yang masih draft tanpa kueri tambahan.
 * Read only: tidak menyentuh struktur form, jadi penjaga published tidak
 * relevan dan tidak ada jejak audit.
 */
export async function daftarVersiForm(formId: number) {
  // Nomor id datang dari server function, jadi harus dicek: `Number.isInteger`
  // sekaligus menolak undefined, NaN, dan pecahan sebelum sampai query.
  if (!Number.isInteger(formId) || formId < 1) {
    throw new KesalahanValidasi({
      ok: false,
      kode: 'VERSI_TIDAK_ADA',
      pesan: 'Form tidak valid.',
    })
  }

  return await db
    .select({
      id: formVersions.id,
      formId: formVersions.formId,
      version: formVersions.version,
      status: formVersions.status,
      publishedAt: formVersions.publishedAt,
    })
    .from(formVersions)
    .where(eq(formVersions.formId, formId))
    .orderBy(desc(formVersions.version))
}

export interface BuatFormBaruInput {
  nama: string
  deskripsi?: string | null
  actorId?: string | null
}

export interface HasilBuatFormBaru {
  formId: number
  formVersionId: string
}

/**
 * Buat form manual beserta versi draft pertamanya.
 *
 * Insert form dan pembuatan draft harus satu transaksi: form tanpa versi draft
 * tidak bisa diisi apa pun, dan petugas yang baru saja membuat form akan
 * menemukan editor kosong tanpa penjelasan kalau versi gagal dibuat.
 * Transaksi `tx` diteruskan eksplisit ke `buatDraftBerikutnya` — kalau fungsi
 * itu membuka `db.transaction` sendiri, ia dapat koneksi pool lain, tidak
 * melihat baris `forms` yang belum commit, dan insert versi gagal FK.
 */
export async function buatFormBaru(input: BuatFormBaruInput): Promise<HasilBuatFormBaru> {
  const { nama, deskripsi, actorId } = input
  const namaBersih = nama.trim()

  try {
    const hasil = await db.transaction(async (tx) => {
      const [baris] = await tx
        .insert(forms)
        .values({
          nama: namaBersih,
          kode: null,
          deskripsi: deskripsi ?? null,
          subjekWargaWajib: true,
          aktif: true,
        })
        .returning({ id: forms.id })

      if (!baris) {
        throw new KesalahanValidasi({
          ok: false,
          kode: 'VERSI_TIDAK_ADA',
          pesan: 'Gagal membuat form.',
        })
      }

      const formVersionId = await buatDraftBerikutnya(baris.id, { tx })
      return { formId: baris.id, formVersionId }
    })

    await catatAudit({
      userId: actorId ?? null,
      aksi: 'create',
      entitas: 'forms',
      entitasId: String(hasil.formId),
      sesudah: { nama: namaBersih, deskripsi: deskripsi ?? null, formVersionId: hasil.formVersionId },
    })

    return hasil
  } catch (err) {
    if (kodePostgres(err) === UNIQUE_VIOLATION) {
      throw new KesalahanValidasi({
        ok: false,
        kode: 'NAMA_FORM_BENTARAK',
        pesan: `Form dengan nama "${namaBersih}" sudah ada. Pilih nama lain.`,
      })
    }
    throw err
  }
}

/**
 * Hapus form beserta semua versinya. Versi, section, field, opsi, aturan
 * ikut terhapus lewat on delete cascade. Form bawaan (kode != null) tidak
 * bisa dihapus lewat fungsi ini — hanya form manual (kode is null).
 */
export async function hapusForm(input: {
  formId: number
  actorId?: string | null
}): Promise<void> {
  const { formId, actorId } = input

  const form = await db
    .select({ id: forms.id, kode: forms.kode, nama: forms.nama })
    .from(forms)
    .where(eq(forms.id, formId))
    .limit(1)

  if (!form[0]) {
    throw new KesalahanValidasi({
      ok: false,
      kode: 'VERSI_TIDAK_ADA',
      pesan: 'Form tidak ditemukan.',
    })
  }

  if (form[0].kode !== null) {
    throw new KesalahanValidasi({
      ok: false,
      kode: 'FORM_BAWAAN',
      pesan: 'Form bawaan sistem tidak bisa dihapus.',
    })
  }

  await db.delete(forms).where(eq(forms.id, formId))

  await catatAudit({
    userId: actorId ?? null,
    aksi: 'delete',
    entitas: 'forms',
    entitasId: String(formId),
    sebelum: { nama: form[0].nama, kode: form[0].kode },
  })
}
