import type { KunjunganRumahSection } from "@/lib/kunjungan-rumah-templates";
import type { SasaranKey } from "@/lib/kunjungan-rumah-form";

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

// Tab "Prioritas" dihapus. Prioritas dan item kegiatan sekarang hanya hidup di
// `PRIOS`/`JENIS_KEGIATAN` pada `src/lib/constants.ts` dan dibaca langsung oleh
// FormKunjunganRumahSection + SasaranForm, jadi tabel `admin_priorities`/
// `admin_items` beserta UI-nya tidak pernah jadi sumber kebenaran.
// "form-builder" hanya untuk form manual (`forms.kode is null`). Form bawaan punya
// kode stabil dan tetap disunting lewat tab "form-kunjungan-rumah", supaya dua
// editor tidak pernah berebut menulis form yang sama.
export const TABS = [
  { key: "form-builder", label: "Form Builder" },
  { key: "form-kunjungan-rumah", label: "Form Kunjungan Rumah" },
  { key: "staff", label: "Kader" },
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

export function kindLabel(k: string): string {
  return ({ text: "Teks", number: "Angka", date: "Tanggal", select: "Pilihan", checkbox: "Checkbox" }[k] ?? k);
}
