import { db } from '@/lib/db.server'
import { auditLogs } from '@/lib/schema/schema'
import { maskNik } from './masking'

/**
 * Penulis jejak audit.
 *
 * Tabel `audit_logs` punya tujuan berbeda dari log aplikasi: log aplikasi boleh
 * dirotasi, tabel ini tidak. Yang dicatat di sini hanya aktivitas yang bisa
 * berakibat pada data warga: melihat, mengubah, menghapus, dan menerbitkan
 * definisi form.
 *
 * Semua NIK yang masuk ke sini WAJIB sudah dimasking — panggil `maskNik` dulu.
 * `sebelum` dan `sesudah` juga tidak boleh berisi nilai mentah dari kolom
 * sensitif, karena kedua kolom itu ikut tersalin ke backup.
 */
export type AksiAudit = 'create' | 'read' | 'update' | 'delete' | 'publish' | 'login' | 'logout'

export interface CatatanAudit {
  userId?: string | null
  aksi: AksiAudit
  entitas: string
  entitasId?: string | null
  /** NIK mentah; otomatis dimasking sebelum disimpan. */
  nik?: string | null
  sebelum?: unknown
  sesudah?: unknown
  ip?: string | null
}

/** Kolom yang tidak boleh ikut tersalin apa adanya ke jejak audit. */
const KOLOM_SENSITIF = new Set(['nik', 'pinHash', 'token', 'value', 'payload'])

function bersihkan(nilai: unknown): unknown {
  if (nilai === null || nilai === undefined) return null
  if (Array.isArray(nilai)) return nilai.map(bersihkan)
  if (typeof nilai !== 'object') return nilai

  const keluar: Record<string, unknown> = {}
  for (const [kunci, isi] of Object.entries(nilai as Record<string, unknown>)) {
    if (KOLOM_SENSITIF.has(kunci)) {
      keluar[kunci] =
        kunci === 'nik' && typeof isi === 'string'
          ? maskNik(isi)
          : '[disembunyikan]'
      continue
    }
    keluar[kunci] = bersihkan(isi)
  }
  return keluar
}

/**
 * Tulis satu baris audit. Sengaja tidak dibungkus transaksi pemanggil: audit
 * harus tetap tercatat meski transaksi bisnisnya dibatalkan, dan `void` di sini
 * membuat kegagalan audit tidak menggagalkan operasi yang sudah sah.
 */
export async function catatAudit(catatan: CatatanAudit): Promise<void> {
  try {
    await db.insert(auditLogs).values({
      userId: catatan.userId ?? null,
      aksi: catatan.aksi,
      entitas: catatan.entitas,
      entitasId: catatan.entitasId ?? null,
      nikMasked: catatan.nik ? maskNik(catatan.nik) : null,
      sebelum: bersihkan(catatan.sebelum),
      sesudah: bersihkan(catatan.sesudah),
      ip: catatan.ip ?? null,
    })
  } catch (err) {
    // Jangan lempar ke pemanggil. Kehilangan satu jejak audit lebih ringan
    // daripada membatalkan penyimpanan data warga, tapi tetap harus terlihat di
    // log aplikasi supaya ketahuan kalau audit sedang bermasalah.
    console.error('[audit] gagal menulis jejak audit', {
      entitas: catatan.entitas,
      entitasId: catatan.entitasId,
      aksi: catatan.aksi,
      pesan: err instanceof Error ? err.message : String(err),
    })
  }
}
