import { db } from './db.server'
import { dataWargaTable, formFieldOptions, formFields, formSections, formVersions, forms, surveyEntries, surveys, validSession } from './schema/schema'
import { listPetugasOpsi, pastikanPetugasValid } from './user-registry.server'
import { jwtVerify, SignJWT } from 'jose'
import { createHash, randomBytes } from 'node:crypto';
import { setCookie } from '@tanstack/react-start/server';
import { and, desc, eq, inArray, sql } from 'drizzle-orm'
import type { SQL } from 'drizzle-orm'
import { KODE_FORM_BAWAAN, SESSION_IDLE_MS, SESSION_PROFILE, SESSION_TTL_MS } from './constants'
import { isValidNik } from './utils'
import type { AuthUser } from './auth'
import { PEMBATAS_NAMA_FIELD } from '@/features/kunjungan-rumah/lib/template-from-rows'
import type { TemplateQuestionRow } from '@/features/kunjungan-rumah/lib/template-from-rows'
import {
    barisDataWargaDariForm,
    keAgama,
    keHubunganKeluarga,
    keJenisKelamin,
    kePendidikan,
    kePekerjaan,
    keStatusKawin,
} from '@/features/kunjungan-rumah/lib/warga-row'
import type { BarisWarga, SasaranSuggestion } from '@/features/kunjungan-rumah/lib/warga-row'
import type { AnggotaKeluarga, KeluargaInfo } from '@/features/kunjungan-rumah/models'



/* ALUR SESI (hasil merge)
1. pinLogin → isValidPin → cookie httpOnly "session" (JWT, exp 12 jam) + row valid_session
2. tiap akses: touchSession = verify JWT + cek row + geser expiresAt (sliding 1 jam idle)
3. logout: destroySession = hapus row + kosongkan cookie → token lama langsung mati
*/

function getSecretKey(): Buffer {
    const secret = process.env.SECRET_KEY // ganti agar tidak ada risiko secret ikut terbundel ke client
    if (!secret) throw new Error('SECRET_KEY belum diisi di .env')
    return Buffer.from(secret, 'base64')
}

function hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex') // generate token dengan hash SHA-256
}

// tambahkan jeda tetap 1 detik per percobaan PIN untuk menangani bruteforce
function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

function isSecureCookie(): boolean {
  // Secure cookie hanya untuk HTTPS (production). Di development (HTTP localhost) harus false.
  return process.env.NODE_ENV === 'production';
}

export async function isValidPin(pin: number) {
  await sleep(1000)
  if (String(pin) !== process.env.PIN) return false
  await db.delete(validSession)
  cacheSesi.clear()
  setCookie('session', await createSessionHelper(), {
    httpOnly: true,
    secure: isSecureCookie(),
    path: '/',
    maxAge: SESSION_TTL_MS / 1000,
  })
  return true
}

async function createSessionHelper() {
    const tokenPayload = {
        clientUUID: randomBytes(32).toString("base64url"), // mastiin sessionnya unique per client
        loggedInAt: new Date().toISOString(),
        profile: SESSION_PROFILE,
    };

    const secretKey = getSecretKey()
    const token = await new SignJWT(tokenPayload)
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime(Math.floor(Date.now() / 1000) + SESSION_TTL_MS / 1000)
        .sign(secretKey);


    await db.insert(validSession).values({
        token: hashToken(token), // token session
        expiresAt: new Date(Date.now() + SESSION_IDLE_MS), // pastikan session hanya 1 jam
    })
    return token;
}

const EXTEND_BEFORE_MS = 5 * 60 * 1000 // hanya extend session sebelum 5 menit session habis

// Satu page view memanggil `touchSession` tiga kali: `beforeLoad` route, middleware
// `authSessionToken` tiap server fn, lalu `AuthProvider` setelah hydration. Ketiganya
// query yang sama ke `valid_session`, dan RTT ke DB sekitar 150 ms — jadi yang mahal
// jumlah hop-nya, bukan biaya query (mean eksekusi CTE-nya cuma 0,25 ms).
//
// Cache ini memangkas hop kedua dan ketiga. Aman karena `profile` dibaca dari payload
// JWT dan `SESSION_PROFILE` konstan, bukan kolom per-user: hasil cache identik dengan
// hasil query. Yang tetap ke DB: sesi yang mau segera di-extend, supaya sliding 1 jam
// tidak tertunda.
type CacheSesi = { expiresAtMs: number; diisiPukul: number }
const cacheSesi = new Map<string, CacheSesi>()
const CACHE_SESI_TTL_MS = 30_000 // sesi idle 1 jam, jadi 30 detik masih aman
const CACHE_SESI_MAKS = 500 // token dari login lama tidak boleh menumpuk tanpa batas

function cacheSesiAmbil(tokenHash: string): CacheSesi | null {
    const e = cacheSesi.get(tokenHash)
    if (!e) return null
    if (Date.now() - e.diisiPukul > CACHE_SESI_TTL_MS) {
        cacheSesi.delete(tokenHash)
        return null
    }
    if (e.expiresAtMs - Date.now() < EXTEND_BEFORE_MS) return null // biarkan query extend jalan
    return e
}

function cacheSesiSimpan(tokenHash: string, expiresAtMs: number) {
    if (cacheSesi.size >= CACHE_SESI_MAKS) {
        const palingLama = cacheSesi.keys().next().value
        if (palingLama !== undefined) cacheSesi.delete(palingLama)
    }
    cacheSesi.set(tokenHash, { expiresAtMs, diisiPukul: Date.now() })
}

// session hanya 1 jam. token palsu/kedaluwarsa/sudah dihapus = logout
export async function touchSession(sessionToken: string): Promise<{ profile: AuthUser; expiresAt: Date }> {
    try {
        const { payload } = await jwtVerify(sessionToken, getSecretKey(), { algorithms: ["HS256"] })
        const profile = payload.profile as AuthUser | undefined
        if (!profile) throw new Error('Unauthorized')

        const tokenHash = hashToken(sessionToken)
        const cached = cacheSesiAmbil(tokenHash)
        if (cached) return { profile, expiresAt: new Date(cached.expiresAtMs) }

        const rows = await db.execute(sql`
            WITH extend AS (
                UPDATE valid_session
                SET "expiresAt" = now() + ${SESSION_IDLE_MS / 1000} * interval '1 second'
                WHERE token = ${tokenHash}
                  AND "expiresAt" > now()
                  AND "expiresAt" < now() + ${EXTEND_BEFORE_MS / 1000} * interval '1 second'
                RETURNING "expiresAt"
            )
            SELECT COALESCE(
                (SELECT extract(epoch from "expiresAt") FROM extend),
                (SELECT extract(epoch from "expiresAt") FROM valid_session
                 WHERE token = ${tokenHash} AND "expiresAt" > now())
            ) AS exp
        `)
        const exp = (rows as unknown as Array<{ exp: number | null }>)[0]?.exp
        if (!exp) {
            cacheSesi.delete(tokenHash) // jangan biarkan token yang ditolak tetap di cache
            await db.delete(validSession).where(eq(validSession.token, tokenHash)) // buang baris kedaluwarsa saat token ditolak
            throw new Error('Unauthorized')
        }
        const expiresAtMs = Number(exp) * 1000
        cacheSesiSimpan(tokenHash, expiresAtMs)
        return { profile, expiresAt: new Date(expiresAtMs) }
    } catch {
        throw new Error('Unauthorized')
    }
}

// logout server-side: hapus row, kosongkan cookie
export async function destroySession(sessionToken?: string) {
    if (sessionToken) {
        const tokenHash = hashToken(sessionToken)
        cacheSesi.delete(tokenHash)
        await db.delete(validSession).where(eq(validSession.token, tokenHash))
    }
    setCookie('session', '', { httpOnly: true, secure: isSecureCookie(), path: '/', maxAge: 0 })
}

