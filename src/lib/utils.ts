export function cn(...inputs: (string | false | null | undefined)[]) {
  return inputs.filter(Boolean).join(" ");
}

export type TagVariant = "odgj" | "bumil" | "balita" | "tb" | "stunt";

export type StatusVariant =
  | "done"
  | "process"
  | "pending"
  | "belum"
  | "jadwal"
  | "tindak"
  | "on"
  | "off"
  | "hadir"
  | "izin";

export type BadgeVariant = "ok" | "hadir" | "izin";

export type PillVariant = TagVariant | StatusVariant | BadgeVariant;

export const PILL_STYLES: Record<PillVariant, string> = {
  odgj: "border-[var(--color-chip-prio-odgj-border)] bg-[var(--color-chip-prio-odgj-bg)] text-[var(--color-chip-prio-odgj-text)]",
  bumil: "border-[var(--color-chip-prio-bumil-border)] bg-[var(--color-chip-prio-bumil-bg)] text-[var(--color-chip-prio-bumil-text)]",
  balita: "border-[var(--color-chip-prio-balita-border)] bg-[var(--color-chip-prio-balita-bg)] text-[var(--color-chip-prio-balita-text)]",
  tb: "border-[var(--color-chip-prio-tb-border)] bg-[var(--color-chip-prio-tb-bg)] text-[var(--color-chip-prio-tb-text)]",
  stunt: "border-[var(--color-chip-prio-stunt-border)] bg-[var(--color-chip-prio-stunt-bg)] text-[var(--color-chip-prio-stunt-text)]",
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
  ok: "border-[var(--color-badge-ok-border)] bg-[var(--color-badge-ok-bg)] text-[var(--color-badge-ok-text)]",
};

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

export function hariIni(): string {
  const t = new Date();
  const y = t.getFullYear();
  const m = String(t.getMonth() + 1).padStart(2, "0");
  const d = String(t.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export const todayISO = hariIni;

export function fmtDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

export function triggerDownload(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  // revoke async agar Firefox sempat mulai download
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Dipakai `downloadCsv` untuk setiap sel. Diekspor supaya perilaku
 *  pencegahan formula injection bisa diuji tanpa DOM — `downloadCsv` sendiri
 *  tidak bisa diuji di environment node karena menyentuh `document`. */
export function escapeCsvCell(v: string | number): string {
  let s = String(v);
  // cegah formula injection saat dibuka di Excel: = + - @_TAB \r
  if (/^[=+\-@\t\r]/.test(s)) s = `\t${s}`;
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function downloadCsv(filename: string, head: string[], rows: (string | number)[][]) {
  const esc = escapeCsvCell;
  const content = "\uFEFF" + [head, ...rows].map((r) => r.map(esc).join(",")).join("\n");
  triggerDownload(filename, new Blob([content], { type: "text/csv;charset=utf-8" }));
}

export function normalkanNik(nik: string): string {
  return String(nik).replace(/\D/g, "").slice(0, 16);
}

/**
 * Buang semua non-digit dari input PIN.
 *
 * Terpisah dari `normalkanNik` meski isinya sama untuk PIN: bentuk keduanya
 * sengaja dibuat eksplisit karena maknanya berbeda. `normalkanNik` tidak boleh
 * dipakai di sini tanpa sengaja — PIN bukan NIK, dan hanya kebetulan bahwa
 * keduanya sama-sama deretan digit.
 */
export function normalkanPin(pin: string): string {
  return String(pin).replace(/\D/g, "").slice(0, 16);
}

export function isValidNik(nik: string): boolean {
  return /^\d{16}$/.test(nik);
}

export function pesanError(err: unknown, cadangan: string): string {
  if (typeof err === "object" && err !== null) {
    const pesan = (err as { pesan?: unknown }).pesan;
    if (typeof pesan === "string" && pesan.trim() !== "") return pesan;
  }
  if (err instanceof Error && err.message) return err.message;
  return cadangan;
}
