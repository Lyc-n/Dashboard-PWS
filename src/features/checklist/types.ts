import type { KrTemplates } from "@/lib/kr-templates";
import type { SasaranKey } from "@/lib/kr-form";
import type { AnggotaKeluarga, KeluargaInfo, MasalahTindak, PenilaianForm, Sanitasi } from "@/features/checklist/models";

export const CHECKLIST_SCHEMA_VERSION = 17 as const;

// Supabase-ready record — localStorage wrapper now, DB row later
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
}

// Versioned wrapper for localStorage — maps 1:1 to jsonb later
export interface KunjunganStorageWrapper {
  version: typeof CHECKLIST_SCHEMA_VERSION;
  updatedAt: string;
  data: KunjunganRecord[];
}

export interface KrTemplatesMeta extends KrTemplates {
  updatedAt?: string;
  updatedBy?: string;
}

export type ChecklistInvalidMap = Record<string, boolean>;

export function createRecordId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function toStorageWrapper(records: KunjunganRecord[]): KunjunganStorageWrapper {
  return { version: CHECKLIST_SCHEMA_VERSION, updatedAt: new Date().toISOString(), data: records };
}

export function fromStorageWrapper(raw: unknown): KunjunganRecord[] {
  if (!raw || typeof raw !== "object") return [];
  const o = raw as Record<string, unknown>;
  // new wrapper shape
  if (o.version === CHECKLIST_SCHEMA_VERSION && Array.isArray(o.data)) {
    return o.data as KunjunganRecord[];
  }
  // legacy: plain array
  if (Array.isArray(raw)) return raw as KunjunganRecord[];
  // legacy wrapper with checklist key?
  return [];
}

export type StepState = "done" | "now" | "todo";
export type SasaranKeyParam = SasaranKey;
