import { HASIL_KUNJUNGAN } from "@/lib/constants";
import { SASARAN_DEFS  } from "@/lib/kr-form";
import type {SasaranKey} from "@/lib/kr-form";

// ── Types ──
export type KrFieldKind = "text" | "number" | "date" | "select" | "checkbox";
export type KrSection =
  | "keluargaInfo"
  | "anggota"
  | "sanitasi"
  | "sasaran:identitas"
  | "sasaran:kolom"
  | "sasaran:bools"
  | "sasaran:baha"
  | "masalah"
  | "hasil";

export interface KrTemplateField {
  id: string;
  label: string;
  kind: KrFieldKind;
  section: KrSection;
  sasaranKey?: SasaranKey;
  required: boolean;
  active: boolean;
  order: number;
  options?: string[];
  hint?: string;
}

export interface KrSasaranTemplate {
  label: string;
  fields: KrTemplateField[];
  prioritasDefault: string[];
}

export interface KrTemplates {
  version: 17;
  keluargaInfo: KrTemplateField[];
  anggota: KrTemplateField[];
  sanitasi: KrTemplateField[];
  sasaran: Record<SasaranKey, KrSasaranTemplate>;
  masalah: KrTemplateField[];
  hasilOpsi: string[];
}

// ── helpers ──
export function slugify(label: string): string {
  return label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40) || "field";
}

function uniqueId(base: string, existing: Set<string>): string {
  let id = base;
  let n = 2;
  while (existing.has(id)) {
    id = `${base}-${n++}`;
  }
  existing.add(id);
  return id;
}

