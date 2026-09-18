import type { KrTemplates } from "@/lib/kr-templates";
import type { AnggotaKeluarga, KeluargaInfo, KunjunganFoto, MasalahTindak, PenilaianForm } from "@/features/checklist/models";
import { sasaranDef } from "@/lib/kr-form";

export function computeFillPercent(args: {
  info: KeluargaInfo;
  anggota: AnggotaKeluarga[];
  penilaian: PenilaianForm[];
  masalah: MasalahTindak[];
  hasil: string;
  ttd: string;
  fotos: KunjunganFoto[];
  templates: KrTemplates;
}): number {
  const { info, anggota, penilaian, masalah, hasil, ttd, fotos, templates } = args;
  const reqKeluarga = templates.keluargaInfo.filter((f) => f.active && f.required);
  const reqAnggota = templates.anggota.filter((f) => f.active && f.required);
  const reqMasalah = templates.masalah.filter((f) => f.active && f.required);

  let totalReq = reqKeluarga.length + 3; // hasil + ttd + dokumentasi
  let filledReq = 0;

  for (const f of reqKeluarga) {
    const v = info[f.id] ?? "";
    if (String(v).trim()) filledReq++;
  }

  // per-anggota: each required field per each anggota counts
  if (reqAnggota.length > 0) {
    if (anggota.length > 0) {
      totalReq += reqAnggota.length * anggota.length;
      for (const m of anggota) {
        for (const f of reqAnggota) if (String(m[f.id] ?? "").trim()) filledReq++;
      }
    } else {
      totalReq += reqAnggota.length;
    }
  }

  for (const p of penilaian) {
    const tpls = templates.sasaran[p.sasaran].fields.filter((f) => f.active && f.required);
    totalReq += tpls.length;
    for (const f of tpls) {
      if (f.kind === "checkbox") { if (p.checks[f.id]) filledReq++; }
      else { const v = p.values[f.id] ?? ""; if (String(v).trim()) filledReq++; }
    }
  }
  if (penilaian.length === 0) totalReq += 1;

  if (reqMasalah.length > 0) {
    if (masalah.length > 0) {
      totalReq += reqMasalah.length * masalah.length;
      for (const mm of masalah) {
        for (const f of reqMasalah) if (String(mm[f.id] ?? "").trim()) filledReq++;
      }
    } else {
      totalReq += reqMasalah.length;
    }
  }

  if (hasil.trim()) filledReq++;
  if (ttd.trim()) filledReq++;
  if (fotos.length > 0) filledReq++;

  if (totalReq === 0) return 100;
  return Math.max(0, Math.min(100, Math.round((filledReq / totalReq) * 100)));
}

export function computeBahaCount(penilaian: PenilaianForm[]): number {
  return penilaian.reduce((acc, n) => {
    const def = sasaranDef(n.sasaran);
    const bahaKeys = new Set(def.baha.map((b) => b.key));
    return acc + Object.entries(n.checks).filter(([k, v]) => v && bahaKeys.has(k)).length;
  }, 0);
}

export function computeStepState(args: {
  anggota: AnggotaKeluarga[];
  penilaian: PenilaianForm[];
  ttd: string;
}): ("done" | "now" | "todo")[] {
  const n = args.ttd.trim() ? 3 : args.penilaian.length > 0 ? 2 : args.anggota.length > 0 ? 1 : 0;
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion -- map narrows to union
  return ([0, 1, 2] as const).map((s) => (s < n ? "done" : s === n ? "now" : "todo") as "done" | "now" | "todo");
}