export async function querySurveyors() {
    return listPetugasOpsi(null)
}

// ---- kunjungan rumah langsung ke DB — pengganti localStorage `pws-kunjungan-rumah` ----
type JsonRecord = Record<string, unknown>;

function asJsonRecord(v: unknown): JsonRecord {
    if (!v || typeof v !== "object" || Array.isArray(v)) throw new Error("Payload tidak valid");
    return v as JsonRecord;
}

/** Foto untuk DB: teruskan id/name/fileUrl/dataUrl/caption/takenAt.
 *  dataUrl (base64) disimpan inline di jsonb — Postgres/TOAST menanganinya
 *  (batas kuota hanya berlaku untuk localStorage, bukan DB).
 *  fileUrl Supabase Storage siap dipakai setelah bucket `dokumentasi` tersedia
 *  di proyek yang sama dengan VITE_SUPABASE_URL (saat ini DB dan API beda proyek).
 */
function cleanFotos(fotos: unknown): Array<Record<string, unknown>> {
    if (!Array.isArray(fotos)) return [];
    return fotos.map((f) => {
        const o = (f ?? {}) as Record<string, unknown>;
        const out: Record<string, unknown> = {
            id: typeof o.id === "string" ? o.id : "",
            name: typeof o.name === "string" ? o.name : "foto.jpg",
            caption: typeof o.caption === "string" ? o.caption : "",
            takenAt: typeof o.takenAt === "string" ? o.takenAt : new Date().toISOString(),
        };
        if (typeof o.fileUrl === "string" && o.fileUrl) out.fileUrl = o.fileUrl;
        if (typeof o.dataUrl === "string" && o.dataUrl) out.dataUrl = o.dataUrl;
        return out;
    });
}

// ---- definisi form kunjungan rumah dari DB ----
// Definisi form (section + field + opsi) dibaca dari tabel v2: `form_sections`,
// `form_fields`, `form_field_options`. Record jawaban ditulis ke `surveys` +
// `survey_entries`; lihat catatan mapping di `saveKunjunganRumahRecord`.

/**
 * Form + versi published terbaru untuk form kunjungan rumah.
 *
 * Dicari lewat `forms.kode`, bukan `forms.nama`: `nama` boleh diubah admin lewat
 * Form Builder, sedangkan `kode` dikunci seeder. Kalau lewat `nama`, satu
 * rename saja membuat seluruh form kader jatuh ke template fallback tanpa error
 * yang jelas. Lihat `KODE_FORM_BAWAAN` di src/lib/constants.ts.
 */
async function getKunjunganRumahForm() {
    const [row] = await db
        .select({ id: forms.id, nama: forms.nama, formVersionId: formVersions.id, version: formVersions.version })
        .from(forms)
        .innerJoin(formVersions, eq(formVersions.formId, forms.id))
        .where(and(eq(forms.kode, KODE_FORM_BAWAAN.kunjunganRumah), eq(formVersions.status, "published")))
        .orderBy(desc(formVersions.version))
        .limit(1)
    return row ?? null
}

/**
 * Id SEMUA versi form kunjungan rumah, apa pun statusnya.
 *
 * Berbeda dengan `getKunjunganRumahForm()` yang sengaja terkunci ke versi
 * published terbaru — itu untuk membaca definisi form dan untuk menulis record
 * baru. Untuk menghitung record yang sudah ada, versi tidak boleh jadi filter:
 * begitu admin menerbitkan revisi definisi lewat Form Builder, versi lama jadi
 * `archived`, dan record yang dibuat padanya ikut hilang dari rekap hanya karena
 * definisi form berubah. Data petugas tidak boleh hilang begitu saja.
 *
 * Versi baru tetap membaca definisi terbaru; record lamanya tetap bisa dibuka
 * karena `getKunjunganRumahRecord()` mencari lewat `surveys.id`.
 */
async function semuaVersiKunjunganRumah(): Promise<string[] | null> {
    const rows = await db
        .select({ id: formVersions.id })
        .from(forms)
        .innerJoin(formVersions, eq(formVersions.formId, forms.id))
        .where(eq(forms.kode, KODE_FORM_BAWAAN.kunjunganRumah))
    if (rows.length === 0) return null
    return rows.map((r) => r.id)
}

export async function getKunjunganRumahTemplateRows() {
    const form = await getKunjunganRumahForm()
    if (!form) return null

    const sectionRows = await db
        .select({ id: formSections.id, nama: formSections.nama })
        .from(formSections)
        .where(eq(formSections.formVersionId, form.formVersionId))
        .orderBy(formSections.urutan)

    if (sectionRows.length === 0) return { versiDefinisi: form.version, questions: {} }

    const sectionIds = sectionRows.map((row) => row.id)
    const namaById = new Map(sectionRows.map((row) => [row.id, row.nama]))

    const fieldRows = await db
        .select({
            id: formFields.id,
            sectionId: formFields.sectionId,
            nama: formFields.nama,
            label: formFields.label,
            tipe: formFields.tipe,
            // Bucket layout panel sasaran disimpan di `optionSourceKey`prefix `bucket=`.
            // `form_fields` tidak punya kolom `bucket` sendiri; prefixed key dipakai supaya
            // satu kolom varchar tetap bisa menyimpan dua hal tanpa menambah kolom.
            optionSourceKey: formFields.optionSourceKey,
            deskripsi: formFields.deskripsi,
            wajib: formFields.wajib,
            urutan: formFields.urutan,
            aktif: formFields.aktif,
        })
        .from(formFields)
        .where(inArray(formFields.sectionId, sectionIds))
        .orderBy(formFields.urutan)

    // Opsi = baris `form_field_options` milik field. Satu query untuk semua field
    // lalu di-group di memory supaya tidak jadi N+1. Baris nonaktif ikut diambil
    // supaya urutan opsi tidak berubah kalau admin menonaktifkan lalu
    // mengaktifkan lagi lewat Form Builder; penyingkirannya dilakukan di bawah.
    const optionRows = fieldRows.length === 0
        ? []
        : await db
            .select({ fieldId: formFieldOptions.fieldId, value: formFieldOptions.value, aktif: formFieldOptions.aktif })
            .from(formFieldOptions)
            .where(inArray(formFieldOptions.fieldId, fieldRows.map((row) => row.id)))
            .orderBy(formFieldOptions.urutan)

    const opsiByField = new Map<string, string[]>()
    for (const row of optionRows) {
        if (!row.aktif) continue
        if (typeof row.value !== "string") continue
        const list = opsiByField.get(row.fieldId)
        if (list) list.push(row.value)
        else opsiByField.set(row.fieldId, [row.value])
    }

    const bySection: Record<string, TemplateQuestionRow[]> = {}
    for (const row of fieldRows) {
        const sectionNama = namaById.get(row.sectionId)
        if (!sectionNama) continue
        const entry: TemplateQuestionRow = {
            kode: namaFieldTanpaPrefix(row.nama),
            pertanyaan: row.label,
            tipe: row.tipe,
            bucket: parseBucket(row.optionSourceKey),
            hint: row.deskripsi,
            wajib: row.wajib,
            urutan: row.urutan,
            aktif: row.aktif,
            opsi: opsiByField.get(row.id) ?? [],
        }
        const list = bySection[sectionNama]
        if (list) list.push(entry)
        else bySection[sectionNama] = [entry]
    }

    return { versiDefinisi: form.version, questions: bySection }
}

