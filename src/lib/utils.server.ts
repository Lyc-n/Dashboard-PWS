import { db } from './db.server'
import { surveys, validSession } from './schema' // coba pakai tabel surveys untuk form
import { jwtVerify, SignJWT } from 'jose'
import { createHash, randomBytes } from 'node:crypto';
import { setCookie } from '@tanstack/react-start/server';
import { eq } from 'drizzle-orm'
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

// [perbaikan] jeda tetap 1 detik per percobaan PIN — expect: brute-force 6 digit butuh ±58 hari
//   utk 1 juta percobaan; durasi sama untuk benar/salah sehingga latency tak membocorkan PIN.
function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function isValidPin(pin: number) {
    await sleep(1000)
    if (String(pin) !== process.env.PIN) return false // expect: client terima `false` biasa, jadi alur form tak terputus oleh error mentah.
    // [perbaikan] satu sesi aktif: hapus SEMUA row valid_session sebelum membuat sesi baru —
    //   expect: login baru membunuh token lama di device lain; row expired ikut terbuang tiap login.
    await db.delete(validSession)
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

// session hanya 1 jam. token palsu/kedaluwarsa/sudah dihapus = logout
export async function touchSession(sessionToken: string): Promise<{ profile: AuthUser; expiresAt: Date }> {
    try {
        const { payload } = await jwtVerify(sessionToken, getSecretKey(), { algorithms: ["HS256"] })
        const profile = payload.profile as AuthUser | undefined
        if (!profile) throw new Error('Unauthorized')

        const row = await db.query.validSession.findFirst({
            where: { token: hashToken(sessionToken) }
        })
        if (!row) throw new Error('Unauthorized')
        if (row.expiresAt.getTime() < Date.now()) {
            // [perbaikan] row kedaluwarsa ikut dihapus, bukan cuma ditolak —
            //   expect: sesi yang ditinggal mati tak menumpuk selamanya di valid_session.
            await db.delete(validSession).where(eq(validSession.uid, row.uid))
            throw new Error('Unauthorized')
        }

        const expiresAt = new Date(Date.now() + SESSION_IDLE_MS)
        await db.update(validSession)
            .set({ expiresAt })
            .where(eq(validSession.uid, row.uid))
        return { profile, expiresAt }
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

// [perbaikan] daftar petugas dari tabel surveyor — expect: dropdown Petugas di form checklist
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
