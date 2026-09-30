import { createMiddleware, createServerFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";
import {
    destroySession,
    getKunjunganRumahRecord,
    getKunjunganRumahTemplateRows,
    isValidPin,
    listKunjunganRumahRecords,
    querySurveyors,
    querySasaranByNik,
    querySasaranListPaged,
    querySasaranWarga,
    querySurveysWithWarga,
    querySurveyStatsByNik,
    queryWargaList,
    queryRiwayatKsUntukNik,
    removeKunjunganRumahRecord,
    saveKunjunganRumahRecord,
    touchSession,
    updateKunjunganRumahRecord,
} from "./utils.server";
import type { BarisWargaGabungan, RiwayatSasaran } from "./utils.server";
import {
    hapusKegiatan,
    listKegiatan as listKegiatanV2,
    simpanKegiatan,
} from "@/features/survey/services/kegiatan.server";
import {
    listFasKes,
    listKaderAktif,
    listPengguna,
    listPetugasOpsi,
    simpanPengguna,
    setPenggunaAktif,
} from "./user-registry.server";


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

// [perbaikan] daftar petugas lewat server fn terproteksi middleware — expect: opsi dropdown
//   datang dari DB, klien tanpa sesi valid ditolak sebelum data keluar.
export const listSurveyors = createServerFn({ method: "GET" })
    .middleware([authSessionToken])
    .handler(
        async () => {
            return await querySurveyors()
        }
    )

// ---- read model DB untuk UI (pengganti data dummy) ----
export interface SasaranListRow {
    rawId: string;
    nik: string;
    nikValid: boolean;
    needsUpdate: boolean;
    nama: string;
    kelurahan: string;
    status: "Sudah" | "Belum";
    tgl: string | null;
    kunjunganRumah: number;
}

export interface SasaranListResult {
    rows: SasaranListRow[];
    total: number;
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

// Halaman /sasaran memakai sumber gabungan (`data_warga` + `data_warga_import`)
// supaya daftar tidak cuma berisi 1 baris. Filter dan paginasi diproses server
// (lihat `querySasaranListPaged`) — klien cukup kirim q/status/kel/page.
export const getSasaranList = createServerFn({ method: "GET" })
    .middleware([authSessionToken])
    .validator((data: { q?: string; status?: string; kel?: string; page?: number; all?: boolean }) => data)
    .handler(
        async ({ data }): Promise<SasaranListResult> => {
            const q = data.q ?? ""
            const status = (data.status ?? "all") as "all" | "Sudah" | "Belum"
            const result = await querySasaranListPaged({
                q,
                status,
                kel: data.kel ?? "all",
                page: data.page ?? 1,
                pageSize: 10,
                all: data.all ?? false,
            })
            const stats = await querySurveyStatsByNik()
            const byNik = new Map(stats.map((s) => [s.nik, s]))
            const rows: SasaranListRow[] = result.rows.map((w) => {
                // NIK tampil bisa berupa NIK sementara (derive raw_id) yang bukan
                // NIK asli di `surveys`; `wargaNik` hanya terisi NIK asli. Jadi
                // statistik dicocokkan lewat `nik` hasil derive — baris sementara
                // tidak akan pernah ketemu, dan itu memang benar (belum dikunjungi).
                const st = byNik.get(w.nik)
                return {
                    rawId: w.rawId,
                    nik: w.nik,
                    nikValid: w.nikValid,
                    needsUpdate: w.needsUpdate,
                    nama: w.nama_art,
                    kelurahan: w.kelurahan,
                    status: st ? "Sudah" : "Belum",
                    tgl: st?.terakhir ?? null,
                    kunjunganRumah: st?.total ?? 0,
                }
            })
            return { rows, total: result.total }
        }
    )

/** Baris warga di halaman detail: bentuk gabungan + kolom riwayat KS yang
 *  ditambahkan opsional. Yang tidak ada di `riwayat_ks_import` tetap `null`. */
export type SasaranDetailRow = BarisWargaGabungan & RiwayatSasaran

export const getSasaranDetail = createServerFn({ method: "GET" })
    .middleware([authSessionToken])
    .validator((data: { nik: string }) => data)
    .handler(
        async ({ data }): Promise<{ warga: SasaranDetailRow | null; surveys: SurveyRow[] }> => {
            const [warga, surveys] = await Promise.all([querySasaranByNik(data.nik), querySurveysWithWarga(500)])
            // NIK yang hanya ada di `data_warga_import` juga ketemu di sini, jadi
            // detail menampilkan data awal import dan tidak lagi "tidak ditemukan"
            // — pencariannya per NIK (bukan scan daftar penuh seperti sebelumnya).
            const found = warga
            if (!found) return { warga: null, surveys: [] as SurveyRow[] }
            const riwayat = await queryRiwayatKsUntukNik(found.rawId ?? data.nik)
            return {
                warga: { ...found, ...riwayat },
                surveys: surveys.filter((s) => s.nik === found.nik || s.nik === data.nik),
            }
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
// Definisi form (section + question + opsi select) dibaca dari DB. Dipisah dari record
// karena bentuknya berbeda: yang ini bisa berubah tiap admin menyunting form, yang
// record tidak boleh ikut berubah bentuk.
export const getKunjunganRumahTemplate = createServerFn({ method: "GET" })
    .middleware([authSessionToken])
    .handler(async () => {
        const rows = await getKunjunganRumahTemplateRows()
        if (!rows) return null
        return rows
    })

export const listKunjunganRumah = createServerFn({ method: "GET" })
    .middleware([authSessionToken])
    .handler(async () => await listKunjunganRumahRecords())

/** Suggestion warga sasaran untuk form Kunjungan Rumah, dibaca dari
 *  `data_warga_import`. Dipakai saat user mengetik NIK atau nama KK; hasilnya
 *  hanya mengisi form, tidak menyentuh `data_warga` — insert ke sana tetap
 *  terjadi saat user menekan Simpan. */
export const cariSasaranWarga = createServerFn({ method: "POST" })
    .middleware([authSessionToken])
    .validator((data: { q: string }) => data)
    .handler(async ({ data }) => await querySasaranWarga(data.q))

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

// ---- kegiatan pemberdayaan — generic submission v2 ----
// formerly ditulis ke tabel `kegiatan_records`, yang sudah dihapus dari database
// sehingga fitur ini mati saat runtime. Sekarang lewat `surveys` + `survey_entries`
// dengan `surveys.petugasId` menunjuk `users.id` hasil dropdown Petugas.
export const listKegiatan = createServerFn({ method: "GET" })
    .middleware([authSessionToken])
    .handler(async () => await listKegiatanV2())

export const saveKegiatan = createServerFn({ method: "POST" })
    .middleware([authSessionToken])
    .validator((data: { record: Record<string, unknown> }) => data)
    .handler(async ({ data }) => await simpanKegiatan(data.record))

export const removeKegiatan = createServerFn({ method: "POST" })
    .middleware([authSessionToken])
    .validator((data: { id: string }) => data)
    .handler(async ({ data }) => {
        await hapusKegiatan(data.id)
    })

// ---- registry pengguna (pengganti master admin /kelola) ----
// Penulisan hanya bisa dari /kelola, yang route-nya sudah dilindungi requireAdmin.
//
// CATATAN: `requireAdmin` membaca role dari `SESSION_PROFILE` yang hard-coded
// "Admin" (lihat src/lib/auth.ts), jadi "hanya admin" di sini sama sekali belum
// merupakan penjaga akses yang sebenarnya. Yang dicek di sini adalah data:
// facility yang dipilih harus benar-benar ada.
export const listUserRegistry = createServerFn({ method: "GET" })
    .middleware([authSessionToken])
    .handler(async () => await listPengguna());

export const listFasKesOpsi = createServerFn({ method: "GET" })
    .middleware([authSessionToken])
    .handler(async () => await listFasKes());

export const saveUserRegistry = createServerFn({ method: "POST" })
    .middleware([authSessionToken])
    .validator((data: { namaLama: string | null; row: unknown }) => data)
    .handler(async ({ data }) => await simpanPengguna(data.namaLama, data.row));

export const setUserRegistryAktif = createServerFn({ method: "POST" })
    .middleware([authSessionToken])
    .validator((data: { nama: string; aktif: boolean }) => data)
    .handler(async ({ data }) => {
        await setPenggunaAktif(data.nama, data.aktif);
    });

/** Dipakai /kelola untuk mengisi dropdown kader, dan Form Kunjungan Rumah untuk petugas. */
export const listPetugasAktif = createServerFn({ method: "GET" })
    .middleware([authSessionToken])
    .validator((data: { fasKesId?: number | null }) => data)
    .handler(async ({ data }) => await listPetugasOpsi(data.fasKesId ?? null));

/** Daftar kader aktif untuk filter Rekap Kunjungan Rumah. */
export const listKaderUntukRekap = createServerFn({ method: "GET" })
    .middleware([authSessionToken])
    .validator((data: { fasKesId?: number | null }) => data)
    .handler(async ({ data }) => await listKaderAktif(data.fasKesId ?? null));