/**
 * Buka lagi `<section>::<id>` jadi `<id>`.
 *
 * `form_fields.nama` wajib unik per versi form, tapi template lokal memakai
 * ulang id antar section (`nama` dan `nik` muncul di banyak section). Seeder
 * karena itu menyimpan `<section>::<id>`; di sini prefix-nya dibuang supaya
 * `templateFromRows()` menerima id yang sama seperti template lokal.
 *
 * Field yang tidak punya prefix dikembalikan utuh, supaya baris yang dibuat
 * manual di Form Builder (yang tidak lewat seeder) tetap terbaca.
 */
function namaFieldTanpaPrefix(nama: string): string {
    const found = nama.indexOf(PEMBATAS_NAMA_FIELD)
    return found === -1 ? nama : nama.slice(found + PEMBATAS_NAMA_FIELD.length)
}

/** Baca bucket dari prefix `bucket=` pada `form_fields.optionSourceKey`. */
function parseBucket(key: string | null): string | null {
    if (!key) return null
    const found = key.split(";").find((part) => part.trim().startsWith("bucket="))
    return found ? found.trim().slice("bucket=".length) || null : null
}

// ---- record kunjungan rumah di atas tabel v2 ----
// Record lama adalah satu baris jsonb (`kunjungan_rumah_records.payload`) berisi
// seluruh isian form sekaligus. Schema v2 tidak punya tabel jsonb tunggal, jadi isian
// itu dipetakan ke `surveys` (header) + `survey_entries` (satu baris jawaban).
//
// PEMETAAN SAMPAI SEKARANG: seluruh isian legacy disimpan sebagai SATU entry jsonb di
// field `record_legacy`. Bentuk jsonb di API sengaja tidak diubah supaya UI yang sudah
// jalan (src/features/kunjungan-rumah, hooks, routes) tidak perlu disentuh. Kolom
// `surveys` yang bisa terisi — `wargaNik`, `petugasId`, `tanggal` — tetap diisi dari
// `info` supaya filter dashboard, sasaran, dan laporan tetap bekerja.
//
// Batasnya yang perlu diketahui: rekap per-field ("berapa warga dengan TD tinggi?")
// belum bisa dijawab, karena itu butuh `survey_entries` satu baris per field, dan
// memecah payload legacy ke level field adalah pekerjaan tersendiri.

/** Field tempat seluruh payload legacy disimpan. Wajib ada di seed form kunjungan. */
const FIELD_RECORD_LEGACY = "record_legacy";

/**
 * Nama field di database untuk field di atas.
 *
 * `form_fields.nama` unik per versi form dan template lokal memakai ulang id
 * antar section, jadi seeder menyimpan `<section>::<id>`. Section `penyimpanan`
 * hanya dibuat oleh seeder; lihat `namaFieldUnik()` di scripts/seed-form-defaults.ts.
 * Kedua sisi harus diubah bersamaan — `pnpm db:check-parity` adalah penjaganya.
 */
const NAMA_FIELD_RECORD_LEGACY = "penyimpanan::" + FIELD_RECORD_LEGACY;

async function fieldIdRecordLegacy(formVersionId: string): Promise<string | null> {
    const [row] = await db
        .select({ id: formFields.id })
        .from(formFields)
        .where(and(eq(formFields.formVersionId, formVersionId), eq(formFields.nama, NAMA_FIELD_RECORD_LEGACY)))
        .limit(1)
    return row?.id ?? null
}

/** Baca metadata header dari `info` di payload legacy. */
function headerDariPayload(rec: JsonRecord): { wargaNik: string; petugasId: string; tanggal: string } {
    const info = rec.info && typeof rec.info === "object" ? (rec.info as JsonRecord) : {}
    const nik = typeof info.nik === "string" ? info.nik.trim() : ""
    const petugasId = typeof info.petugasId === "string" ? info.petugasId.trim() : ""
    const tgl = typeof info.tglPengumpulan === "string" ? info.tglPengumpulan.trim() : ""
    const waktuSimpan = typeof rec.waktuSimpan === "string" ? rec.waktuSimpan : ""
    return {
        wargaNik: nik,
        petugasId,
        tanggal: tgl || waktuSimpan.slice(0, 10),
    }
}

// ---- pencarian warga sasaran di data_warga + data import ----
//
// `data_warga_import` adalah sumber awal data sasaran: user mengetik NIK atau
// nama KK dan server mencarinya di situ. Begitu warga disimpan lewat Simpan
// (atau sudah ada dari sumber lain), barisnya ada di `data_warga`.
//
// Hasil pencarian menggabungkan keduanya dengan satu aturan: warga yang sudah
// tersimpan di `data_warga` TAMPIL, dan baris `data_warga_import` yang NIK-nya
// sama dengannya TIDAK ikut tampil — supaya nama yang sama tidak muncul dua
// kali. Baris import tanpa NIK 16 digit tidak bisa dicocokkan ke `data_warga`
// (NIK di sana selalu valid), jadi tetap tampil.
//
// Pencocokan selalu `LIKE`, bukan persis: 8.277 dari 20.454 baris import punya
// NIK kosong atau bukan 16 digit, jadi user yang hanya tahu nama KK tetap bisa
// menemukan warga sasarannya.

/** Kolom yang dibaca dari `data_warga_import`, dengan nama kolom aslinya. */
const SELECT_SASARAN = sql`
    raw_id                       AS "rawId",
    nik                          AS "nik",
    nama_art                     AS "namaArt",
    nama_kk                      AS "namaKk",
    hubungan_keluarga            AS "hubunganKeluarga",
    to_char(tgl_lahir, 'YYYY-MM-DD') AS "tglLahir",
    jenis_kelamin                AS "jenisKelamin",
    status_kawin                 AS "statusKawin",
    agama                        AS "agama",
    pendidikan                   AS "pendidikan",
    pekerjaan                    AS "pekerjaan",
    alamat                       AS "alamat",
    rt::text                     AS "rt",
    rw::text                     AS "rw",
    kecamatan                    AS "kecamatan",
    kelurahan                    AS "kelurahan",
    kab_kota                     AS "kabKota",
    provinsi                     AS "provinsi"
`

/** Kolom yang dibaca dari `data_warga` (sudah tersimpan), proyeksi sama dengan
 *  `SELECT_SASARAN` supaya pemanggil tidak perlu tahu asal barisnya. `data_warga`
 *  tidak punya `raw_id`/`provinsi`, jadi NIK dipakai sebagai `rawId` (unik — dia
 *  primary key) dan `provinsi` diisi NULL. */
const SELECT_SASARAN_WARGA = sql`
    nik                          AS "rawId",
    nik                          AS "nik",
    nama_art                     AS "namaArt",
    nama_kk                      AS "namaKk",
    hubungan_keluarga            AS "hubunganKeluarga",
    to_char(tgl_lahir, 'YYYY-MM-DD') AS "tglLahir",
    jenis_kelamin                AS "jenisKelamin",
    status_kawin                 AS "statusKawin",
    agama                        AS "agama",
    pendidikan                   AS "pendidikan",
    pekerjaan                    AS "pekerjaan",
    alamat                       AS "alamat",
    rt                           AS "rt",
    rw                           AS "rw",
    kecamatan                    AS "kecamatan",
    kelurahan                    AS "kelurahan",
    kota                         AS "kabKota",
    NULL                         AS "provinsi"
`

type BarisImportSasaran = {
    rawId?: unknown; nik?: unknown; namaArt?: unknown; namaKk?: unknown
    hubunganKeluarga?: unknown; tglLahir?: unknown; jenisKelamin?: unknown
    statusKawin?: unknown; agama?: unknown; pendidikan?: unknown; pekerjaan?: unknown
    alamat?: unknown; rt?: unknown; rw?: unknown; kecamatan?: unknown
    kelurahan?: unknown; kabKota?: unknown; provinsi?: unknown
}

