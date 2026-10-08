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
import { asc, desc, eq, inArray, sql } from 'drizzle-orm'
import { db } from '@/lib/db.server'
import { forms, formVersions, surveys } from '@/lib/schema/schema'
import { KesalahanValidasi, buatDraftBerikutnya } from './form-version.server'
import { catatAudit } from './audit.server'
import type { RingkasanHapusForm } from './validasi'
import { validasiHapusForm } from './validasi'

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

/**
 * Semua form, urut nama.
 *
 * Form bawaan sistem ikut ditampilkan, tidak cuma yang dibuat manual di editor.
 * Alasannya keduanya memang satu bentuk kerja: definisi form bawaan disimpan di
 * tabel yang sama dan disunting lewat draft/publish yang sama, jadi menyembunyikannya
 * hanya membuat admin mencari tempat lain yang tidak ada.
 *
 * Bedanya nanti ada di UI: `bawaan` menandai form yang tidak boleh dihapus dan
 * strukturnya terkunci (lihat `kode-bawaan.ts`). Penegakannya tetap di server —
 * `ringkasanHapusForm` menolak form berkode dan `buildFormVersion` menolak
 * perubahan struktur yang tidak diizinkan — jadi penanda ini untuk tampilan saja.
 */
export async function listFormBaru() {
  return await db
    .select({
      id: forms.id,
      nama: forms.nama,
      kode: forms.kode,
      deskripsi: forms.deskripsi,
      subjekWargaWajib: forms.subjekWargaWajib,
      aktif: forms.aktif,
      createdAt: forms.createdAt,
    })
    .from(forms)
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
export async function buatFormBaru(
  input: BuatFormBaruInput,
): Promise<HasilBuatFormBaru> {
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
          // FALSE, bukan true: form buatan Form Builder tidak selalu per-warga.
          // Kalau true, setiap submit dipaksa meminta NIK warga, dan baris itu
          // ikut terhitung sebagai "warga dikunjungi" di dashboard, /sasaran,
          // dan laporan — padahal isiannya bisa tentang apa saja. Form yang
          // memang per-warga dibuat lewat Form Kunjungan Rumah, yang
          // `subjekWargaWajib`-nya sudah diatur terpisah di seeder.
          subjekWargaWajib: false,
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
      sesudah: {
        nama: namaBersih,
        deskripsi: deskripsi ?? null,
        formVersionId: hasil.formVersionId,
      },
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
 * Ringkasan isi satu form, dihitung sebelum dihapus.
 *
 * Dipakai untuk dua hal: memberi tahu apakah form masih aman dihapus tanpa
 * konfirmasi tambahan, dan memberi tahu admin berapa banyak data yang akan
 * hilang. Satu query dengan subquery teragregasi, bukan satu query per angka —
 * tabel `surveys` sudah berisi data warga yang tidak boleh dipindai berulang.
 */
export async function ringkasanHapusForm(
  formId: number,
): Promise<RingkasanHapusForm> {
  if (!Number.isInteger(formId) || formId < 1) {
    throw new KesalahanValidasi({
      ok: false,
      kode: 'VERSI_TIDAK_ADA',
      pesan: 'Form tidak valid.',
    })
  }

  const form = await db
    .select({ nama: forms.nama, kode: forms.kode })
    .from(forms)
    .where(eq(forms.id, formId))
    .limit(1)

  const baris = form[0]
  if (!baris) {
    throw new KesalahanValidasi({
      ok: false,
      kode: 'VERSI_TIDAK_ADA',
      pesan: 'Form tidak ditemukan.',
    })
  }
  if (baris.kode !== null) {
    throw new KesalahanValidasi({
      ok: false,
      kode: 'FORM_BAWAAN',
      pesan: 'Form bawaan sistem tidak bisa dihapus.',
    })
  }

  const [hasil] = await db.execute(sql`
    SELECT
      (SELECT COUNT(*)::int FROM form_versions fv WHERE fv."formId" = ${formId})          AS "jumlahVersi",
      (SELECT COUNT(*)::int FROM surveys s
        WHERE s."formVersionId" IN (SELECT id FROM form_versions fv2 WHERE fv2."formId" = ${formId})
      )                                                                                  AS "jumlahSubmit",
      (SELECT COUNT(*)::int FROM survey_entries e
        WHERE e."surveyId" IN (
          SELECT s2.id FROM surveys s2
          WHERE s2."formVersionId" IN (SELECT id FROM form_versions fv3 WHERE fv3."formId" = ${formId})
        )
      )                                                                                  AS "jumlahJawaban",
      (SELECT COUNT(DISTINCT s4."wargaNik")::int FROM surveys s4
        WHERE s4."wargaNik" IS NOT NULL
          AND s4."formVersionId" IN (SELECT id FROM form_versions fv5 WHERE fv5."formId" = ${formId})
      )                                                                                  AS "jumlahWarga",
      (SELECT to_char(MAX(s5."tanggal"), 'YYYY-MM-DD') FROM surveys s5
        WHERE s5."formVersionId" IN (SELECT id FROM form_versions fv6 WHERE fv6."formId" = ${formId})
      )                                                                                  AS "tanggalTerakhir"
  `)

  // `db.execute` mengembalikan baris postgres apa adanya; semua angka sudah
  // di-cast ke int di SQL, jadi di sini hanya dibaca sebagai number.
  const angka = hasil as Record<string, unknown> as {
    jumlahVersi?: number
    jumlahSubmit?: number
    jumlahJawaban?: number
    jumlahWarga?: number
    tanggalTerakhir?: string | null
  }

  return {
    jumlahVersi: angka.jumlahVersi ?? 0,
    jumlahSubmit: angka.jumlahSubmit ?? 0,
    jumlahJawaban: angka.jumlahJawaban ?? 0,
    jumlahWarga: angka.jumlahWarga ?? 0,
    tanggalTerakhir: angka.tanggalTerakhir ?? null,
  }
}

/** Hasil hapus, supaya UI bisa menyebut angka yang benar-benar hilang. */
export interface HasilHapusForm {
  jumlahVersi: number
  jumlahSubmit: number
  jumlahJawaban: number
  jumlahWarga: number
}

/**
 * Hapus form beserta semua versinya — termasuk isiannya kalau form sudah
 * pernah diisi.
 *
 * Dua tahap, karena `surveys.formVersionId` tidak meng-cascade: kalau isian
 * masih ada, `DELETE FROM forms` ditolak Postgres dengan pelanggaran FK yang
 * tidak berguna untuk petugas. Jadi isian dihapus lebih dulu secara eksplisit,
 * baru form-nya.
 *
 * Urutan penghapusan (semua dalam satu transaksi):
 *   1. `surveys` milik semua versi form ini. `survey_entries` ikut cascade dari
 *      `surveys` — sekaligus membongkar FK `survey_entries.fieldId` yang kalau
 *      tidak akan menahan penghapusan `form_fields`.
 *   2. `forms`; versi, section, field, dan pilihan jawaban ikut cascade dari situ.
 *
 * Aturan utamanya ada di `validasiHapusForm`): form bawaan tidak boleh dihapus,
 * form berisian hanya boleh dihapus dengan `hapusPermanent` + konfirmasi nama.
 */
export async function hapusForm(input: {
  formId: number
  hapusPermanent?: boolean
  konfirmasiNama?: string | null
  actorId?: string | null
}): Promise<HasilHapusForm> {
  const { formId, hapusPermanent, konfirmasiNama, actorId } = input

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

  const ringkasan = await ringkasanHapusForm(formId)
  const validasi = validasiHapusForm({
    nama: form[0].nama,
    kode: form[0].kode,
    ringkasan,
    hapusPermanent,
    konfirmasiNama,
  })
  if (!validasi.ok) throw new KesalahanValidasi(validasi)

  const idsVersi = await db
    .select({ id: formVersions.id })
    .from(formVersions)
    .where(eq(formVersions.formId, formId))

  await db.transaction(async (tx) => {
    if (idsVersi.length > 0) {
      await tx.delete(surveys).where(
        inArray(
          surveys.formVersionId,
          idsVersi.map((v) => v.id),
        ),
      )
    }
    await tx.delete(forms).where(eq(forms.id, formId))
  })

  // Audit ditulis setelah transaksi selesai: kalau insert audit gagal, datanya
  // sudah benar-benar terhapus dan menolak hapus demi audit hanya akan membuat
  // admin bingung. `catatAudit` sendiri tidak pernah melempar.
  await catatAudit({
    userId: actorId ?? null,
    aksi: 'delete',
    entitas: 'forms',
    entitasId: String(formId),
    sebelum: { nama: form[0].nama, kode: form[0].kode, ...ringkasan },
    sesudah: { ...ringkasan, hapusPermanent: hapusPermanent === true },
  })

  return {
    jumlahVersi: ringkasan.jumlahVersi,
    jumlahSubmit: ringkasan.jumlahSubmit,
    jumlahJawaban: ringkasan.jumlahJawaban,
    jumlahWarga: ringkasan.jumlahWarga,
  }
}
