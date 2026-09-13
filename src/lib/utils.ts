import { clsx } from "clsx";
import type { ClassValue } from "clsx"; 

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export const TAG_STYLES = {
  odgj: "border-[var(--color-chip-prio-odgj-border)] bg-[var(--color-chip-prio-odgj-bg)] text-[var(--color-chip-prio-odgj-text)]",
  bumil: "border-[var(--color-chip-prio-bumil-border)] bg-[var(--color-chip-prio-bumil-bg)] text-[var(--color-chip-prio-bumil-text)]",
  balita: "border-[var(--color-chip-prio-balita-border)] bg-[var(--color-chip-prio-balita-bg)] text-[var(--color-chip-prio-balita-text)]",
  tb: "border-[var(--color-chip-prio-tb-border)] bg-[var(--color-chip-prio-tb-bg)] text-[var(--color-chip-prio-tb-text)]",
  stunt: "border-[var(--color-chip-prio-stunt-border)] bg-[var(--color-chip-prio-stunt-bg)] text-[var(--color-chip-prio-stunt-text)]",
} as const;

export type TagVariant = keyof typeof TAG_STYLES;

const PRIO_TO_TAG: Record<string, TagVariant> = {
  ODGJ: "odgj",
  "Bumil Risti": "bumil",
  "Balita Risti": "balita",
  TB: "tb",
  Stunting: "stunt",
};

export function priorityTagVariant(prio?: string | null): TagVariant {
  return PRIO_TO_TAG[prio ?? ""] ?? "odgj";
}

export const STATUS_STYLES = {
  done: "border-[var(--color-status-done-border)] bg-[var(--color-status-done-bg)] text-[var(--color-status-done-text)]",
  process: "border-[var(--color-status-process-border)] bg-[var(--color-status-process-bg)] text-[var(--color-status-process-text)]",
  pending: "border-[var(--color-status-pending-border)] bg-[var(--color-status-pending-bg)] text-[var(--color-status-pending-text)]",
  belum: "border-[var(--color-status-belum-border)] bg-[var(--color-status-belum-bg)] text-[var(--color-status-belum-text)]",
  jadwal: "border-[var(--color-status-jadwal-border)] bg-[var(--color-status-jadwal-bg)] text-[var(--color-status-jadwal-text)]",
  tindak: "border-[var(--color-status-tindak-border)] bg-[var(--color-status-tindak-bg)] text-[var(--color-status-tindak-text)]",
  on: "border-[var(--color-status-on-border)] bg-[var(--color-status-on-bg)] text-[var(--color-status-on-text)]",
  off: "border-[var(--color-status-off-border)] bg-[var(--color-status-off-bg)] text-[var(--color-status-off-text)]",
  hadir: "border-[var(--color-status-hadir-border)] bg-[var(--color-status-hadir-bg)] text-[var(--color-status-hadir-text)]",
  izin: "border-[var(--color-status-izin-border)] bg-[var(--color-status-izin-bg)] text-[var(--color-status-izin-text)]",
} as const;

export type StatusVariant = keyof typeof STATUS_STYLES;

export function statusVariantFrom(value?: string | null): StatusVariant {
  switch (value) {
    case "Sudah":
    case "Selesai":
    case "Aktif":
      return "done";
    case "Belum":
      return "belum";
    case "Perlu tindak lanjut":
      return "process";
    case "Terjadwal":
      return "jadwal";
    case "Hadir":
      return "hadir";
    case "Izin":
      return "izin";
    case "Nonaktif":
      return "off";
    default:
      return "pending";
  }
}

export const BADGE_STYLES = {
  ok: "border-[var(--color-badge-ok-border)] bg-[var(--color-badge-ok-bg)] text-[var(--color-badge-ok-text)]",
  hadir: "border-[var(--color-badge-hadir-border)] bg-[var(--color-badge-hadir-bg)] text-[var(--color-badge-hadir-text)]",
  izin: "border-[var(--color-badge-izin-border)] bg-[var(--color-badge-izin-bg)] text-[var(--color-badge-izin-text)]",
} as const;

export type BadgeVariant = keyof typeof BADGE_STYLES;

export function fmtDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

export function sum(values: number[]): number {
  return values.reduce((a, b) => a + b, 0);
}

export function average(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.round(sum(values) / values.length);
}

export function initialsOf(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}