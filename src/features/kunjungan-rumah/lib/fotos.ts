import type { KunjunganRumahFoto } from '@/features/kunjungan-rumah/models'
import { createRecordId } from '@/features/kunjungan-rumah/types'
import { BLOCKED_MIME, MAX_FILE_BYTES, MAX_FOTO } from '@/lib/constants'

/** Total budget pengaman ukuran payload (DB jsonb longgar, tapi tetap batasi upload). */
export const MAX_TOTAL_BYTES = Math.floor(12 * 1024 * 1024)
const MAX_DIM = 1280

export interface PrepareResult {
  added: KunjunganRumahFoto[]
  skipped: number
}

function isBlockedImage(file: File): boolean {
  const mime = file.type.toLowerCase()
  if (BLOCKED_MIME.has(mime)) return true
  return file.name.toLowerCase().endsWith('.svg')
}

function mimeOf(file: File): string {
  if (isBlockedImage(file)) return ''
  return file.type.startsWith('image/') ? file.type : ''
}

/**
 * Potongan bytes per pemanggilan. 32 KB dijauhkan dari batas argumen fungsi
 * (~124 KB di V8) dengan jarak yang lega, dan sekaligus menjaga biner tetap
 * tumbuh per 32 KB.
 */
const UKURAN_POTONGAN = 0x8000

/**
 * Uint8Array -> base64, tanpa pernah melebihi batas argumen fungsi.
 *
 * Kenapa tidak `String.fromCharCode(...bytes)` langsung: spread itu menjadikan
 * setiap byte sebuah argumen fungsi, dan browser melempar `RangeError: too many
 * function arguments` pada file di atas ~124 KB. Foto dari kamera HP dan
 * screenshot berada di ukuran itu atau lebih besar, jadi bentuk satu baris itu
 * gagal untuk sebagian besar foto yang cadre benar-benar potret.
 *
 * Isi dipecah jadi beberapa potongan, jadi jumlah argumen per pemanggilan
 * selalu dibatasi `UKURAN_POTONGAN` berapa pun ukuran file.
 */
function bytesKeBase64(bytes: Uint8Array): string {
  let biner = ''
  for (let i = 0; i < bytes.length; i += UKURAN_POTONGAN) {
    biner += String.fromCharCode(...bytes.subarray(i, i + UKURAN_POTONGAN))
  }
  return btoa(biner)
}

/**
 * File -> dataUrl base64. Pakai arrayBuffer agar jalan di browser & node (test).
 *
 * Cabang `Buffer` itu bukan pilihan gaya: Node punya global `Buffer`, browser
 * tidak, dan Vite tidak meng-polyfill-nya untuk kode klien. Jadi di browser
 * yang jalan adalah cabang `btoa` -- dan di situlah batas argumennya menggigit.
 */
export async function fileToDataUrl(file: File): Promise<string> {
  const buf = await file.arrayBuffer()
  const base64 =
    typeof Buffer !== 'undefined'
      ? Buffer.from(buf).toString('base64')
      : bytesKeBase64(new Uint8Array(buf))
  return `data:${file.type || 'image/jpeg'};base64,${base64}`
}

function dataUrlBytes(dataUrl: string | undefined): number {
  if (!dataUrl) return 0
  const comma = dataUrl.indexOf(',')
  const b64 = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl
  return Math.floor((b64.length * 3) / 4)
}

/** Kompres via canvas (browser saja). Di luar browser kembalikan asli. */
export function compressDataUrl(dataUrl: string): Promise<string> {
  if (typeof document === 'undefined' || typeof Image === 'undefined') {
    return Promise.resolve(dataUrl)
  }
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      try {
        const scale = Math.min(1, MAX_DIM / Math.max(img.width, img.height))
        const w = Math.max(1, Math.round(img.width * scale))
        const h = Math.max(1, Math.round(img.height * scale))
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve(dataUrl)
          return
        }
        ctx.drawImage(img, 0, 0, w, h)
        const out = canvas.toDataURL('image/jpeg', 0.7)
        resolve(out.length < dataUrl.length ? out : dataUrl)
      } catch {
        resolve(dataUrl)
      }
    }
    img.onerror = () => resolve(dataUrl)
    img.src = dataUrl
  })
}

/**
 * Siapkan foto baru dari FileList: filter tipe/ukuran, kompres,
 * hormati batas jumlah & total byte. Murni async, tanpa state.
 *
 * Satu file yang gagal TIDAK boleh menghentikan file lain. `try/catch` di
 * dalam loop itu wajib: tanpa itu, satu `RangeError` dari file kedua
 * membuat seluruh promise menolak, pemanggil tidak pernah sampai
 * `dispatch(ADD_FOTOS)`, dan foto pertama yang sudah berhasil hilang
 * bersama -- User melihat "tidak ada foto masuk" padahal ada yang sempat
 * diproses. Itu persis gejala yang dilaporkan.
 *
 * Kegagalan jadi `skipped`, bukan exception: pemanggil sudah punya jalur
 * untuk menampilkan berapa berkas yang dilewati beserta alasannya.
 */
export async function prepareFotos(
  existing: KunjunganRumahFoto[],
  files: File[],
): Promise<PrepareResult> {
  const added: KunjunganRumahFoto[] = []
  let skipped = 0
  let total = existing.reduce((acc, f) => acc + dataUrlBytes(f.dataUrl), 0)

  for (const file of files) {
    if (existing.length + added.length >= MAX_FOTO) {
      skipped++
      continue
    }
    if (!mimeOf(file) || file.size > MAX_FILE_BYTES || file.size <= 0) {
      skipped++
      continue
    }

    let dataUrl: string
    try {
      const raw = await fileToDataUrl(file)
      dataUrl = await compressDataUrl(raw)
    } catch {
      skipped++
      continue
    }

    if (total + dataUrlBytes(dataUrl) > MAX_TOTAL_BYTES) {
      skipped++
      continue
    }
    total += dataUrlBytes(dataUrl)
    added.push({
      id: createRecordId(),
      name: file.name,
      dataUrl,
      caption: '',
      takenAt: new Date().toISOString(),
    })
  }
  return { added, skipped }
}
