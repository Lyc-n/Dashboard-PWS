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
import {
    buatFormBaru,
    daftarVersiForm,
    hapusForm,
    listFormBaru,
} from "@/features/form-builder/services/form.server";
import { ambilDefinisiVersi } from "@/features/form-builder/services/section.server";
import { buildFormVersion } from "@/features/form-builder/services/build.server";
import type { BuildFormVersionInput, BuildFormVersionResult } from "@/features/kelola/components/builder/types";
import {
    buatDraftBerikutnya,
    terbitkanVersiForm,
} from "@/features/form-builder/services/form-version.server";
import {
    ambilFormulirUntukIsi,
    daftarFormulirTerisi,
    simpanFormulir as simpanFormulirRuntime,
} from "@/features/survey/services/form-runtime.server";
import type { SimpanFormulirInput } from "@/features/survey/services/form-runtime.server";
import { SEMUA_TIPE_FIELD, TIPE_BUTUH_OPSI } from "@/features/form-builder/services/validasi";


/* ALUR LOGIN
1. cek sessionToken pake beforeLoad di /laporan (form)
2. sessionToken di crosscheck ke validSessions di DB
3. kalo gk ada kredensial redirect ke pin
4. pin valid redirect ke /laporan
5. update expireTime sessionToken kalo akses /laporan
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
            const riwayat = await queryRiwayatKsUntukNik(found.rawId ? found.rawId : data.nik)
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

// ---- form builder (tab /kelola) ----
// Lapisan server function untuk editor form. Semua bentuk datanya milik
// services/, validator di sini hanya meneruskan supaya tidak ada bentuk kedua
// yang bisa berbeda dari yang dipakai validasi backend.
//
// `actorId` selalu null: login aplikasi memakai satu PIN global dan tidak ada
// pemetaan session -> `users.id` (lihat catatan autentikasi di
// src/lib/user-registry.server.ts), jadi petugas tidak bisa disimpulkan dari
// sesi. Audit tetap terekam karena `audit_logs.userId` nullable.
//
// `KesalahanValidasi` sengaja dibiarkan terlempar apa adanya supaya petugas
// melihat `pesan` yang sudah ditulis services, bukan pesan generik.

export const listFormBuilder = createServerFn({ method: "GET" })
    .middleware([authSessionToken])
    .handler(async () => await listFormBaru());

export const ambilEditorForm = createServerFn({ method: "GET" })
    .middleware([authSessionToken])
    .validator((data: { formVersionId: string }) => data)
    .handler(async ({ data }) => await ambilDefinisiVersi(data.formVersionId));

export const daftarVersiBuilder = createServerFn({ method: "GET" })
    .middleware([authSessionToken])
    .validator((data: { formId: number }) => data)
    .handler(async ({ data }) => await daftarVersiForm(data.formId));

/** Daftar tipe field untuk editor. Satu-satunya sumbernya `SEMUA_TIPE_FIELD` dan
 *  `TIPE_BUTUH_OPSI` di services/validasi.ts — backend yang menolak field tanpa
 *  opsi, jadi UI tidak boleh menyimpan salinannya sendiri karena cepat berbeda.
 *  Enum `form_field_type` tidak dibaca langsung: mengimpornya menarik drizzle
 *  pg-core ke bundle klien. */
export const daftarJenisField = createServerFn({ method: "GET" })
    .middleware([authSessionToken])
    .handler(async () => ({ semua: [...SEMUA_TIPE_FIELD], butuhOpsi: [...TIPE_BUTUH_OPSI] }));

export const buatFormBuilder = createServerFn({ method: "POST" })
    .middleware([authSessionToken])
    .validator((data: { nama: string; deskripsi?: string }) => data)
    .handler(async ({ data }) => await buatFormBaru({ nama: data.nama, deskripsi: data.deskripsi, actorId: null }));

/** Versi published dibekukan, jadi perubahan struktur harus punya draft baru.
 *  `dariVersiId` hanya dipakai service untuk memastikan versi asal benar milik
 *  form ini; tidak diisi berarti pemanggil memang meminta versi berikutnya. */
export const buatDraftBuilder = createServerFn({ method: "POST" })
    .middleware([authSessionToken])
    .validator((data: { formId: number; dariVersiId?: string }) => data)
    .handler(async ({ data }) => await buatDraftBerikutnya(data.formId, { dariVersiId: data.dariVersiId }));

export const terbitkanVersiBuilder = createServerFn({ method: "POST" })
    .middleware([authSessionToken])
    .validator((data: { formVersionId: string }) => data)
    .handler(async ({ data }) => await terbitkanVersiForm(data.formVersionId, { actorId: null }));

export const hapusFormBuilder = createServerFn({ method: "POST" })
    .middleware([authSessionToken])
    .validator((data: { formId: number }) => data)
    .handler(async ({ data }) => {
        await hapusForm({ formId: data.formId, actorId: null });
    });

export const buildFormBuilder = createServerFn({ method: "POST" })
    .middleware([authSessionToken])
    .validator((data: BuildFormVersionInput) => data)
    .handler(async ({ data }): Promise<BuildFormVersionResult> => {
        return await buildFormVersion(data);
    });

// ---- runtime form generik (isi form dari definisi yang tayang) ----
// Lawanan dari Form Builder di atas: Builder memegang definisi form (forms,
// form_versions, form_sections, form_fields, form_field_rules) dan satu-satunya
// yang boleh menulisnya, sedangkan runtime hanya MEMBACA definisi itu dan
// menulis ke `surveys` + `survey_entries`. Pemisahan ini yang membuat "define +
// publish" benar-benar terpisah dari "read published + fill": menyunting form
// tidak mungkin mengubah apa yang sedang diisi petugas, karena yang tayang
// adalah versi `published` yang tidak bisa diedit.
//
// Tidak ada nama form, `forms.kode`, atau `nama` field yang ditulis di sini.
// Semua yang tampil dan semua yang divalidasi berasal dari database, diambil
// lewat id atau status, supaya form baru yang dibuat admin langsung bisa diisi
// tanpa perubahan kode.
//
// `actorId` selalu null, sama seperti section builder di atas: login memakai satu
// PIN global dan tidak ada pemetaan session -> `users.id`. Pencatat yang sebenarnya
// ada di `surveys.petugasId`, jadi isian tetap punya pelaku.
//
// `KesalahanValidasi` dibiarkan terlempar apa adanya supaya petugas melihat
// `pesan` yang sudah ditulis services — termasuk daftar field wajib yang kosong
// sekaligus, bukan satu per permintaan.

export const listFormulir = createServerFn({ method: "GET" })
    .middleware([authSessionToken])
    .handler(async () => await daftarFormulirTerisi());

export const ambilFormulir = createServerFn({ method: "GET" })
    .middleware([authSessionToken])
    .validator((data: { formVersionId: string }) => data)
    .handler(async ({ data }) => await ambilFormulirUntukIsi(data.formVersionId));

export const simpanFormulir = createServerFn({ method: "POST" })
    .middleware([authSessionToken])
    .validator((data: Omit<SimpanFormulirInput, "actorId">) => data)
    .handler(async ({ data }) => await simpanFormulirRuntime({ ...data, actorId: null }));
