import type { HASIL_KUNJUNGAN_RUMAH } from "@/lib/constants";
import type { WarningSeverity } from "./warning";

/** Hasil kunjungan (nilai yang SUDAH ada di form) yang berarti butuh tindak lanjut.
 *  Dicek compiler: salah ketik / nilai yang tidak ada di HASIL_KUNJUNGAN_RUMAH → error. */
export const HASIL_PERLU_TINDAK_LANJUT: readonly (typeof HASIL_KUNJUNGAN_RUMAH)[number][] = [
  "Kontrol ulang",
  "Rujuk ke Puskesmas",
];

export interface WarningConfig {
  period: { startDate: string; endDate: string };
  sasaranBelum: { severity: WarningSeverity };
  jadwalTerlambat: { severity: WarningSeverity };
  /** Urutan tidak penting; dipilih milestone terkecil yang sudah terlewati. */
  endOfPeriodMilestones: { days: number; severity: WarningSeverity }[];
  coverage: {
    /** Cakupan (%, dibulatkan seperti di KelurahanSection) di bawah ini → warning. */
    lowPct: number;
    /** Di bawah ini → critical. */
    criticalPct: number;
    /** Wilayah dengan sasaran lebih sedikit dari ini diabaikan (1/2 = 50% bukan sinyal). */
    minSasaran: number;
  };
  tindakLanjut: {
    openHasil: readonly string[];
    /** Umur (hari sejak kunjungan) → severity. Warning memakai severity terburuk. */
    ageBands: { overDays: number; severity: WarningSeverity }[];
    /** Severity bila semua item masih lebih muda dari band terendah. */
    defaultSeverity: WarningSeverity;
  };
  display: { maxItems: number };
}

export const WARNING_CONFIG: WarningConfig = {
  period: { startDate: "2026-01-01", endDate: "2026-12-31" },
  sasaranBelum: { severity: "critical" },
  jadwalTerlambat: { severity: "attention" },
  endOfPeriodMilestones: [
    { days: 90, severity: "info" },
    { days: 30, severity: "reminder" },
    { days: 14, severity: "attention" },
    { days: 7, severity: "critical" },
  ],
  coverage: { lowPct: 70, criticalPct: 40, minSasaran: 10 },
  tindakLanjut: {
    openHasil: HASIL_PERLU_TINDAK_LANJUT,
    ageBands: [
      { overDays: 30, severity: "critical" },
      { overDays: 14, severity: "attention" },
      { overDays: 7, severity: "reminder" },
    ],
    defaultSeverity: "info",
  },
  display: { maxItems: 5 },
};