import type { TipeField } from "@/features/form-builder/services/validasi";
import { SEMUA_TIPE_FIELD, TIPE_BUTUH_OPSI } from "@/features/form-builder/services/validasi";

export type TipeFieldEditor = TipeField;

export { SEMUA_TIPE_FIELD, TIPE_BUTUH_OPSI };

export const TIPE_FIELD_LABELS: Record<TipeFieldEditor, string> = {
  text: "Teks pendek",
  textarea: "Teks panjang",
  number: "Angka",
  select: "Pilihan (select)",
  radio: "Pilihan (radio)",
  checkbox: "Checkbox",
  date: "Tanggal",
  time: "Waktu",
  image: "Gambar",
  file: "File",
  group: "Grup ulang",
};

export interface FlatNode {
  kind: "section" | "field";
  clientId: string;
  parentKey: string | null;
  depth: number;
  index: number;
}

export interface DraftOpsi {
  clientId: string;
  value: string;
  label: string;
  aktif: boolean;
}

export interface DraftAturan {
  clientId: string;
  sourceClientId: string;
  operator: "equals" | "not_equals";
  value: string;
  aktif: boolean;
}

export interface DraftField {
  id: string | null;
  clientId: string;
  sectionClientId: string;
  nama: string;
  label: string;
  tipe: TipeFieldEditor;
  wajib: boolean;
  aktif: boolean;
  placeholder: string | null;
  deskripsi: string | null;
  jumlahKolom: number | null;
  /**
   * Sumber pilihan jawaban dari data yang sudah ada (agama, petugas, data warga,
   * dst). null = admin mengetik sendiri pilihannya di `opsi`. Nilai yang sah
   * ada di `sumber-opsi.ts`; server menolak yang tidak dikenal saat Build.
   */
  optionSourceType: string | null;
  optionSourceKey: string | null;
  opsi: DraftOpsi[];
  aturan: DraftAturan[];
}

export interface DraftSection {
  id: string | null;
  clientId: string;
  parentClientId: string | null;
  nama: string;
  deskripsi: string | null;
  aktif: boolean;
}

export interface DraftFormDocument {
  formVersionId: string;
  sections: DraftSection[];
  fields: DraftField[];
}

export interface BuildFormVersionInput {
  formVersionId: string;
  sections: {
    clientId: string;
    id: string | null;
    parentClientId: string | null;
    nama: string;
    deskripsi: string | null;
    aktif: boolean;
  }[];
  fields: {
    clientId: string;
    id: string | null;
    sectionClientId: string;
    nama: string;
    label: string;
    tipe: TipeFieldEditor;
    wajib: boolean;
    aktif: boolean;
    placeholder: string | null;
    deskripsi: string | null;
    jumlahKolom: number | null;
    optionSourceType: string | null;
    optionSourceKey: string | null;
    opsi: { value: string; label: string; urutan: number; aktif: boolean }[];
    aturan: {
      sourceClientId: string;
      operator: "equals" | "not_equals";
      value: string | null;
      aktif: boolean;
      urutan: number;
    }[];
  }[];
  actorId?: string | null;
}

export interface BuildFormVersionResult {
  jumlahSection: number;
  jumlahField: number;
  jumlahDihapus: number;
}

export type SelectedItem = 
  | { type: "section"; clientId: string }
  | { type: "field"; clientId: string }
  | null;

export interface PaletteItem {
  tipe: TipeFieldEditor;
  label: string;
  icon: string;
}