/** Terjemahkan baris import ke label enum `data_warga`; yang tak cocok jadi `null`. */
function normalkanSasaran(row: BarisImportSasaran): SasaranSuggestion {
    const s = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null)
    return {
        rawId: s(row.rawId) ?? "",
        nik: s(row.nik) ?? "",
        namaArt: s(row.namaArt) ?? "",
        namaKk: s(row.namaKk) ?? "",
        hubunganKeluarga: keHubunganKeluarga(s(row.hubunganKeluarga)),
        tglLahir: s(row.tglLahir),
        jenisKelamin: keJenisKelamin(s(row.jenisKelamin)),
        statusKawin: keStatusKawin(s(row.statusKawin)),
        agama: keAgama(s(row.agama)),
        pendidikan: kePendidikan(s(row.pendidikan)),
        pekerjaan: kePekerjaan(s(row.pekerjaan)),
        alamat: s(row.alamat),
        rt: s(row.rt),
        rw: s(row.rw),
        kecamatan: s(row.kecamatan),
        kelurahan: s(row.kelurahan),
        kabKota: s(row.kabKota),
        provinsi: s(row.provinsi),
    }
}

// Kolom enum `data_warga_import` dideklarasikan di `src/lib/schema/data-import.ts`
// tanpa nama kolom eksplisit, jadi pemetaannya menjadi camelCase
// (`hubunganKeluarga`, `jenisKelamin`, `agama`, dst) yang tidak ada di database.
// Select ditulis manual di `SELECT_SASARAN` supaya file schema tidak perlu
// disentuh. Kolom sisanya (`rt`, `rw` bertipe smallint di import tapi varchar(3)
// di `data_warga`) ikut dikonversi ke teks di sana.

/**
 * Cari warga sasaran di `data_warga` dan `data_warga_import` yang mirip `q`.
 *
 * Warga yang sudah tersimpan di `data_warga` selalu tampil; baris import dengan
 * NIK yang sama dibuang supaya tidak duplikat. `q` dicocokkan ke NIK,
 * nama.artikel, dan nama KK. Urutan: NIK yang persis dulu, lalu sisanya.
 */
export async function querySasaranWarga(q: string): Promise<SasaranSuggestion[]> {
    const cari = q.trim()
    if (cari.length < 3) return []
    const pola = `%${cari}%`
    const where = sql`WHERE nik ILIKE ${pola} OR nama_art ILIKE ${pola} OR nama_kk ILIKE ${pola}`
    const [barisWarga, barisImport] = await Promise.all([
        db.execute(sql`SELECT ${SELECT_SASARAN_WARGA} FROM data_warga ${where} ORDER BY nik LIMIT 30`),
        db.execute(sql`SELECT ${SELECT_SASARAN} FROM data_warga_import ${where} ORDER BY raw_id LIMIT 30`),
    ])
    const warga = (barisWarga as unknown as BarisImportSasaran[]).map(normalkanSasaran)

    // Buang baris import yang NIK-nya sudah tersimpan di `data_warga`. Baris
    // import tanpa NIK tetap dipertahankan: tidak bisa dicocokkan, dan user
    // tetap bisa mengambil nama/alamatnya.
    const nikWarga = new Set(warga.map((r) => r.nik).filter((n) => n.length === 16))
    const importSisa = (barisImport as unknown as BarisImportSasaran[])
        .map(normalkanSasaran)
        .filter((r) => !r.nik || r.nik.length !== 16 || !nikWarga.has(r.nik))

    const hasil = [...warga, ...importSisa].slice(0, 30)
    // NIK persis naik ke atas supaya suggestion yang paling mungkin benar lebih dulu.
    return hasil.sort((a, b) => {
        const aTepat = a.nik === cari ? 0 : 1
        const bTepat = b.nik === cari ? 0 : 1
        return aTepat - bTepat || a.rawId.localeCompare(b.rawId)
    })
}

/** Baris import untuk satu NIK; dipakai server saat menyimpan agar kolom yang
 *  tidak ada di form (`rt`, `rw`, `agama`) tetap terisi tanpa kirim round-trip. */
async function importUntukNik(nik: string): Promise<SasaranSuggestion | null> {
    const rows = await db.execute(sql`
        SELECT ${SELECT_SASARAN}
        FROM data_warga_import
        WHERE nik = ${nik}
        LIMIT 1
    `)
    const [row] = rows as unknown as BarisImportSasaran[]
    return row ? normalkanSasaran(row) : null
}

/** Pesan error berbahasa petugas untuk kolom `data_warga` yang belum terisi. */
const LABEL_KOLOM_WARGA: Record<string, string> = {
    nama_art: "nama warga sasaran",
    nama_kk: "nama kepala keluarga",
    hubungan_keluarga: "hubungan dengan kepala keluarga",
    alamat: "alamat",
    tgl_lahir: "tanggal lahir warga sasaran",
    rt: "RT",
    rw: "RW",
    kecamatan: "kecamatan",
    kelurahan: "kelurahan",
    kota: "kota/kabupaten",
    status_kawin: "status perkawinan",
    staff: "petugas",
    jenis_kelamin: "jenis kelamin warga sasaran",
    agama: "agama warga sasaran",
    pendidikan: "pendidikan warga sasaran",
    pekerjaan: "pekerjaan warga sasaran",
}

/**
 * Tulis warga sasaran ke `data_warga` bila NIK-nya belum terdaftar.
 *
 * Dipanggil di dalam transaksi yang sama dengan insert `surveys`, karena
 * `surveys.wargaNik` punya FK ke `data_warga.nik`. NIK yang sudah ada tidak
 * ditulis ulang — data master tidak ditimpa oleh form kunjungan.
 */
async function simpanWargaSasaran(
    tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
    baris: BarisWarga,
): Promise<void> {
    await tx
        .insert(dataWargaTable)
        .values(baris)
        .onConflictDoNothing({ target: dataWargaTable.nik })
}

/** Susun baris `data_warga` dari payload form, atau lempar error yang menyebut
 *  kolom yang kurang. Semua sumber sudah dinormalkan di `warga-row.ts`. */
async function barisWargaDariPayload(rec: JsonRecord): Promise<BarisWarga> {
    const info = (rec.info ?? {}) as JsonRecord
    const anggota = Array.isArray(rec.anggota) ? (rec.anggota as AnggotaKeluarga[]) : []
    const suggestion = (await importUntukNik((typeof info.nik === "string" ? info.nik : "").trim())) ?? null
    const { nilai, hilang } = barisDataWargaDariForm({
        info: info as unknown as KeluargaInfo,
        anggota,
        suggestion,
    })
    if (nilai) return nilai
    if (hilang.includes("anggota")) {
        throw new Error(
            "Daftar anggota keluarga harus memuat NIK yang sama dengan NIK sasaran utama, agar data warga bisa disimpan."
        )
    }
    throw new Error(
        `Data warga sasaran belum lengkap. Isi dulu di form: ${hilang.map((k) => LABEL_KOLOM_WARGA[k] ?? k).join(", ")}.`
    )
}

export async function listKunjunganRumahRecords() {
    // Semua versi ikut, bukan cuma published terbaru: lihat catatan
    // `semuaVersiKunjunganRumah()`.
    const versionIds = await semuaVersiKunjunganRumah()
    if (!versionIds) return []
    const rows = await db
        .select({ id: surveys.id, tanggal: surveys.tanggal, createdAt: surveys.createdAt, value: surveyEntries.value })
        .from(surveys)
        .innerJoin(surveyEntries, eq(surveyEntries.surveyId, surveys.id))
        .innerJoin(formFields, eq(formFields.id, surveyEntries.fieldId))
        .where(and(
            inArray(surveys.formVersionId, versionIds),
            eq(formFields.nama, NAMA_FIELD_RECORD_LEGACY),
        ))
        .orderBy(desc(surveys.createdAt))
    return rows
        .map((r) => r.value)
        .filter((v): v is JsonRecord => !!v && typeof v === "object" && !Array.isArray(v))
        .map((payload) => ({ id: String(payload.id ?? ""), ...payload }))
}

