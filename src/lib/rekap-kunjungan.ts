import type { Staff } from "@/lib/seeds";
import type { SasaranKey } from "@/lib/kr-form";
import type { KrTemplates } from "@/lib/kr-templates";
import type { KunjunganRecord } from "@/features/checklist/types";

// Rekap murni — tanpa efek samping, unit-testable.
// Minggu Ke = minggu dalam bulan (1-5) dari info.tglPengumpulan.

export type SasaranGroupKey =
  | "ibuHamil"
  | "bersalinNifas"
  | "bayiApras"
  | "sekolahRemaja"
  | "produktif"
  | "lansia";

export const SASARAN_GROUP_LABELS: Record<SasaranGroupKey, string> = {
  ibuHamil: "Ibu Hamil",
  bersalinNifas: "Ibu Bersalin-Nifas",
  bayiApras: "Bayi, Balita & APRAS",
  sekolahRemaja: "Usia Sekolah & Remaja",
  produktif: "Usia Produktif",
  lansia: "Usia Lansia",
};

export interface RekapAuto {
  keluarga: number;
  sasaran: Record<SasaranGroupKey, number>;
  masalahIbuTidakAkses: number;
  masalahIbuTandaBahaya: number;
  masalahDewasaTidakAdaPelayanan: number;
  masalahDewasaBergejalaTbc: number;
  masalahDewasaTidakMinumObat: number;
  tindakEdukasi: number;
  tindakLaporNakes: number;
}

export interface RekapRow {
  minggu: number;
  auto: RekapAuto;
}

export interface RekapResult {
  rows: RekapRow[];
}

export interface RekapOptions {
  month?: string; // "YYYY-MM"
  kel?: string | null;
  posy?: string | null;
  kader?: string | null;
  staff?: Staff[];
  ref?: string; // tanggal acuan untuk umur (test)
}

export function emptyRekapAuto(): RekapAuto {
  return {
    keluarga: 0,
    sasaran: {
      ibuHamil: 0,
      bersalinNifas: 0,
      bayiApras: 0,
      sekolahRemaja: 0,
      produktif: 0,
      lansia: 0,
    },
    masalahIbuTidakAkses: 0,
    masalahIbuTandaBahaya: 0,
    masalahDewasaTidakAdaPelayanan: 0,
    masalahDewasaBergejalaTbc: 0,
    masalahDewasaTidakMinumObat: 0,
    tindakEdukasi: 0,
    tindakLaporNakes: 0,
  };
}

export function mingguKe(tgl: string): number {
  const day = Number(tgl.slice(8, 10));
  if (!day) return 0;
  return Math.min(5, Math.ceil(day / 7));
}

export function rekapScopeId(kel?: string | null, posy?: string | null, kader?: string | null): string {
  const parts = [kel || "", posy || "", kader || ""];
  if (parts.every((p) => p === "")) return "all";
  return parts.join("|");
}

/** Umur pada tanggal acuan. null bila tanggal lahir tidak valid. */
export function ageOn(tglLahir: string, ref: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(tglLahir)) return null;
  const [by, bm, bd] = tglLahir.split("-").map(Number);
  const [ry, rm, rd] = ref.split("-").map(Number);
  if (!by || !bm || !bd || !ry || !rm || !rd) return null;
  let age = ry - by;
  if (rm < bm || (rm === bm && rd < bd)) age -= 1;
  return age;
}

const IBU_PELAYANAN_KEYS = ["k1Tanggal", "k2Tanggal", "k3Tanggal", "k4Tanggal", "k5Tanggal", "k6Tanggal", "kelasIbuTanggal", "skriningJiwaTanggal"];
const NIFAS_PELAYANAN_KEYS = ["kunjunganTgl", "kf1Tanggal", "kf2Tanggal", "kf3Tanggal", "kf4Tanggal", "vitATanggal"];
const BAYI_PELAYANAN_KEYS = ["tglTimbang", "kn0Tanggal", "kn1Tanggal", "kn2Tanggal", "kn3Tanggal", "obatCacingTanggal"];
const REMAJA_PELAYANAN_KEYS = ["tglTimbang", "anemiaTanggal", "skriningJiwaTanggal"];
const DEWASA_PELAYANAN_KEYS = ["tdDiagnosaTgl", "tdPeriksaSetahunTanggal", "gdDiagnosaTgl", "gdPeriksaSetahunTanggal", "gdPeriksaSebulanTanggal", "skriningJiwaTanggal"];
const LANSIA_PELAYANAN_KEYS = [...DEWASA_PELAYANAN_KEYS, "aksTanggal", "skilasTanggal"];

const TBC_BAHA_KEYS = ["batukTerus", "demam", "bbTurun"];

/** tanggal pelayanan khas sasaran berdasarkan jenis sasaran */
function pelayananKeysOf(sasaran: SasaranKey): string[] | null {
  switch (sasaran) {
    case "ibu-hamil":
      return IBU_PELAYANAN_KEYS;
    case "bersalin-nifas":
      return NIFAS_PELAYANAN_KEYS;
    case "bayi":
    case "balita":
      return BAYI_PELAYANAN_KEYS;
    case "remaja":
      return REMAJA_PELAYANAN_KEYS;
    case "dewasa":
      return DEWASA_PELAYANAN_KEYS;
    case "lansia":
      return LANSIA_PELAYANAN_KEYS;
    default:
      return null;
  }
}

function hasAnyValue(values: Record<string, string>, keys: string[]): boolean {
  return keys.some((k) => Boolean((values[k] ?? "").trim()));
}

