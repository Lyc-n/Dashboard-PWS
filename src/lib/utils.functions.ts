import { createMiddleware, createServerFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";
import { destroySession, getKunjunganRumahRecord, isValidPin, listKegiatanRecords, listKunjunganRumahRecords, queryAllSurveyData, querySurveyors, querySurveysWithWarga, querySurveyStatsByNik, queryWargaList, removeKegiatanRecord, removeKunjunganRumahRecord, saveKegiatanRecord, saveKunjunganRumahRecord, touchSession, updateKunjunganRumahRecord } from "./utils.server";


/* ALUR LOGIN
1. cek sessionToken pake beforeLoad di /laporan (form)
2. sessionToken di crosscheck ke validSessions di DB
3. kalo gk ada kredensial redirect ke pin
4. pin valid redirect ke /laporan
5. update expireTime sessionToken kalo akses /laporan
*/


/* TODO 
1. bikin server function buat load semua data survey [X]
2. bikin login function
3. ngambil session token yang udah ada di cookie [X]
4. cek session token ke db [X]
5. if token valid, update expire time
6. kalo pin valid, kasih akses form [X]
7. crosscheck sesionToken waktu form submmision dengan valid session di db (authMiddleware) 
*/

// ganti method GET → POST — expect: login tak bisa dipicu lewat link/GET
export const pinLogin = createServerFn({ method: "POST" })
    .validator((data: { pin: number }) => data)
    .handler(
        async ({ data }) => {
            return await isValidPin(data.pin) // selalu return boolean
        }
)

export const getSessionToken = createServerFn({ method: "GET" })
    .handler(
        async () => {
            const sessionToken = getCookie('session')
            if (!sessionToken) throw new Error('Unauthorized') // gak pernah login
            return await touchSession(sessionToken)
        }
)

export const logoutSession = createServerFn({ method: "POST" })
    .handler(
        async () => {
            await destroySession(getCookie('session'))
        }
)

//   crosscheck sessionToken ke valid_session ? beres; token bajakan/ kedaluwarsa ditolak.
export const authSessionToken = createMiddleware({ type: "function" }).server(
    async ({ next }) => {
        const sessionToken = getCookie('session')
        if (!sessionToken) throw new Error("Unauthorized")
        const session = await touchSession(sessionToken)
        return next({ context: { sessionToken, profile: session.profile } })
    }
)

// tipe JSON yang dikenali serialisasi RPC TanStack (jawaban jsonb dari drizzle bertipe `unknown`)
type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

// [perbaikan] daftar petugas lewat server fn terproteksi middleware — expect: opsi dropdown
//   datang dari DB, klien tanpa sesi valid ditolak sebelum data keluar.
export const listSurveyors = createServerFn({ method: "GET" })
    .middleware([authSessionToken])
    .handler(
        async () => {
            return await querySurveyors()
        }
    )

export const getAllSurveyData = createServerFn({ method: "GET" })
    .middleware([authSessionToken])
    .handler(
        async () => {
            const rows = await queryAllSurveyData()
            return rows.map((row) => ({ ...row, jawaban: row.jawaban as JsonValue }))
        }
    )

// ---- read model DB untuk UI (pengganti data dummy) ----
export interface SasaranListRow {
    nik: string;
    nama: string;
    kelurahan: string;
    status: "Sudah" | "Belum";
    tgl: string | null;
    kunjunganRumah: number;
}

export interface SurveyRow {
    id: string;
    tanggal: string;
    nik: string;
    nama: string;
    kelurahan: string;
    petugas: string;
}

export interface KelurahanStat {
    name: string;
    total: number;
    dikunjungi: number;
    pct: number;
    sub: string;
}

export interface DashboardData {
    totals: { warga: number; dikunjungi: number; kunjunganRumah: number };
    kelurahan: KelurahanStat[];
    recent: SurveyRow[];
}

export const getSasaranList = createServerFn({ method: "GET" })
    .middleware([authSessionToken])
    .handler(
        async (): Promise<SasaranListRow[]> => {
            const [warga, stats] = await Promise.all([queryWargaList(), querySurveyStatsByNik()])
            const byNik = new Map(stats.map((s) => [s.nik, s]))
            return warga.map((w) => {
                const st = byNik.get(w.nik)
                return {
                    nik: w.nik,
                    nama: w.nama_art,
                    kelurahan: w.kelurahan,
                    status: st ? "Sudah" : "Belum",
                    tgl: st?.terakhir ?? null,
                    kunjunganRumah: st?.total ?? 0,
                }
            })
        }
    )

export const getSasaranDetail = createServerFn({ method: "GET" })
    .middleware([authSessionToken])
    .validator((data: { nik: string }) => data)
    .handler(
        async ({ data }) => {
            const [warga, surveys] = await Promise.all([queryWargaList(), querySurveysWithWarga(500)])
            const found = warga.find((w) => w.nik === data.nik) ?? null
            if (!found) return { warga: null, surveys: [] as SurveyRow[] }
            return { warga: found, surveys: surveys.filter((s) => s.nik === data.nik) }
        }
    )

export const getDashboardData = createServerFn({ method: "GET" })
    .middleware([authSessionToken])
    .handler(
        async (): Promise<DashboardData> => {
            const [warga, stats, recent] = await Promise.all([
                queryWargaList(),
                querySurveyStatsByNik(),
                querySurveysWithWarga(50),
            ])
            const visited = new Set(stats.map((s) => s.nik))
            const byKel = new Map<string, { total: number; dikunjungi: number }>()
            for (const w of warga) {
                const cur = byKel.get(w.kelurahan) ?? { total: 0, dikunjungi: 0 }
                cur.total += 1
                if (visited.has(w.nik)) cur.dikunjungi += 1
                byKel.set(w.kelurahan, cur)
            }
            const kelurahan: KelurahanStat[] = [...byKel.entries()].map(([name, v]) => ({
                name,
                total: v.total,
                dikunjungi: v.dikunjungi,
                pct: v.total ? Math.round((v.dikunjungi / v.total) * 100) : 0,
                sub: `${v.dikunjungi} / ${v.total} jiwa dikunjungi`,
            }))
            return {
                totals: {
                    warga: warga.length,
                    dikunjungi: visited.size,
                    kunjunganRumah: stats.reduce((a, s) => a + s.total, 0),
                },
                kelurahan,
                recent,
            }
        }
    )

export const getLaporanKunjunganRumah = createServerFn({ method: "GET" })
    .middleware([authSessionToken])
    .handler(
        async (): Promise<SurveyRow[]> => {
            return await querySurveysWithWarga(500)
        }
    )

// ---- kunjungan rumah — CRUD langsung ke DB, tanpa localStorage ----
export const listKunjunganRumah = createServerFn({ method: "GET" })
    .middleware([authSessionToken])
    .handler(async () => await listKunjunganRumahRecords())

export const getKunjunganRumah = createServerFn({ method: "GET" })
    .middleware([authSessionToken])
    .validator((data: { id: string }) => data)
    .handler(async ({ data }) => await getKunjunganRumahRecord(data.id))

export const saveKunjunganRumah = createServerFn({ method: "POST" })
    .middleware([authSessionToken])
    .validator((data: { record: Record<string, unknown> }) => data)
    .handler(async ({ data }) => await saveKunjunganRumahRecord(data.record))

export const updateKunjunganRumah = createServerFn({ method: "POST" })
    .middleware([authSessionToken])
    .validator((data: { id: string; record: Record<string, unknown> }) => data)
    .handler(async ({ data }) => await updateKunjunganRumahRecord(data.id, data.record))

export const removeKunjunganRumah = createServerFn({ method: "POST" })
    .middleware([authSessionToken])
    .validator((data: { id: string }) => data)
    .handler(async ({ data }) => {
        await removeKunjunganRumahRecord(data.id)
    })

// ---- kegiatan pemberdayaan — CRUD langsung ke DB, tanpa localStorage ----
export const listKegiatan = createServerFn({ method: "GET" })
    .middleware([authSessionToken])
    .handler(async () => await listKegiatanRecords())

export const saveKegiatan = createServerFn({ method: "POST" })
    .middleware([authSessionToken])
    .validator((data: { record: Record<string, unknown> }) => data)
    .handler(async ({ data }) => await saveKegiatanRecord(data.record))

export const removeKegiatan = createServerFn({ method: "POST" })
    .middleware([authSessionToken])
    .validator((data: { id: string }) => data)
    .handler(async ({ data }) => {
        await removeKegiatanRecord(data.id)
    })
