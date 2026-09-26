import type { Priority, Staff } from "@/lib/seeds";
import type { KunjunganRumahSection } from "@/lib/kunjungan-rumah-templates";
import type { SasaranKey } from "@/lib/kunjungan-rumah-form";
import type { TagVariant } from "@/lib/utils";

export type DlgKind = "prio" | "staff";

export interface DlgState {
  kind: DlgKind;
  title: string;
  edit?: Priority | Staff;
  form: Record<string, string | undefined>;
  errs: Record<string, string>;
}

export interface FieldDlgState {
  mode: "add" | "edit";
  section: KunjunganRumahSection;
  sasaranKey?: SasaranKey;
  editId?: string;
  form: {
    label: string;
    kind: string;
    required: boolean;
    active: boolean;
    options: string;
    hint: string;
    sasaranSection: string;
  };
  errs: Record<string, string>;
}

export const TABS = [
  { key: "form-kunjungan-rumah", label: "Form Kunjungan Rumah" },
  { key: "prioritas", label: "Prioritas" },
  { key: "staff", label: "Staff" },
] as const;

export type KelolaTab = (typeof TABS)[number]["key"];

export const FORM_SUB_TABS = [
  { key: "keluarga", label: "Keluarga" },
  { key: "anggota", label: "Anggota" },
  { key: "sanitasi", label: "Sanitasi" },
  { key: "sasaran", label: "Sasaran" },
  { key: "masalah", label: "Masalah" },
  { key: "hasil", label: "Hasil" },
] as const;

export type FormSubTab = (typeof FORM_SUB_TABS)[number]["key"];

export const SASARAN_SECTION_OPTS: { value: KunjunganRumahSection; label: string }[] = [
  { value: "sasaran:identitas", label: "Identitas" },
  { value: "sasaran:kolom", label: "Kolom pemantauan" },
  { value: "sasaran:bools", label: "Kondisi / pelayanan" },
  { value: "sasaran:baha", label: "BaHa — tanda bahaya" },
];

export function toVariant(w: string | undefined): TagVariant {
  const v = w?.startsWith("tag-") ? w.slice(4) : w;
  return (["odgj", "bumil", "balita", "tb", "stunt"] as const).includes(v as TagVariant) ? (v as TagVariant) : "odgj";
}

export function kindLabel(k: string): string {
  return ({ text: "Teks", number: "Angka", date: "Tanggal", select: "Pilihan", checkbox: "Checkbox" }[k] ?? k);
}