function anyTrue(checks: Record<string, boolean>, keys: string[]): boolean {
  return keys.some((k) => Boolean(checks[k]));
}

export function isIbuGroup(g: SasaranGroupKey): boolean {
  return g === "ibuHamil" || g === "bersalinNifas" || g === "bayiApras";
}

export function isDewasaGroup(g: SasaranGroupKey): boolean {
  return g === "sekolahRemaja" || g === "produktif" || g === "lansia";
}

/** Sasaran dikunjungi → kelompok umur. tbc dikelompokkan lewat umur anggota. */
export function sasaranGroup(p: { sasaran: SasaranKey }, anggotaByAge?: number | null): SasaranGroupKey {
  switch (p.sasaran) {
    case "ibu-hamil":
      return "ibuHamil";
    case "bersalin-nifas":
      return "bersalinNifas";
    case "bayi":
    case "balita":
      return "bayiApras";
    case "remaja":
      return "sekolahRemaja";
    case "dewasa":
      return "produktif";
    case "lansia":
      return "lansia";
    case "tbc": {
      const age = anggotaByAge ?? null;
      if (age !== null && age < 6) return "bayiApras";
      if (age !== null && age <= 18) return "sekolahRemaja";
      if (age !== null && age <= 59) return "produktif";
      if (age !== null && age >= 60) return "lansia";
      return "produktif";
    }
    default:
      return "produktif";
  }
}

function anggotaAge(record: KunjunganRecord, anggotaId: string, ref: string): number | null {
  const a = record.anggota.find((x) => x.id === anggotaId);
  if (!a) return null;
  return ageOn(a.tglLahir, ref);
}

/** Nama kader pemilik record: cocokkan tanda tangan dulu, fallback wilayah. */
export function kaderNameOf(record: KunjunganRecord, staff: Staff[]): string | undefined {
  const byTtd = staff.find((s) => s.nama === record.ttd);
  if (byTtd) return byTtd.nama;
  const byWilayah = staff.find(
    (s) => s.posy && s.posy !== "—" && s.posy === record.info.posyandu && s.kel === record.info.kelurahan,
  );
  return byWilayah?.nama;
}

export function computeRekap(
  records: KunjunganRecord[],
  templates?: KrTemplates,
  opts: RekapOptions = {},
): RekapResult {
  const { month, kel, posy, kader, staff = [], ref = new Date().toISOString().slice(0, 10) } = opts;

  const bahaKeysOf = (sasaran: SasaranKey): string[] => {
    if (templates) {
      const loaded = templates.sasaran[sasaran].fields
        .filter((f) => f.section === "sasaran:baha" && f.active)
        .map((f) => f.id);
      if (loaded.length > 0) return loaded;
    }
    if (sasaran === "tbc") return TBC_BAHA_KEYS;
    return [];
  };

  const rows = new Map<number, RekapAuto>();
  const seenKeluarga = new Map<number, Set<string>>();

  for (const record of records) {
    if (!record.info.tglPengumpulan) continue;
    const tgl = record.info.tglPengumpulan;
    if (month && !tgl.startsWith(month)) continue;
    if (kel && record.info.kelurahan !== kel) continue;
    if (posy && record.info.posyandu !== posy) continue;
    if (kader && kaderNameOf(record, staff) !== kader) continue;

    const week = mingguKe(tgl);
    if (!week) continue;
    if (!rows.has(week)) rows.set(week, emptyRekapAuto());
    if (!seenKeluarga.has(week)) seenKeluarga.set(week, new Set());
    const agg = rows.get(week)!;
    const fam = seenKeluarga.get(week)!;

    if (!fam.has(record.id)) {
      fam.add(record.id);
      agg.keluarga += 1;
    }

    const hasFamilyTbc = Boolean(record.sanitasi.tbc);

    for (const p of record.penilaian) {
      const g = sasaranGroup(p, anggotaAge(record, p.anggotaId, ref));
      agg.sasaran[g] += 1;

      const pelayanan = pelayananKeysOf(p.sasaran);
      if (isIbuGroup(g)) {
        const baha = bahaKeysOf(p.sasaran);
        if (anyTrue(p.checks, baha)) agg.masalahIbuTandaBahaya += 1;
        if (pelayanan && !hasAnyValue(p.values, pelayanan)) agg.masalahIbuTidakAkses += 1;
      } else if (isDewasaGroup(g)) {
        if (pelayanan && !hasAnyValue(p.values, pelayanan)) agg.masalahDewasaTidakAdaPelayanan += 1;
        if (hasFamilyTbc || (p.sasaran === "tbc" && anyTrue(p.checks, bahaKeysOf("tbc")))) {
          agg.masalahDewasaBergejalaTbc += 1;
        }
        const obatAda =
          (p.checks.tdAdaObat && !p.checks.tdMinum24) ||
          (p.checks.gdAdaObat && !p.checks.gdMinum24) ||
          (p.sasaran === "tbc" && p.checks.adaObat && !p.checks.minum24);
        if (obatAda) agg.masalahDewasaTidakMinumObat += 1;
      }

      if ((p.values.edukasiNakesTanggal ?? "").trim() || (p.values.edukasiNakesMateri ?? "").trim()) {
        agg.tindakEdukasi += 1;
      }
      if ((p.values.laporNakesTanggal ?? "").trim()) {
        agg.tindakLaporNakes += 1;
      }
    }
  }

  return {
    rows: [...rows.entries()]
      .map(([minggu, auto]) => ({ minggu, auto }))
      .sort((a, b) => a.minggu - b.minggu),
  };
}