/**
 * Pure engine untuk menerapkan autofill.
 * Mendukung penanganan path bersarang (nested key/object) tanpa merusak properti tetangga.
 * Array anggota ditangani sebagai field bertipe group standar.
 */

import type { RuleAutofill, KonteksAutofill, TransformAutofill } from './types'
import { getNestedValue, setNestedValue } from './nested'

function nilaiKosongUntukAutofill(value: unknown): boolean {
  if (value === null || value === undefined) return true
  if (typeof value === 'string') return value.trim() === ''
  if (Array.isArray(value)) return value.length === 0
  return false
}

function ambilDariKonteks(rule: RuleAutofill, ctx: KonteksAutofill): unknown {
  if (rule.sumber === 'warga') {
    if (!ctx.wargaTerpilih) return undefined
    // Coba ambil langsung dari wargaTerpilih
    const langsung = (ctx.wargaTerpilih as Record<string, unknown>)[rule.kolom]
    if (langsung !== undefined) return langsung
    // Coba dengan mapping snake_case/camelCase
    return undefined
  }
  if (rule.sumber === 'anggota') {
    // Ambil dari anggota keluarga (field bertipe group)
    const list = ctx.anggotaKeluarga ?? []
    if (list.length === 0) return undefined
    // Ambil dari item pertama secara default
    // Bisa dikembangkan untuk mengambil berdasarkan kriteria tertentu
    const first = list[0]
    if (!first || typeof first !== 'object') return undefined
    return first[rule.kolom]
  }
  if (rule.sumber === 'riwayat') {
    const list = ctx.riwayat ?? []
    if (list.length === 0) return undefined
    // Ambil dari riwayat terbaru (asumsi urutan desc)
    const latest = list[0]
    if (!latest || typeof latest !== 'object') return undefined
    return latest[rule.kolom]
  }
  return undefined
}

function transformNilai(val: unknown, transform: TransformAutofill): unknown {
  if (val === null || val === undefined) return val
  if (transform === 'teks') {
    if (typeof val === 'string') return val
    if (typeof val === 'number' || typeof val === 'boolean') return String(val)
    return val
  }
  if (transform === 'angka') {
    if (typeof val === 'number') return val
    const n = Number(val)
    return Number.isNaN(n) ? val : n
  }
  if (transform === 'nik') {
    if (typeof val !== 'string') return val
    // pastikan string 16 digit tanpa spasi
    const s = val.replace(/\s+/g, '')
    return s
  }
  if (transform === 'tanggal') {
    if (typeof val === 'string') return val
    if (val instanceof Date) return val.toISOString().slice(0, 10)
    return val
  }
  if (transform === 'opsi') {
    if (typeof val === 'string') return val
    if (typeof val === 'number' || typeof val === 'boolean') return String(val)
    return val
  }
  return val
}

export function terapkanAutofill(params: {
  answers: Record<string, unknown>
  rules: RuleAutofill[]
  konteks: KonteksAutofill
  // field pemicu yang baru berubah (untuk efisiensi)
  triggerFieldId?: string
}): {
  answersBaru: Record<string, unknown>
  changed: boolean
  appliedTargets: string[]
} {
  const { answers, rules, konteks, triggerFieldId } = params
  let changed = false
  let answersBaru: Record<string, unknown> = { ...answers }
  const appliedTargets: string[] = []

  // Hanya proses rule aktif, urutkan biar deterministik
  const daftar = rules
    .filter((r) => r.aktif)
    .filter((r) =>
      triggerFieldId ? r.triggerFieldId === triggerFieldId : true,
    )
    .sort((a, b) => a.urutan - b.urutan)

  for (const rule of daftar) {
    const targetId = rule.targetFieldId
    // Ambil nilai current - bisa nested path
    const current = getNestedValue(answersBaru, targetId)

    // mode isi_kosong: hanya isi kalau kosong
    if (rule.mode === 'isi_kosong') {
      if (!nilaiKosongUntukAutofill(current)) {
        continue
      }
    }
    // mode timpa: selalu coba isi

    const raw = ambilDariKonteks(rule, konteks)
    if (raw === undefined || raw === null) continue
    const val = transformNilai(raw, rule.transform)

    // Cek apakah nilai sama untuk menghindari update tidak perlu
    const currentSetelah = getNestedValue(answersBaru, targetId)
    if (currentSetelah === val) continue

    // Set nilai dengan nested path support, menjaga properti tetangga
    answersBaru = setNestedValue(answersBaru, targetId, val)
    changed = true
    if (!appliedTargets.includes(targetId)) appliedTargets.push(targetId)
  }

  return { answersBaru, changed, appliedTargets }
}
