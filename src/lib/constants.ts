import { ClipboardCheck, FileText, LayoutDashboard, PersonStanding, ScrollText, Settings } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const KELS = ["Trajeng", "Ngemplakrejo", "Tambaan", "Mayangan"] as const;

export const PRIOS = ["ODGJ", "Bumil Risti", "Balita Risti", "TB", "Stunting"] as const;

export const POSY = ["Melati 1", "Mawar 2", "Kenanga", "Flamboyan"] as const;

export const PERAN = ["Admin", "Bidan", "Perawat", "Kader"] as const;

export const JENIS_KEGIATAN = [
  "Penyuluhan",
  "Posyandu",
  "Kelas ibu",
  "Senam",
  "Gotong royong",
  "Pelatihan kader",
] as const;

export const SUMBER_PERIKSA = ["Kunjungan rumah", "Datang ke posyandu"] as const;

export const HASIL_KUNJUNGAN = ["Selesai — sehat / terkendali", "Kontrol ulang", "Rujuk ke Puskesmas"] as const;

export const STATUS_DEFAULT = ["Selesai", "Perlu tindak lanjut", "Terjadwal"] as const;

export const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
] as const;

export const KATEGORI_CHECKLIST = [
  "Kelompok A",
  "Kelompok B",
  "Kelompok C",
  "Kelompok D",
  "Kelompok E",
] as const;

export interface NavItem {
  label: string;
  to: string;
  Icon: LucideIcon;
}

export const NAV_ITEMS = [
  { label: "Dashboard", to: "/", Icon: LayoutDashboard },
  { label: "Data Sasaran", to: "/sasaran", Icon: FileText },
  { label: "Input Checklist", to: "/checklist", Icon: ClipboardCheck },
  { label: "Laporan", to: "/laporan", Icon: ScrollText },
  { label: "Kegiatan", to: "/kegiatan", Icon: PersonStanding },
  { label: "Kelola", to: "/kelola", Icon: Settings },
] as const;

export const BOTTOM_NAV_ITEMS = [
  NAV_ITEMS[0],
  NAV_ITEMS[1],
  NAV_ITEMS[2],
  NAV_ITEMS[3],
  NAV_ITEMS[4],
] as const;

export const APP_BRAND = {
  name: "DINAS KESEHATAN",
  region: "KOTA PASURUAN",
} as const;

export const STORAGE_KEYS = {
  checklist: "pws-checklist",
  kegiatan: "pws-kegiatan",
  adminItems: "pws-admin-items",
  adminPrios: "pws-admin-prios",
  adminStaff: "pws-admin-staff",
  krTemplates: "pws-kr-templates",
} as const;