export async function getKunjunganRumahRecord(id: string) {
    const [row] = await db
        .select({ value: surveyEntries.value })
        .from(surveyEntries)
        .innerJoin(formFields, eq(formFields.id, surveyEntries.fieldId))
        .where(and(eq(surveyEntries.surveyId, id), eq(formFields.nama, NAMA_FIELD_RECORD_LEGACY)))
        .limit(1)
    const payload = row?.value
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null
    const rec = payload as JsonRecord
    return { id, ...rec }
}

export async function saveKunjunganRumahRecord(payload: unknown) {
    const rec = asJsonRecord(payload)
    if (typeof rec.waktuSimpan !== "string" || !rec.waktuSimpan) throw new Error("waktuSimpan wajib diisi")
    if (!rec.info || typeof rec.info !== "object") throw new Error("info keluarga wajib diisi")

    const form = await getKunjunganRumahForm()
    if (!form) throw new Error("Form kunjungan rumah belum ada di database. Jalankan `pnpm db:seed`.")
    const fieldId = await fieldIdRecordLegacy(form.formVersionId)
    if (!fieldId) {
        throw new Error(
            `Field "${FIELD_RECORD_LEGACY}" belum ada di form kunjungan rumah. Jalankan \`pnpm db:seed\` untuk membuat definisi form yang cocok dengan kode.`
        )
    }

    const head = headerDariPayload(rec)
    if (!head.tanggal) throw new Error("Tanggal kunjungan wajib diisi")
    if (!isValidNik(head.wargaNik)) {
        throw new Error("NIK sasaran utama wajib 16 digit.")
    }
    const petugas = await pastikanPetugasValid(head.petugasId)

    const id = typeof rec.id === "string" && rec.id ? rec.id : crypto.randomUUID()
    const clean: JsonRecord = { ...rec, id, fotos: cleanFotos(rec.fotos) }
    const barisWarga = await barisWargaDariPayload(rec)

    await db.transaction(async (tx) => {
        // `surveys.wargaNik` punya FK ke `data_warga.nik`, jadi warga sasaran
        // ditulis lebih dulu. NIK yang sudah terdaftar tidak ditimpa.
        await simpanWargaSasaran(tx, barisWarga)
        await tx.insert(surveys).values({
            id,
            formVersionId: form.formVersionId,
            wargaNik: barisWarga.nik,
            petugasId: petugas.id,
            tanggal: head.tanggal,
        })
        await tx.insert(surveyEntries).values({
            surveyId: id,
            fieldId,
            value: clean,
        })
    })
    return { id, ...clean }
}

export async function updateKunjunganRumahRecord(id: string, payload: unknown) {
    const rec = asJsonRecord(payload)
    const clean: JsonRecord = { ...rec, id, fotos: cleanFotos(rec.fotos) }

    const [header] = await db
        .select({ formVersionId: surveys.formVersionId })
        .from(surveys)
        .where(eq(surveys.id, id))
        .limit(1)
    if (!header) throw new Error("Kunjungan rumah tidak ditemukan")

    const fieldId = await fieldIdRecordLegacy(header.formVersionId)
    if (!fieldId) throw new Error(`Field "${FIELD_RECORD_LEGACY}" tidak ada di form versi ini`)

    const head = headerDariPayload(clean)
    if (head.wargaNik && head.petugasId) {
        // Sama seperti saat menyimpan: warga sasaran ditulis dulu kalau belum
        // terdaftar, supaya `surveys.wargaNik` tidak menggagalkan update.
        if (!head.tanggal) throw new Error("Tanggal kunjungan wajib diisi")
        if (!isValidNik(head.wargaNik)) {
            throw new Error("NIK sasaran utama wajib 16 digit.")
        }
        const petugas = await pastikanPetugasValid(head.petugasId)
        const barisWarga = await barisWargaDariPayload(clean)
        await db.transaction(async (tx) => {
            await simpanWargaSasaran(tx, barisWarga)
            await tx
                .update(surveys)
                .set({
                    wargaNik: barisWarga.nik,
                    petugasId: petugas.id,
                    tanggal: head.tanggal,
                })
                .where(eq(surveys.id, id))
            await tx
                .delete(surveyEntries)
                .where(and(eq(surveyEntries.surveyId, id), eq(surveyEntries.fieldId, fieldId)))
            await tx.insert(surveyEntries).values({ surveyId: id, fieldId, value: clean })
        })
        return { id, ...clean }
    }

    // Entry lama ditimpa: `survey_entries` punya UNIQUE (surveyId, fieldId) dan tidak
    // punya kolom untuk patch sebagian, jadi delete-then-insert satu baris.
    await db
        .delete(surveyEntries)
        .where(and(eq(surveyEntries.surveyId, id), eq(surveyEntries.fieldId, fieldId)))
    await db.insert(surveyEntries).values({ surveyId: id, fieldId, value: clean })
    return { id, ...clean }
}

export async function removeKunjunganRumahRecord(id: string) {
    // `survey_entries` cascade dari `surveys`, jadi cukup hapus header.
    await db.delete(surveys).where(eq(surveys.id, id))
}

// ---- read model DB (sumber tunggal UI; tanpa data dummy) ----
export async function queryWargaList() {
    return await db.query.dataWargaTable.findMany({
        columns: {
            nik: true,
            nama_art: true,
            nama_kk: true,
            kelurahan: true,
            kecamatan: true,
            kota: true,
            rt: true,
            rw: true,
            alamat: true,
            tgl_lahir: true,
            jenis_kelamin: true,
        },
        orderBy: (t, { asc }) => [asc(t.nama_art)],
    })
}

// ---- sumber data awal UI sasaran (gabungan import) ----
/**
 * Baris sasaran gabungan (`data_warga` + `data_warga_import`) yang ditampilkan
 * di halaman /sasaran.
 *
 * - `rawId`    — identitas asal baris: NIK untuk `data_warga`, `raw_id`
 *   (`WRG-000001`) untuk import. Dipakai sebagai pengunci detail, bukan NIK.
 * - `nik`      — NIK asli 16 digit kalau valid; kalau tidak ada/tersimpan salah
 *   (bukan 16 digit), diganti "NIK sementara" hasil derive nomor `raw_id`
 *   (`WRG-000123` → `0000000000000123`) sebagai penanda data perlu diperbarui.
 * - `nikValid` / `needsUpdate` — turunan dari status NIK; UI memakai `needsUpdate`
 *   untuk badge peringatan dan menolak menyimpan NIK sementara sebagai NIK asli.
 *
 * NIK yang sama di kedua tabel diutamakan baris `data_warga` — isinya sudah
 * diverifikasi petugas, jadi import tidak menimpanya. Kolom tanpa padanan
 * (`provinsi`, `iks_besar`) tidak diproyeksikan, dan tidak ada yang ditebak.
 */
export type BarisWargaGabungan = {
    rawId: string
    nik: string
    nikValid: boolean
    needsUpdate: boolean
    nama_art: string
    nama_kk: string
    kelurahan: string
    kecamatan: string
    kota: string
    rt: string
    rw: string
    alamat: string
    tgl_lahir: string
    jenis_kelamin: string
}

/** Proyeksi `data_warga` untuk sumber gabungan. Semua kolomnya `NOT NULL` dan
 *  `rt`/`rw` sudah varchar; NIK selalu valid, `rawId` = NIK. */
