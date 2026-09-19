import type { AnggotaKeluarga, KeluargaInfo, KunjunganFoto, MasalahTindak, PenilaianForm, Sanitasi } from "@/features/checklist/models";

export const CHECKLIST_SCHEMA_VERSION = 17 as const;

// Record siap-Supabase — sekarang dibungkus localStorage, kelak jadi satu baris di DB
export interface KunjunganRecord {
  id: string;
  schemaVersion: typeof CHECKLIST_SCHEMA_VERSION;
  clientId: string;
  syncedAt: string | null;
  waktuSimpan: string;
  info: KeluargaInfo;
  sanitasi: Sanitasi;
  anggota: AnggotaKeluarga[];
  penilaian: PenilaianForm[];
  masalah: MasalahTindak[];
  hasil: string;
  jadwal: string;
  ttd: string;
  fotos: KunjunganFoto[];
}

// Pembungkus ber-version untuk localStorage — petakan 1:1 ke jsonb kelak
export interface KunjunganStorageWrapper {
  version: typeof CHECKLIST_SCHEMA_VERSION;
  updatedAt: string;
  data: KunjunganRecord[];
}

export function createRecordId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function toStorageWrapper(records: KunjunganRecord[]): KunjunganStorageWrapper {
  return { version: CHECKLIST_SCHEMA_VERSION, updatedAt: new Date().toISOString(), data: records };
}

const SANITASI_DEFAULTS = {
  jkn: false,
  jenisAir: "",
  jambanSaniter: "",
  ventilasi: false,
  odgj: false,
  tbc: false,
  hipertensi: false,
  dm: false,
};

function makeInfo(raw: unknown): KeluargaInfo {
  const base: KeluargaInfo = {
    tglPengumpulan: "",
    alamat: "",
    kelurahan: "",
    kecamatan: "",
    kabKota: "",
    provinsi: "",
    hpKK: "",
    puskesmas: "",
    pustu: "",
    posyandu: "",
    namaKK: "",
  };
  if (!raw || typeof raw !== "object") return base;
  const src = raw as Record<string, unknown>;
  for (const k of Object.keys(src)) {
    if (typeof src[k] === "string") base[k] = src[k];
  }
  return base;
}

function makeSanitasi(raw: unknown): Sanitasi {
  const out: Sanitasi = { ...SANITASI_DEFAULTS };
  if (!raw || typeof raw !== "object") return out;
  const src = raw as Record<string, unknown>;
  for (const k of Object.keys(src)) {
    const v = src[k];
    if (typeof v === "boolean") out[k] = v;
    else if (typeof v === "string") out[k] = v;
  }
  return out;
}

/**
 * Sanitasi satu record dari JSON korup / versi lama.
 * Isi field yang hilang dengan default, buang entri yang tak bisa diselamatkan.
 * Return null bila record tidak layak (id/waktuSimpan/info/array wajib tidak ada).
 */
export function sanitizeRecord(raw: unknown): KunjunganRecord | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.id !== "string" || !o.id) return null;
  if (typeof o.waktuSimpan !== "string" || !o.waktuSimpan) return null;
  if (!o.info || typeof o.info !== "object") return null;

  const pn = Array.isArray(o.penilaian) ? o.penilaian : [];
  const penilaian = pn
    .filter((p): p is Record<string, unknown> => !!p && typeof p === "object")
    .map((p) => ({
      id: typeof p.id === "string" ? p.id : createRecordId(),
      anggotaId: typeof p.anggotaId === "string" ? p.anggotaId : "",
      sasaran: (typeof p.sasaran === "string" ? p.sasaran : "dewasa") as PenilaianForm["sasaran"],
      values: p.values && typeof p.values === "object" ? (p.values as Record<string, string>) : {},
      checks: p.checks && typeof p.checks === "object" ? (p.checks as Record<string, boolean>) : {},
      prioritas: Array.isArray(p.prioritas) ? (p.prioritas as string[]) : [],
    }));

  return {
    id: o.id,
    schemaVersion: CHECKLIST_SCHEMA_VERSION,
    clientId: typeof o.clientId === "string" ? o.clientId : "",
    syncedAt: typeof o.syncedAt === "string" ? o.syncedAt : null,
    waktuSimpan: o.waktuSimpan,
    info: makeInfo(o.info),
    sanitasi: makeSanitasi(o.sanitasi),
    anggota: Array.isArray(o.anggota) ? (o.anggota as AnggotaKeluarga[]) : [],
    penilaian,
    masalah: Array.isArray(o.masalah) ? (o.masalah as MasalahTindak[]) : [],
    hasil: typeof o.hasil === "string" ? o.hasil : "",
    jadwal: typeof o.jadwal === "string" ? o.jadwal : "",
    ttd: typeof o.ttd === "string" ? o.ttd : "",
    fotos: Array.isArray(o.fotos) ? (o.fotos as KunjunganFoto[]) : [],
  };
}

function withFotosFallback(r: KunjunganRecord): KunjunganRecord {
  // record lama (sebelum dokumentasi) tidak punya fotos
  if (Array.isArray(r.fotos)) return r;
  return { ...r, fotos: [] };
}

export function fromStorageWrapper(raw: unknown): KunjunganRecord[] {
  if (!raw || typeof raw !== "object") return [];
  const o = raw as Record<string, unknown>;
  if (typeof o.version === "number" && Array.isArray(o.data)) {
    return (o.data as unknown[]).map(sanitizeRecord).filter((r): r is KunjunganRecord => r !== null);
  }
  // legacy: array polos
  if (Array.isArray(raw)) return (raw as KunjunganRecord[]).map(withFotosFallback);
  // legacy: pembungkus ber-key "checklist"?
  return [];
}

export type StepState = "done" | "now" | "todo";
