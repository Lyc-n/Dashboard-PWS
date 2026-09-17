import { sasaranDef } from '@/lib/kr-form'
import type { KrTemplates } from '@/lib/kr-templates'
import type {
  AnggotaKeluarga,
  KeluargaInfo,
  MasalahTindak,
  PenilaianForm,
} from '@/hooks/use-kunjungan'
import { buildConditionalMap, isConditionalActive } from './conditional'

export interface ValidateInput {
  info: KeluargaInfo
  anggota: AnggotaKeluarga[]
  penilaian: PenilaianForm[]
  masalah: MasalahTindak[]
  hasil: string
  jadwal: string
  ttd: string
  templates: KrTemplates
}

export function validateKunjungan(input: ValidateInput): {
  ok: boolean
  invalid: Record<string, boolean>
} {
  const { info, anggota, penilaian, masalah, hasil, jadwal, ttd, templates } =
    input
  const nextInvalid: Record<string, boolean> = {}
  let ok = true

  for (const f of templates.keluargaInfo.filter(
    (x) => x.active && x.required,
  )) {
    const v = (info as Record<string, string>)[f.id] ?? ''
    if (!String(v).trim()) {
      nextInvalid[f.id] = true
      if (f.id === 'tglPengumpulan') nextInvalid.tgl = true
      if (f.id === 'posyandu') nextInvalid.posyandu = true
      ok = false
    }
  }
  if (!info.tglPengumpulan) {
    if (!nextInvalid.tgl) {
      nextInvalid.tgl = true
      ok = false
    }
  }
  if (!info.posyandu.trim()) {
    if (!nextInvalid.posyandu) {
      nextInvalid.posyandu = true
      ok = false
    }
  }

  if (anggota.length === 0) {
    nextInvalid.anggota = true
    ok = false
  }

  const seen = new Set<string>()
  for (const m of anggota) {
    const rec = m as unknown as Record<string, string>
    for (const f of templates.anggota.filter((x) => x.active && x.required)) {
      const v = rec[f.id] ?? ''
      if (!String(v).trim()) {
        nextInvalid[`${f.id}:${m.id}`] = true
        ok = false
      }
      if (f.id === 'nik') {
        if (!/^\d{16}$/.test(rec.nik || '')) {
          nextInvalid[`nik:${m.id}`] = true
          ok = false
        } else if (seen.has(rec.nik)) {
          nextInvalid[`nik:${m.id}`] = true
          ok = false
        }
      }
    }
    const hasNikRequired = templates.anggota.some(
      (f) => f.id === 'nik' && f.required && f.active,
    )
    if (!hasNikRequired) {
      if (!/^\d{16}$/.test(m.nik || '')) {
        nextInvalid[`nik:${m.id}`] = true
        ok = false
      } else if (seen.has(m.nik)) {
        nextInvalid[`nik:${m.id}`] = true
        ok = false
      }
    }
    if (m.nik) {
      if (!seen.has(m.nik)) seen.add(m.nik)
      else {
        /* already flagged */
      }
    } else {
      // still track empty to avoid false duplicate
    }
    if (!m.nama.trim()) {
      const hasNamaReq = templates.anggota.some(
        (f) => f.id === 'nama' && f.required && f.active,
      )
      if (!hasNamaReq) {
        nextInvalid[`nama:${m.id}`] = true
        ok = false
      }
    }
    if (!m.tglLahir) {
      const hasReq = templates.anggota.some(
        (f) => f.id === 'tglLahir' && f.required && f.active,
      )
      if (!hasReq) {
        nextInvalid[`tglLahir:${m.id}`] = true
        ok = false
      }
    }
  }

  if (penilaian.length === 0) {
    nextInvalid.penilaian = true
    ok = false
  } else {
    for (const p of penilaian) {
      const def = sasaranDef(p.sasaran)
      const ruleMap = buildConditionalMap(def.conditionals ?? [])
      const fields = templates.sasaran[p.sasaran].fields.filter(
        (f) => f.active && f.required,
      )
      for (const f of fields) {
        const r = ruleMap.get(f.id)
        if (r) {
          const active = isConditionalActive(r, p.values, p.checks)
          if (!active) continue
        }
        if (f.kind === 'checkbox') {
          if (!p.checks[f.id]) {
            nextInvalid[`${p.id}:${f.id}`] = true
            ok = false
          }
        } else {
          const v = p.values[f.id] ?? ''
          if (!String(v).trim()) {
            nextInvalid[`${p.id}:${f.id}`] = true
            ok = false
          }
        }
      }
    }
  }

  if (
    templates.masalah.some((f) => f.active && f.required) &&
    masalah.length === 0
  ) {
    nextInvalid.masalahRequired = true
    ok = false
  }
  for (const mm of masalah) {
    const rec = mm as unknown as Record<string, string>
    for (const f of templates.masalah.filter((x) => x.active && x.required)) {
      if (!String(rec[f.id] ?? '').trim()) {
        nextInvalid[`masalah:${mm.id}:${f.id}`] = true
        ok = false
      }
    }
  }

  const hasilOpsi = templates.hasilOpsi
  if (hasilOpsi.length > 0 && !hasilOpsi.includes(hasil)) {
    nextInvalid.hasil = true
    ok = false
  }
  if (hasil === hasilOpsi[1] && !jadwal) {
    nextInvalid.jadwal = true
    ok = false
  }
  if (!ttd.trim()) {
    nextInvalid.ttd = true
    ok = false
  }

  return { ok, invalid: nextInvalid }
}