const SELECT_GABUNGAN_WARGA = sql`
    1                                 AS "prioritas",
    nik                              AS "raw_id",
    nik                              AS "nik_tampil",
    true                             AS "nik_valid",
    false                            AS "needs_update",
    nik                              AS "nik",
    nama_art                         AS "nama_art",
    nama_kk                          AS "nama_kk",
    kelurahan                        AS "kelurahan",
    kecamatan                        AS "kecamatan",
    kota                             AS "kota",
    rt                               AS "rt",
    rw                               AS "rw",
    alamat                           AS "alamat",
    to_char(tgl_lahir, 'YYYY-MM-DD') AS "tgl_lahir",
    jenis_kelamin::text              AS "jenis_kelamin"
`

/** Proyeksi `data_warga_import` ke nama field yang sama. `raw_id` dipakai sebagai
 *  `rawId`; NIK yang bukan 16 digit tidak bisa dipakai sebagai pengunci, jadi
 *  diganti "NIK sementara" hasil derive dari nomor `raw_id` (`WRG-000123` →
 *  `0000000000000123`). NIK sementara sama uniknya dengan `raw_id`, jadi aman
 *  untuk key React dan pencarian, dan `needs_update` menandai data perlu
 *  diperbarui. Kolom tanpa padanan dikosongkan, bukan ditebak. */
const SELECT_GABUNGAN_IMPORT = sql`
    2                                 AS "prioritas",
    raw_id                           AS "raw_id",
    CASE WHEN length(btrim(nik)) = 16 THEN btrim(nik)
         ELSE lpad(regexp_replace(raw_id, '[^0-9]', '', 'g'), 16, '0')
    END                              AS "nik_tampil",
    (COALESCE(length(btrim(nik)), 0) = 16)  AS "nik_valid",
    (COALESCE(length(btrim(nik)), 0) <> 16) AS "needs_update",
    COALESCE(btrim(nik), '')                     AS "nik",
    COALESCE(btrim(nama_art), '')                AS "nama_art",
    COALESCE(btrim(nama_kk), '')                 AS "nama_kk",
    COALESCE(btrim(kelurahan), '')               AS "kelurahan",
    COALESCE(btrim(kecamatan), '')               AS "kecamatan",
    COALESCE(btrim(kab_kota), '')                AS "kota",
    COALESCE(rt::text, '')                       AS "rt",
    COALESCE(rw::text, '')                       AS "rw",
    COALESCE(btrim(alamat), '')                  AS "alamat",
    COALESCE(to_char(tgl_lahir, 'YYYY-MM-DD'), '') AS "tgl_lahir",
    COALESCE(jenis_kelamin::text, '')             AS "jenis_kelamin"
`

/** Kolom `riwayat_ks_import` (nama camelCase) yang ditambahkan opsional ke baris
 *  warga di halaman detail sasaran. Tidak ada padanannya di `data_warga`, jadi
 *  nilainya dibiarkan apa adanya dari DB — `null` kalau baris riwayatnya tidak
 *  ada. Daftar kolomnya sudah ada di `SELECT_RIWAYAT_KS`. */
export type RiwayatSasaran = Record<string, boolean | number | string | null>

/** Parameter pencarian daftar sasaran. Semua opsional; `all` mengabaikan
 *  `page`/`pageSize` (dipakai ekspor seluruh data). */
export interface QuerySasaranParams {
    q: string
    status: "all" | "Sudah" | "Belum"
    kel: string
    page: number
    pageSize: number
    all: boolean
}

/** Daftar warga sasaran satu halaman, lengkap dengan total (semua filter) dan
 *  jumlah per status. Sumber = `data_warga` digabung `data_warga_import`,
 *  di-dedupe per NIK (atau NIK sementara untuk import), `data_warga` menang.
 *
 * Filter dan halaman diproses di server supaya transfer antar jaringan kecil —
 *  hanya baris satu halaman (maks 10) yang dikirim, bukan 20 ribu baris import.
 *  `COUNT(*) OVER ()` sekaligus menghitung total setelah filter tanpa query kedua.
 */
export async function querySasaranListPaged(p: QuerySasaranParams): Promise<{ rows: BarisWargaGabungan[]; total: number }> {
    const q = p.q.trim()
    const where: SQL[] = []

    if (q) {
        const pola = `%${q}%`
        where.push(sql`(g."nama_art" ILIKE ${pola} OR g."nama_kk" ILIKE ${pola} OR g."nik_tampil" ILIKE ${pola})`)
    }
    if (p.kel && p.kel !== "all") {
        where.push(sql`g."kelurahan" = ${p.kel}`)
    }
    if (p.status === "Sudah" || p.status === "Belum") {
        const ada = sql`EXISTS (SELECT 1 FROM surveys s WHERE s."wargaNik" = g."nik_tampil")`
        where.push(p.status === "Sudah" ? ada : sql`NOT ${ada}`)
    }

    const whereSql = where.length ? sql`WHERE ${sql.join(where, sql` AND `)}` : sql``
    const limit = p.all ? null : p.pageSize
    const offset = p.all ? null : (p.page - 1) * p.pageSize

    const rows = await db.execute(sql`
        WITH gabungan AS (
            SELECT DISTINCT ON (u."nik_tampil")
                u."raw_id", u."nik_tampil", u."nik_valid", u."needs_update",
                u."nama_art", u."nama_kk", u."kelurahan", u."kecamatan", u."kota",
                u."rt", u."rw", u."alamat", u."tgl_lahir", u."jenis_kelamin"
            FROM (
                SELECT ${SELECT_GABUNGAN_WARGA}
                FROM data_warga
                UNION ALL
                SELECT ${SELECT_GABUNGAN_IMPORT}
                FROM data_warga_import
            ) u
            ORDER BY u."nik_tampil", u."prioritas"
        )
        SELECT g.*, COUNT(*) OVER () AS "total"
        FROM gabungan g
        ${whereSql}
        ORDER BY g."nama_art" ASC, g."nik_tampil"
        ${limit !== null ? sql.raw(`LIMIT ${limit} OFFSET ${offset}`) : sql``}
    `)
    const rowsOut = (rows as unknown as Array<Record<string, unknown>>).map((r) => ({
        rawId: String(r.raw_id ?? ""),
        nik: String(r.nik_tampil ?? ""),
        nikValid: Boolean(r.nik_valid),
        needsUpdate: Boolean(r.needs_update),
        nama_art: String(r.nama_art ?? ""),
        nama_kk: String(r.nama_kk ?? ""),
        kelurahan: String(r.kelurahan ?? ""),
        kecamatan: String(r.kecamatan ?? ""),
        kota: String(r.kota ?? ""),
        rt: String(r.rt ?? ""),
        rw: String(r.rw ?? ""),
        alamat: String(r.alamat ?? ""),
        tgl_lahir: String(r.tgl_lahir ?? ""),
        jenis_kelamin: String(r.jenis_kelamin ?? ""),
    }))
    const total = rowsOut.length ? Number((rows[0] as { total?: unknown }).total ?? rowsOut.length) : rowsOut.length
    return { rows: rowsOut, total }
}

/** Ambil satu baris sasaran gabungan berdasarkan NIK tampil (NIK asli 16 digit
 *  atau NIK sementara hasil derive). Baris `data_warga` diutamakan kalau NIK-nya
 *  juga ada di import — sama seperti daftar. Dipakai halaman detail (ejaan
 *  `querySasaranDetail`), bukan scan daftar penuh. */
