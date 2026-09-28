import { eq } from 'drizzle-orm'
import { db } from '@/lib/db.server'
import { formSections, formVersions } from '@/lib/schema/schema'
import { validasiParentSection  } from './validasi'
import type {HasilValidasi} from './validasi';
import { KesalahanValidasi, assertVersiBisaDiubah } from './form-version.server'
import { catatAudit } from './audit.server'

/**
 * Integritas section terhadap form versi.
 *
 * `form_sections.parentId` hanya FK ke `form_sections.id`, jadi database
 * menerima section yang parent-nya berasal dari versi form lain. Aturan ini
 * divalidasi di backend sesuai keputusan proyek; composite FK untuk parent tidak
 * dipakai karena butuh trigger untuk pesan error yang bisa dibaca petugas.
 */

function pastikan(hasil: HasilValidasi): void {
  if (!hasil.ok) throw new KesalahanValidasi(hasil)
}

type Db = typeof db

/** Cukup untuk select; dipakai agar bisa menerima `db` maupun objek transaksi. */
type Pemilih = { select: Db['select'] }

interface BarisSeksi {
  id: string
  formVersionId: string
  parentId: string | null
  nama: string
}

/**
 * Rantai ancestor dari `parentId` ke root, untuk menolak parent yang membuat
 * hierarki berputar. Tanpa ini, perubahan parent bisa membuat A -> B -> A dan
 * seluruh field anak tidak pernah tampil.
 *
 * `parentId` sudah `on delete cascade`, jadi baris ancestor tidak mungkin hilang
 * di tengah operasi ini. Panjang rantai dibatasi supaya data rusak tidak
 * membuat query ini berjalan tanpa henti.
 */
const MAX_DEPTH = 20

async function ambilAncestor(
  executor: Pemilih,
  parentId: string,
): Promise<string[]> {
  const rantai: string[] = []
  let kursor: string | null = parentId

  for (let i = 0; i < MAX_DEPTH && kursor !== null; i += 1) {
    const baris = await executor
      .select({ parentId: formSections.parentId })
      .from(formSections)
      .where(eq(formSections.id, kursor))
      .limit(1)

    if (!baris[0]) break
    rantai.push(kursor)
    kursor = baris[0].parentId
  }

  return rantai
}

async function ambilSection(
  executor: Pemilih,
  sectionId: string,
): Promise<BarisSeksi | null> {
  const baris = await executor
    .select({
      id: formSections.id,
      formVersionId: formSections.formVersionId,
      parentId: formSections.parentId,
      nama: formSections.nama,
    })
    .from(formSections)
    .where(eq(formSections.id, sectionId))
    .limit(1)
  return baris[0] ?? null
}

export interface SimpanSectionInput {
  formVersionId: string
  nama: string
  deskripsi?: string | null
  urutan: number
  aktif?: boolean
  /** null atau tidak diisi = section root. */
  parentId?: string | null
  /** Diisi saat update, null saat create. */
  sectionId?: string | null
  actorId?: string | null
}

export async function simpanSection(input: SimpanSectionInput): Promise<string> {
  const { formVersionId, nama, deskripsi, urutan, aktif, parentId, sectionId, actorId } = input

  // Urutan validasi: versi harus bisa diubah dulu, baru soal parent. Kalau versi
  // sudah published, petugas tidak perlu tahu juga detail masalah parent-nya.
  await assertVersiBisaDiubah(formVersionId)

  const parentIdBersih = parentId ?? null
  let validasiParent: HasilValidasi = { ok: true }

  if (parentIdBersih !== null) {
    const parent = await ambilSection(db, parentIdBersih)
    validasiParent = validasiParentSection({
      formVersionId,
      parentId: parentIdBersih,
      sectionId: sectionId ?? null,
      parentFormVersionId: parent ? parent.formVersionId : null,
      ancestorIds: await ambilAncestor(db, parentIdBersih),
    })
    pastikan(validasiParent)
  }

  const now = new Date()

  const tersimpan = await db.transaction(async (tx) => {
    if (sectionId) {
      const [baris] = await tx
        .update(formSections)
        .set({
          nama,
          deskripsi: deskripsi ?? null,
          urutan,
          aktif: aktif ?? true,
          parentId: parentIdBersih,
          updatedAt: now,
        })
        .where(eq(formSections.id, sectionId))
        .returning({ id: formSections.id })

      if (!baris) {
        throw new KesalahanValidasi({
          ok: false,
          kode: 'VERSI_TIDAK_ADA',
          pesan: 'Section tidak ditemukan.',
        })
      }
      return baris.id
    }

    const baris = await tx
      .insert(formSections)
      .values({
        formVersionId,
        nama,
        deskripsi: deskripsi ?? null,
        urutan,
        aktif: aktif ?? true,
        parentId: parentIdBersih,
      })
      .returning({ id: formSections.id })

    const baru = baris[0]
    if (!baru) {
      throw new KesalahanValidasi({
        ok: false,
        kode: 'VERSI_TIDAK_ADA',
        pesan: 'Gagal menyimpan section.',
      })
    }
    return baru.id
  })

  await catatAudit({
    userId: actorId ?? null,
    aksi: sectionId ? 'update' : 'create',
    entitas: 'form_sections',
    entitasId: tersimpan,
    sesudah: { formVersionId, nama, urutan, parentId: parentIdBersih },
  })

  return tersimpan
}

/**
 * Hapus section. Section anak, field, aturan, dan jawaban ikut terhapus lewat
 * `on delete cascade` yang sudah ada di schema — jadi tidak perlu rekursi manual
 * di sini yang rawan salah dan sulit diuji.
 */
export async function hapusSection(
  sectionId: string,
  actorId?: string | null,
): Promise<void> {
  const section = await ambilSection(db, sectionId)
  if (!section) {
    throw new KesalahanValidasi({
      ok: false,
      kode: 'VERSI_TIDAK_ADA',
      pesan: 'Section tidak ditemukan.',
    })
  }
  await assertVersiBisaDiubah(section.formVersionId)

  await db.delete(formSections).where(eq(formSections.id, sectionId))

  await catatAudit({
    userId: actorId ?? null,
    aksi: 'delete',
    entitas: 'form_sections',
    entitasId: sectionId,
    sebelum: { nama: section.nama, formVersionId: section.formVersionId },
  })
}

/** Versi form beserta section-nya, untuk render editor. */
export async function ambilDefinisiVersi(formVersionId: string) {
  const versi = await db
    .select({
      id: formVersions.id,
      formId: formVersions.formId,
      version: formVersions.version,
      status: formVersions.status,
      publishedAt: formVersions.publishedAt,
    })
    .from(formVersions)
    .where(eq(formVersions.id, formVersionId))
    .limit(1)

  if (!versi[0]) {
    throw new KesalahanValidasi({
      ok: false,
      kode: 'VERSI_TIDAK_ADA',
      pesan: 'Form versi tidak ditemukan.',
    })
  }

  const sections = await db
    .select({
      id: formSections.id,
      formVersionId: formSections.formVersionId,
      parentId: formSections.parentId,
      nama: formSections.nama,
      deskripsi: formSections.deskripsi,
      urutan: formSections.urutan,
      aktif: formSections.aktif,
    })
    .from(formSections)
    .where(eq(formSections.formVersionId, formVersionId))

  return { ...versi[0], sections }
}