// ── Seed ──
export function seedKrTemplates(): KrTemplates {
  // KeluargaInfo 11 fields
  const keluargaDefs: { id: string; label: string; kind: KrFieldKind; required: boolean }[] = [
    { id: "tglPengumpulan", label: "Tanggal pengumpulan data", kind: "date", required: true },
    { id: "posyandu", label: "Posyandu", kind: "text", required: true },
    { id: "kelurahan", label: "Desa/Kelurahan", kind: "text", required: false },
    { id: "kecamatan", label: "Kecamatan", kind: "text", required: false },
    { id: "puskesmas", label: "Puskesmas", kind: "text", required: false },
    { id: "pustu", label: "Pustu / posyandu prima", kind: "text", required: false },
    { id: "namaKK", label: "Nama kepala keluarga", kind: "text", required: false },
    { id: "alamat", label: "Alamat", kind: "text", required: false },
    { id: "hpKK", label: "No. HP KK/anggota", kind: "text", required: false },
    { id: "kabKota", label: "Kabupaten/Kota", kind: "text", required: false },
    { id: "provinsi", label: "Provinsi", kind: "text", required: false },
  ];
  const keluargaInfo: KrTemplateField[] = keluargaDefs.map((d, i) => ({
    id: d.id,
    label: d.label,
    kind: d.kind,
    section: "keluargaInfo",
    required: d.required,
    active: true,
    order: i,
  }));

  const anggotaDefs: { id: string; label: string; kind: KrFieldKind; required: boolean; options?: string[]; hint?: string }[] = [
    { id: "nama", label: "Nama lengkap", kind: "text", required: true },
    { id: "nik", label: "NIK", kind: "text", required: true, hint: "16 digit, tanpa spasi." },
    { id: "tglLahir", label: "Tanggal lahir", kind: "date", required: true },
    { id: "jk", label: "Jenis kelamin", kind: "select", required: false, options: ["L", "P"] },
    { id: "hubKK", label: "Hubungan dengan KK", kind: "select", required: false, options: ["Kepala Keluarga","Istri","Anak","Menantu","Cucu","Orang tua","Mertua","Famili lain","Lainnya"] },
    { id: "statusKawin", label: "Status perkawinan", kind: "select", required: false, options: ["Kawin","Belum kawin","Cerai hidup","Cerai mati"] },
    { id: "pendidikan", label: "Pendidikan terakhir", kind: "select", required: false, options: ["Tidak sekolah","SD","SMP","SMA","D1/D3","S1","S2/S3"] },
    { id: "pekerjaan", label: "Pekerjaan", kind: "select", required: false, options: ["Petani","Buruh","Nelayan","PNS","Pedagang","Swasta","IRT","Pelajar/Mahasiswa","Tidak bekerja","Lainnya"] },
  ];
  const anggota: KrTemplateField[] = anggotaDefs.map((d, i) => ({
    id: d.id,
    label: d.label,
    kind: d.kind,
    section: "anggota",
    required: d.required,
    active: true,
    order: i,
    options: d.options,
    hint: d.hint,
  }));

  const sanitasiDefs: { id: string; label: string; kind: KrFieldKind; options?: string[] }[] = [
    { id: "jkn", label: "Jaminan kesehatan (JKN/JamKesDa)", kind: "checkbox" },
    { id: "airBersih", label: "Sarana air bersih", kind: "checkbox" },
    { id: "jamban", label: "Jamban keluarga", kind: "checkbox" },
    { id: "jambanSaniter", label: "Jenis jamban", kind: "select", options: ["Kloset","Leher angsa","Plengseran"] },
    { id: "ventilasi", label: "Ventilasi cukup", kind: "checkbox" },
    { id: "odgj", label: "Anggota dgn gangguan jiwa (ODGJ)", kind: "checkbox" },
    { id: "tbc", label: "Anggota terdiagnosa TBC", kind: "checkbox" },
    { id: "hipertensi", label: "Anggota terdiagnosa hipertensi", kind: "checkbox" },
    { id: "dm", label: "Anggota terdiagnosa DM", kind: "checkbox" },
    { id: "jenisAir", label: "Jenis air bersih", kind: "select", options: ["Sumur terlindung","Ledeng/PDAM","Sumur pompa","Mata air","Tidak terlindung","Lainnya"] },
    { id: "jenisSumberAir", label: "Jenis sumber air", kind: "select", options: ["Sumur terbuka","Air sungai","Danau / telaga"] },
  ];
  const sanitasi: KrTemplateField[] = sanitasiDefs.map((d, i) => ({
    id: d.id,
    label: d.label,
    kind: d.kind,
    section: "sanitasi",
    required: false,
    active: true,
    order: i,
    options: d.options,
  }));

  const masalahDefs: { id: string; label: string; kind: KrFieldKind }[] = [
    { id: "nama", label: "Nama", kind: "text" },
    { id: "nik", label: "NIK", kind: "text" },
    { id: "tglLahir", label: "Tanggal lahir", kind: "date" },
    { id: "alamat", label: "Alamat", kind: "text" },
    { id: "telepon", label: "No. telepon", kind: "text" },
    { id: "masalah", label: "Masalah kesehatan ditemukan", kind: "text" },
    { id: "tindakLanjut", label: "Tindak lanjut", kind: "text" },
  ];
  const masalah: KrTemplateField[] = masalahDefs.map((d, i) => ({
    id: d.id,
    label: d.label,
    kind: d.kind,
    section: "masalah",
    required: false,
    active: true,
    order: i,
  }));

  const sasaran = {} as Record<SasaranKey, KrSasaranTemplate>;
  for (const def of SASARAN_DEFS) {
    const fields: KrTemplateField[] = [];
    let order = 0;
    for (const f of def.identitas) {
      fields.push({
        id: f.key,
        label: f.label,
        kind: f.kind,
        section: "sasaran:identitas",
        sasaranKey: def.key,
        required: false,
        active: true,
        order: order++,
        options: f.options,
      });
    }
    for (const f of def.kolom) {
      fields.push({
        id: f.key,
        label: f.label,
        kind: f.kind,
        section: "sasaran:kolom",
        sasaranKey: def.key,
        required: false,
        active: true,
        order: order++,
        options: f.options,
      });
    }
    for (const b of def.bools) {
      fields.push({
        id: b.key,
        label: b.label,
        kind: "checkbox",
        section: "sasaran:bools",
        sasaranKey: def.key,
        required: false,
        active: true,
        order: order++,
      });
    }
    for (const b of def.baha) {
      fields.push({
        id: b.key,
        label: b.label,
        kind: "checkbox",
        section: "sasaran:baha",
        sasaranKey: def.key,
        required: false,
        active: true,
        order: order++,
      });
    }
    sasaran[def.key] = {
      label: def.label,
      fields,
      prioritasDefault: [...def.prioritasDefault],
    };
  }

  return {
    version: 17,
    keluargaInfo,
    anggota,
    sanitasi,
    sasaran,
    masalah,
    hasilOpsi: [...HASIL_KUNJUNGAN],
  };
}

export function validateKrTemplates(obj: unknown): obj is KrTemplates {
  if (!obj || typeof obj !== "object") return false;
  const o = obj as Record<string, unknown>;
  if (o.version !== 17) return false;
  if (!Array.isArray(o.keluargaInfo) || !Array.isArray(o.anggota) || !Array.isArray(o.sanitasi) || !Array.isArray(o.masalah)) return false;
  if (typeof o.sasaran !== "object" || o.sasaran === null) return false;
  if (!Array.isArray(o.hasilOpsi)) return false;
  return true;
}

export function getNextOrder(fields: KrTemplateField[]): number {
  if (fields.length === 0) return 0;
  return Math.max(...fields.map((f) => f.order)) + 1;
}

export function createFieldId(label: string, existing: KrTemplateField[]): string {
  const base = slugify(label);
  const set = new Set(existing.map((f) => f.id));
  return uniqueId(base, set);
}