export async function querySasaranByNik(nik: string): Promise<BarisWargaGabungan | null> {
    const cari = nik.trim()
    if (!cari) return null
    const rows = await db.execute(sql`
        SELECT ${SELECT_GABUNGAN_WARGA}
        FROM data_warga
        WHERE nik = ${cari}
        UNION ALL
        SELECT ${SELECT_GABUNGAN_IMPORT}
        FROM data_warga_import
        WHERE btrim(nik) = ${cari} OR lpad(regexp_replace(raw_id, '[^0-9]', '', 'g'), 16, '0') = ${cari}
        ORDER BY "prioritas"
        LIMIT 1
    `)
    const [row] = rows as unknown as Array<Record<string, unknown>>
    if (!row) return null
    return {
        rawId: String(row.raw_id ?? ""),
        nik: String(row.nik_tampil ?? ""),
        nikValid: Boolean(row.nik_valid),
        needsUpdate: Boolean(row.needs_update),
        nama_art: String(row.nama_art ?? ""),
        nama_kk: String(row.nama_kk ?? ""),
        kelurahan: String(row.kelurahan ?? ""),
        kecamatan: String(row.kecamatan ?? ""),
        kota: String(row.kota ?? ""),
        rt: String(row.rt ?? ""),
        rw: String(row.rw ?? ""),
        alamat: String(row.alamat ?? ""),
        tgl_lahir: String(row.tgl_lahir ?? ""),
        jenis_kelamin: String(row.jenis_kelamin ?? ""),
    }
}

const SELECT_RIWAYAT_KS = sql`
    kepesertaan_jkn                     AS "kepesertaanJkn",
   merokok                                AS "merokok",
    tersedia_sarana_air_bersih          AS "tersediaSaranaAirBersih",
    jenis_sumber_air_terlindung         AS "jenisSumberAirTerlindung",
    tersedia_jamban_keluarga            AS "tersediaJambanKeluarga",
    jenis_jamban_saniter                AS "jenisJambanSaniter",
    diagnosis_odgj                      AS "diagnosisOdgj",
    minum_obat_odgj_teratur             AS "minumObatOdgjTeratur",
    ada_art_dipasung                    AS "adaArtDipasung",
    perilaku_bab_dijamban               AS "perilakuBabDijamban",
    perilaku_penggunaan_air_bersih      AS "perilakuPenggunaanAirBersih",
    diagnosis_tb_paru                   AS "diagnosisTbParu",
    minum_obat_tb_teratur               AS "minumObatTbTeratur",
    batuk_berdahak_lebih_dari_2_minggu AS "batukBerdahakLebihDari2Minggu",
    diagnosis_hipertensi                AS "diagnosisHipertensi",
    pengkuran_tekanan_darah             AS "pengkuranTekananDarah",
    minum_obat_hipertensi_teratur       AS "minumObatHipertensiTeratur",
    sistolik                            AS "sistolik",
    diastolik                           AS "diastolik",
    pakai_kb                            AS "pakaiKb",
    ket_kb                              AS "ketKb",
    persalinan_di_faskes                AS "persalinanDiFaskes",
    asi_eksklusif                       AS "asiEksklusif",
    imunisasi_lengkap                   AS "imunisasiLengkap"
`

/**
 * Riwayat kesehatan keluarga dari `riwayat_ks_import` untuk satu NIK, diambil
 * lewat `raw_id` baris import yang NIK-nya sama.
 *
 * Kalau baris import tidak ada, hasilnya objek kosong; kalau baris import ada
 * tapi tidak punya baris riwayat, kolomnya `null` karena `LEFT JOIN`. Tidak
 * ditebak dari kolom lain.
 */
export async function queryRiwayatKsUntukNik(nik: string): Promise<RiwayatSasaran> {
    const rows = await db.execute(sql`
        SELECT ${SELECT_RIWAYAT_KS}
        FROM data_warga_import
        LEFT JOIN riwayat_ks_import ON riwayat_ks_import.raw_id = data_warga_import.raw_id
        WHERE data_warga_import.nik = ${nik}
           OR data_warga_import.raw_id = ${nik}
           OR lpad(regexp_replace(data_warga_import.raw_id, '[^0-9]', '', 'g'), 16, '0') = ${nik}
        ORDER BY data_warga_import.raw_id
        LIMIT 1
    `)
    const [row] = rows as unknown as RiwayatSasaran[]
    return row ?? {}
}

export async function querySurveyStatsByNik(): Promise<Array<{ nik: string; total: number; terakhir: string | null }>> {
    // Kolom NIK di `surveys` bernama `wargaNik` (dulu `nik`, sudah di-rename saat
    // tabel dibuat ulang ke schema v2). Nama lama di sini bikin query gagal runtime
    // dengan "column nik does not exist", bukan error TypeScript.
    const rows = await db.execute(sql`
        SELECT "wargaNik" AS "nik", COUNT(*)::int AS "total", MAX("tanggal")::text AS "terakhir"
        FROM surveys
        WHERE "wargaNik" IS NOT NULL
        GROUP BY "wargaNik"
    `)
    return rows as unknown as Array<{ nik: string; total: number; terakhir: string | null }>
}

/** Baris isian form yang dipakai dashboard, laporan, dan detail sasaran. */
export interface BarisIsianForm {
    id: string
    tanggal: string
    /** NULL kalau form-nya tidak menunjuk warga per-submission (mis. kegiatan). */
    nik: string | null
    nama: string
    kelurahan: string
    petugas: string
    /** Nama form dari `forms`, bukan label hardcoded — ini yang membuat record
     *  form buatan Form Builder tidak lagi tampil sebagai "kunjungan rumah". */
    formNama: string
    formKode: string | null
    formVersion: number
}

/**
 * Isian form dari semua form, untuk dashboard dan laporan.
 *
 * JOIN, bukan tiga query lalu dicocokkan di JS. Versi lama membaca SELURUH
 * `data_warga` dan SELURUH `users` tanpa `.limit()`, lalu memfilter/memetakan
 * di memori — jadi saat `data_warga` terisi banyak warga (form Kunjungan Rumah
 * menyimpan warga ke sana), satu halaman laporan menarik seluruh tabel cuma untuk
 * menampilkan 50–500 baris. Index yang dipakai: `surveys_tanggal_idx` untuk
 * `ORDER BY ... DESC LIMIT`, `data_warga_pkey` untuk lookup NIK per baris.
 *
 * `tanggal` dikirim lewat `to_char` supaya tipenya string `YYYY-MM-DD`. Kolomnya
 * bertipe `date`, dan driver postgres mengembalikan objek Date untuk tipe itu,
 * sedangkan pemanggil (`SurveyRow`) dan pembanding rentang tanggal di UI
 * (`laporan.tsx`: `r.tanggal >= dari`) memperlakukan string — tanpa `to_char`,
 * perbandingan string itu diam-diam jadi tidak berlaku.
 *
 * FILTER FORM TIDAK ADA DI SINI, dan itu disengaja. Tabel `surveys` tidak punya
 * kolom penanda form; identitas form hanya `formVersionId`, jadi nama form
 * diambil lewat join `form_versions → forms`. Query lama menyaring
 * `wargaNik IS NOT NULL` lalu UI melabeli hasilnya "Kunjungan Rumah" — itu
 * membuat submit form buatan Form Builder ikut terhitung sebagai kunjungan.
 * Sekarang semua baris ikut, dan setiap baris membawa `formNama` untuk
 * dilabelikan sesuai form asalnya. `nik` karena itu jadi nullable: form yang tidak
 * mewajibkan warga (kegiatan, form generic) tetap tampil, hanya tanpa kolom warga.
 */
export async function querySurveysWithWarga(limit = 500): Promise<BarisIsianForm[]> {
    const rows = await db.execute(sql`
        SELECT
            s.id                                   AS "id",
            to_char(s."tanggal", 'YYYY-MM-DD')     AS "tanggal",
            s."wargaNik"                           AS "nik",
            COALESCE(w."nama_art", '—')            AS "nama",
            COALESCE(w."kelurahan", '—')           AS "kelurahan",
            COALESCE(u."nama", '—')                AS "petugas",
            f.nama                                 AS "formNama",
            f.kode                                 AS "formKode",
            fv.version                             AS "formVersion"
        FROM surveys s
        INNER JOIN form_versions fv ON fv.id = s."formVersionId"
        INNER JOIN forms f ON f.id = fv."formId"
        LEFT JOIN data_warga w ON w.nik = s."wargaNik"
        LEFT JOIN users u ON u.id = s."petugasId"
        ORDER BY s."tanggal" DESC
        LIMIT ${limit}
    `)
    return rows as unknown as BarisIsianForm[]
}

