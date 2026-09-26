import { db } from './db.server'
import { kegiatanRecords, kunjunganRumahRecords, surveys, validSession } from './schema' // coba pakai tabel surveys untuk form
import { jwtVerify, SignJWT } from 'jose'
import { createHash, randomBytes } from 'node:crypto';
import { setCookie } from '@tanstack/react-start/server';
import { eq, sql } from 'drizzle-orm'
import { SESSION_IDLE_MS, SESSION_PROFILE, SESSION_TTL_MS } from './constants'
import type { AuthUser } from './auth'


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

export async function isValidPin(pin: number) {
    await sleep(1000)
    if (String(pin) !== process.env.PIN) return false // expect client terima `false` biasa, jadi alur form tak terputus oleh error mentah.
    await db.delete(validSession) // hanya satu sesi aktif tiap akun -> login ke device lain dengan akun sama, maka device sebelumnya logout
    setCookie('session', await createSessionHelper(), { // umur cookie 12 jam
        httpOnly: true,
        secure: true,
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

// session hanya 1 jam. token palsu/kedaluwarsa/sudah dihapus = logout
export async function touchSession(sessionToken: string): Promise<{ profile: AuthUser; expiresAt: Date }> {
    try {
        const { payload } = await jwtVerify(sessionToken, getSecretKey(), { algorithms: ["HS256"] })
        const profile = payload.profile as AuthUser | undefined
        if (!profile) throw new Error('Unauthorized')

        const tokenHash = hashToken(sessionToken)
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
            await db.delete(validSession).where(eq(validSession.token, tokenHash)) // buang baris kedaluwarsa saat token ditolak
            throw new Error('Unauthorized')
        }
        return { profile, expiresAt: new Date(exp * 1000) }
    } catch {
        throw new Error('Unauthorized')
    }
}

// logout server-side: hapus row, kosongkan cookie
export async function destroySession(sessionToken?: string) {
    if (sessionToken) {
        await db.delete(validSession).where(eq(validSession.token, hashToken(sessionToken)))
    }
    setCookie('session', '', { httpOnly: true, secure: true, path: '/', maxAge: 0 })
}

// ganti `riwayatSurvey` → `surveys`
export async function queryAllSurveyData() {
    return await db.query.surveys.findMany()
}

// [perbaikan] daftar petugas dari tabel surveyor — expect: dropdown Petugas di form kunjungan rumah
//   selalu sinkron dengan isi DB (ikut diisi seed).
export async function querySurveyors() {
    return await db.query.surveyor.findMany({ columns: { id: true, nama: true } })
}

export async function getPetugasByName(queryName: string) {
    return await db.query.surveyor.findFirst({ where: { nama: queryName } })
}

// satu NIK boleh punya banyak survei
export async function putSurveyData(newData: typeof surveys.$inferInsert) {
    await db.insert(surveys).values(newData)
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

export async function listKunjunganRumahRecords() {
    const rows = await db.query.kunjunganRumahRecords.findMany({ orderBy: (t, { desc }) => [desc(t.createdAt)] });
    return rows.map((r) => ({ id: r.id, ...(r.payload as JsonRecord) }));
}

export async function getKunjunganRumahRecord(id: string) {
    const row = await db.query.kunjunganRumahRecords.findFirst({ where: { id } });
    if (!row) return null;
    return { id: row.id, ...(row.payload as JsonRecord) };
}

export async function saveKunjunganRumahRecord(payload: unknown) {
    const rec = asJsonRecord(payload);
    if (typeof rec.waktuSimpan !== "string" || !rec.waktuSimpan) throw new Error("waktuSimpan wajib diisi");
    if (!rec.info || typeof rec.info !== "object") throw new Error("info keluarga wajib diisi");
    const clean: JsonRecord = { ...rec, fotos: cleanFotos(rec.fotos) };
    const [row] = await db.insert(kunjunganRumahRecords).values({ payload: clean }).returning();
    if (!row) throw new Error("Gagal menyimpan kunjungan rumah");
    return { id: row.id, ...(row.payload as JsonRecord) };
}

export async function updateKunjunganRumahRecord(id: string, payload: unknown) {
    const rec = asJsonRecord(payload);
    const clean: JsonRecord = { ...rec, fotos: cleanFotos(rec.fotos) };
    const [row] = await db
        .update(kunjunganRumahRecords)
        .set({ payload: clean, updatedAt: new Date() })
        .where(eq(kunjunganRumahRecords.id, id))
        .returning();
    if (!row) throw new Error("Kunjungan rumah tidak ditemukan");
    return { id: row.id, ...(row.payload as JsonRecord) };
}

export async function removeKunjunganRumahRecord(id: string) {
    await db.delete(kunjunganRumahRecords).where(eq(kunjunganRumahRecords.id, id));
}

// ---- kegiatan pemberdayaan langsung ke DB — pengganti localStorage `pws-kegiatan` ----
const KEGIATAN_REQUIRED = ["nama", "pj", "tgl", "kel", "lokasi"] as const;

export async function listKegiatanRecords() {
    const rows = await db.query.kegiatanRecords.findMany({ orderBy: (t, { desc }) => [desc(t.createdAt)] });
    return rows.map((r) => ({ id: r.id, ...(r.payload as JsonRecord) }));
}

export async function saveKegiatanRecord(payload: unknown) {
    const rec = asJsonRecord(payload);
    for (const k of KEGIATAN_REQUIRED) {
        const v = rec[k];
        if (typeof v !== "string" || !v.trim()) throw new Error(`Field ${k} wajib diisi`);
    }
    const [row] = await db.insert(kegiatanRecords).values({ payload: rec }).returning();
    if (!row) throw new Error("Gagal menyimpan kegiatan");
    return { id: row.id, ...(row.payload as JsonRecord) };
}

export async function removeKegiatanRecord(id: string) {
    await db.delete(kegiatanRecords).where(eq(kegiatanRecords.id, id));
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

export async function querySurveyStatsByNik(): Promise<Array<{ nik: string; total: number; terakhir: string | null }>> {
    const rows = await db.execute(sql`
        SELECT nik AS "nik", COUNT(*)::int AS "total", MAX(tanggal)::text AS "terakhir"
        FROM surveys GROUP BY nik
    `)
    return rows as unknown as Array<{ nik: string; total: number; terakhir: string | null }>
}

export async function querySurveysWithWarga(limit = 500) {
    const [surveyList, wargaList, staff] = await Promise.all([
        db.query.surveys.findMany({ orderBy: (t, { desc }) => [desc(t.tanggal)], limit }),
        db.query.dataWargaTable.findMany({ columns: { nik: true, nama_art: true, kelurahan: true } }),
        db.query.surveyor.findMany({ columns: { id: true, nama: true } }),
    ])
    const wargaByNik = new Map(wargaList.map((w) => [w.nik, w]))
    const staffById = new Map(staff.map((s) => [s.id, s.nama]))
    return surveyList.map((s) => ({
        id: s.id,
        tanggal: s.tanggal,
        nik: s.nik,
        nama: wargaByNik.get(s.nik)?.nama_art ?? s.nik,
        kelurahan: wargaByNik.get(s.nik)?.kelurahan ?? "—",
        petugas: staffById.get(s.petugasId) ?? "—",
    }))
}