/** Satu baris riwayat submit untuk tab "Riwayat Submit Form". */
export interface BarisRiwayatSubmit {
    id: string
    tanggal: string
    dibuat: string
    formNama: string
    formKode: string | null
    formVersion: number
    petugas: string
    nik: string | null
    nama: string
    kelurahan: string
    jumlahJawaban: number
}

/**
 * Bentuk jsonb yang aman lewat boundary server-fn.
 *
 * `survey_entries.value` bertipe `unknown` di sisi drizzle, dan `unknown` tidak
 * lolos cek serialisasi TanStack Start. Tipe di bawah adalah jsonb yang sebenarnya
 * (tanpa `undefined`/fungsi/siklus), jadi nilai apa pun yang ada di database bisa
 * di-cast ke sini tanpa menebak-nebak.
 */
export type JsonNilai = string | number | boolean | null | JsonNilai[] | { [key: string]: JsonNilai }

/** Satu jawaban beserta label field-nya, untuk panel detail riwayat. */
export interface BarisJawabanSubmit {
    fieldId: string
    nama: string
    label: string
    tipe: string
    urutan: number
    /** Bentuk jsonb apa adanya; diformat di klien lewat `formatNilaiJawapan`. */
    value: JsonNilai
    /** Baris `form_field_options`, untuk memetakan value ke label. */
    opsi: Array<{ value: string; label: string | null }>
}

/**
 * Daftar submit dari semua form, untuk tab "Riwayat Submit Form".
 *
 * Berbeda dengan `querySurveysWithWarga`: tidak ada syarat warga, dan diurutkan
 * `createdAt` (bukan `tanggal`) supaya submit yang tanggal isiannya lama tapi
 * baru dikirim tetap muncul di atas. `formId` opsional untuk menyaring satu
 * form; `q` sengaja tidak dipaksakan ke SQL — pencarian teks diserahkan ke klien
 * karena halamannya sudah mengambil 200 baris.
 */
export async function queryRiwayatSubmit(params: {
    limit?: number
    formId?: number | null
}): Promise<BarisRiwayatSubmit[]> {
    const limit = params.limit ?? 200
    const filterForm = params.formId ? sql`AND f.id = ${params.formId}` : sql``

    const rows = await db.execute(sql`
        SELECT
            s.id                                   AS "id",
            to_char(s."tanggal", 'YYYY-MM-DD')     AS "tanggal",
            to_char(s."createdAt", 'YYYY-MM-DD HH24:MI') AS "dibuat",
            f.nama                                 AS "formNama",
            f.kode                                 AS "formKode",
            fv.version                             AS "formVersion",
            COALESCE(u."nama", '—')                AS "petugas",
            s."wargaNik"                           AS "nik",
            COALESCE(w."nama_art", '—')            AS "nama",
            COALESCE(w."kelurahan", '—')           AS "kelurahan",
            (SELECT COUNT(*)::int FROM survey_entries e WHERE e."surveyId" = s.id) AS "jumlahJawaban"
        FROM surveys s
        INNER JOIN form_versions fv ON fv.id = s."formVersionId"
        INNER JOIN forms f ON f.id = fv."formId"
        LEFT JOIN data_warga w ON w.nik = s."wargaNik"
        LEFT JOIN users u ON u.id = s."petugasId"
        WHERE TRUE
        ${filterForm}
        ORDER BY s."createdAt" DESC
        LIMIT ${limit}
    `)
    return rows as unknown as BarisRiwayatSubmit[]
}

/**
 * Jawaban satu submit, lengkap dengan label field dan opsi pilihannya.
 *
 * Opsi diambil terpisah dari `form_field_options` karena satu field bisa punya
 * puluhan baris opsi; join langsung ke `survey_entries` akan mengalikan baris
 * jawaban dan membuat jumlah jawaban tidak jujur.
 */
export async function queryJawabanSubmit(surveyId: string): Promise<BarisJawabanSubmit[]> {
    const jawaban = await db
        .select({
            fieldId: surveyEntries.fieldId,
            nama: formFields.nama,
            label: formFields.label,
            tipe: formFields.tipe,
            urutan: formFields.urutan,
            value: surveyEntries.value,
        })
        .from(surveyEntries)
        .innerJoin(formFields, eq(formFields.id, surveyEntries.fieldId))
        .where(eq(surveyEntries.surveyId, surveyId))

    if (jawaban.length === 0) return []

    const opsi = await db
        .select({
            fieldId: formFieldOptions.fieldId,
            value: formFieldOptions.value,
            label: formFieldOptions.label,
        })
        .from(formFieldOptions)
        .where(inArray(
            formFieldOptions.fieldId,
            jawaban.map((j) => j.fieldId),
        ))

    const opsiByField = new Map<string, Array<{ value: string; label: string | null }>>()
    for (const o of opsi) {
        const list = opsiByField.get(o.fieldId) ?? []
        list.push({ value: o.value, label: o.label })
        opsiByField.set(o.fieldId, list)
    }

    return jawaban.map((j) => ({
        fieldId: j.fieldId,
        nama: j.nama,
        label: j.label,
        tipe: j.tipe,
        urutan: j.urutan,
        value: j.value as JsonNilai,
        opsi: opsiByField.get(j.fieldId) ?? [],
    }))
}

/**
 * Satu baris ringkas untuk satu `surveyId`, dipakai panel detail riwayat.
 *
 * Query terpisah, bukan mencari di hasil `querySurveysWithWarga`: daftar itu
 * dibatasi 500 baris terbaru, jadi submit lama tidak akan ketemu di sana.
 */
export async function queryRingkasanSubmit(surveyId: string): Promise<BarisIsianForm | null> {
    const rows = await db.execute(sql`
        SELECT
            s.id                                   AS "id",
            to_char(s."tanggal", 'YYYY-MM-DD')     AS "tanggal",
            s."wargaNik"                           AS "nik",
            COALESCE(w."nama_art", '—')            AS "nama",
            COALESCE(w."kelurahan", '—')           AS "kelurahan",
            COALESCE(u."nama", '—')                AS "petugas",
            f.nama                                 AS "formNama",
            f.kode                                 AS "formKode",
            fv.version                             AS "formVersion"
        FROM surveys s
        INNER JOIN form_versions fv ON fv.id = s."formVersionId"
        INNER JOIN forms f ON f.id = fv."formId"
        LEFT JOIN data_warga w ON w.nik = s."wargaNik"
        LEFT JOIN users u ON u.id = s."petugasId"
        WHERE s.id = ${surveyId}
        LIMIT 1
    `)
    const baris = rows as unknown as BarisIsianForm[]
    return baris[0] ?? null
}

/** Form yang punya submission, untuk dropdown filter tab riwayat. */
export async function queryFormAdaSubmit(): Promise<
    Array<{ formId: number; nama: string; jumlahSubmit: number }>
> {
    const rows = await db.execute(sql`
        SELECT f.id AS "formId", f.nama AS "nama", COUNT(s.id)::int AS "jumlahSubmit"
        FROM surveys s
        INNER JOIN form_versions fv ON fv.id = s."formVersionId"
        INNER JOIN forms f ON f.id = fv."formId"
        GROUP BY f.id, f.nama
        ORDER BY f.nama
    `)
    return rows as unknown as Array<{ formId: number; nama: string; jumlahSubmit: number }>
}

