export interface SummaryCardData {
  name: string;
  title: string;
  jiwa: number;
  terlayani: number;
  pct: number;
  sub: string;
  bg?: string;
  barColor?: string;
}

export interface ReportRow {
  tgl: string;
  kel: string;
  posy: string;
  prior: string;
  nama: string;
  sumber: string;
  hasil: string;
  status: string;
}

export interface SasaranRow {
  nama: string;
  nik: string;
  kel: string;
  posy: string;
  prior: string;
  status: string;
  tgl: string;
  lokasi: string;
}

export interface TindakCandidate {
  kel: string;
  issue: string;
  color: string;
  icon: string;
}



export const KELURAHAN_DATA: SummaryCardData[] = [
  { name: "Trajeng", title: "Kelurahan Trajeng", jiwa: 4250, terlayani: 3560, pct: 84, sub: "3.560 / 4.250 jiwa dikunjungi" },
  { name: "Ngemplakrejo", title: "Kelurahan Ngemplakrejo", jiwa: 3120, terlayani: 2540, pct: 81, sub: "2.540 / 3.120 jiwa dikunjungi" },
  { name: "Tambaan", title: "Kelurahan Tambaan", jiwa: 2300, terlayani: 1830, pct: 80, sub: "1.830 / 2.300 jiwa dikunjungi" },
  { name: "Mayangan", title: "Kelurahan Mayangan", jiwa: 2710, terlayani: 2150, pct: 79, sub: "2.150 / 2.710 jiwa dikunjungi" },
];

export const PRIORITAS_DATA: SummaryCardData[] = [
  { name: "ODGJ", title: "ODGJ", jiwa: 980, terlayani: 568, pct: 58, sub: "47 / 80 jiwa", bg: "var(--color-accent)", barColor: "var(--color-accent)" },
  { name: "Bumil Risti", title: "Bumil Risti", jiwa: 320, terlayani: 259, pct: 81, sub: "259 / 320 jiwa", bg: "var(--color-accent)", barColor: "var(--color-accent)" },
  { name: "Balita Risti", title: "Balita Risti", jiwa: 470, terlayani: 348, pct: 74, sub: "348 / 470 jiwa", bg: "var(--color-accent)", barColor: "var(--color-accent)" },
  { name: "TB", title: "TB", jiwa: 610, terlayani: 409, pct: 67, sub: "49 / 60 jiwa", bg: "var(--color-accent)", barColor: "var(--color-accent)" },
  { name: "Stunting", title: "Stunting", jiwa: 540, terlayani: 281, pct: 52, sub: "281 / 540 jiwa", bg: "var(--color-accent)", barColor: "var(--color-accent)" },
];

export const BASE_MONTHLY = [122, 148, 168, 185, 210, 198, 232, 245, 228, 205, 182, 168];

export const POSYANDU_CONTRIB: { n: string; v: number }[][] = [
  [{ n: "Melati 1", v: 42 }, { n: "Mawar 2", v: 38 }, { n: "Kenanga", v: 28 }],
  [{ n: "Melati 1", v: 48 }, { n: "Mawar 2", v: 44 }, { n: "Kenanga", v: 32 }, { n: "Flamboyan", v: 24 }],
  [{ n: "Mawar 2", v: 52 }, { n: "Melati 1", v: 46 }, { n: "Kenanga", v: 38 }, { n: "Anggrek", v: 32 }],
  [{ n: "Kenanga", v: 58 }, { n: "Melati 1", v: 50 }, { n: "Flamboyan", v: 40 }, { n: "Mawar 2", v: 37 }],
  [{ n: "Flamboyan", v: 62 }, { n: "Kenanga", v: 55 }, { n: "Melati 1", v: 48 }, { n: "Mawar 2", v: 45 }],
  [{ n: "Melati 1", v: 60 }, { n: "Kenanga", v: 52 }, { n: "Anggrek", v: 48 }, { n: "Mawar 2", v: 38 }],
  [{ n: "Mawar 2", v: 68 }, { n: "Melati 1", v: 62 }, { n: "Kenanga", v: 56 }, { n: "Flamboyan", v: 46 }],
  [{ n: "Kenanga", v: 72 }, { n: "Flamboyan", v: 64 }, { n: "Melati 1", v: 58 }, { n: "Mawar 2", v: 51 }],
  [{ n: "Melati 1", v: 66 }, { n: "Kenanga", v: 60 }, { n: "Mawar 2", v: 54 }, { n: "Anggrek", v: 48 }],
  [{ n: "Mawar 2", v: 58 }, { n: "Melati 1", v: 52 }, { n: "Kenanga", v: 50 }, { n: "Flamboyan", v: 45 }],
  [{ n: "Kenanga", v: 54 }, { n: "Melati 1", v: 48 }, { n: "Mawar 2", v: 42 }, { n: "Anggrek", v: 38 }],
  [{ n: "Melati 1", v: 50 }, { n: "Kenanga", v: 46 }, { n: "Mawar 2", v: 38 }, { n: "Flamboyan", v: 34 }],
];

export const TINDAK_CANDIDATES: TindakCandidate[] = [
  { kel: "Ngemplakrejo", issue: "Cakupan tertinggal 12% — 38 balita belum KR ulang.", color: "var(--color-accent)", icon: "!" },
  { kel: "Tambaan", issue: "Kunjungan mangkir — sweeping kader minggu ini.", color: "var(--color-warn)", icon: "↗" },
  { kel: "Trajeng", issue: "Terdapat 80% Penderita Hipertensi", color: "var(--color-ink-2)", icon: "✓" },
];

const DASHBOARD_ROWS: ReportRow[] = [
  { tgl: "2026-03-12", kel: "Trajeng", posy: "Melati 1", prior: "Stunting", nama: "An. Rafi — 22 bln", sumber: "Kunjungan rumah", hasil: "BB/TB di bawah -2SD", status: "Perlu tindak lanjut" },
  { tgl: "2026-03-11", kel: "Ngemplakrejo", posy: "Kenanga", prior: "Bumil Risti", nama: "Ny. Siti — 32 mg", sumber: "Datang ke posyandu", hasil: "TD 140/90", status: "Perlu tindak lanjut" },
  { tgl: "2026-03-10", kel: "Tambaan", posy: "Mawar 2", prior: "TB", nama: "Tn. Slamet — 41 th", sumber: "Kunjungan rumah", hasil: "Dahak positif", status: "Perlu tindak lanjut" },
  { tgl: "2026-03-09", kel: "Mayangan", posy: "Flamboyan", prior: "Balita Risti", nama: "An. Kirana — 8 bln", sumber: "Kunjungan rumah", hasil: "Batuk pilek", status: "Selesai" },
];

export function dashboardRows(): ReportRow[] {
  const rows = [...DASHBOARD_ROWS];
  while (rows.length < 24) {
    const b = rows[rows.length % 4];
    if (!b) break;
    rows.push({ ...b, tgl: "2026-03-0" + (3 + (rows.length % 6)), nama: `${b.nama} #${rows.length}` });
  }
  return rows;
}

const SASARAN_ROWS: SasaranRow[] = [
  { nama: "Ny. Siti Aminah", nik: "3573014203820001", kel: "Trajeng", posy: "Melati 1", prior: "Bumil Risti", status: "Sudah", tgl: "2026-02-28", lokasi: "Posyandu Melati 1" },
  { nama: "An. Rafi Ahmad", nik: "3573011201240002", kel: "Ngemplakrejo", posy: "Kenanga", prior: "Stunting", status: "Belum", tgl: "—", lokasi: "—" },
  { nama: "Tn. Slamet Riyadi", nik: "3573011505800003", kel: "Tambaan", posy: "Mawar 2", prior: "TB", status: "Terjadwal", tgl: "2026-03-05", lokasi: "Puskesmas Trajeng" },
  { nama: "Tn. Wahyu Hidayat", nik: "3573011009850004", kel: "Trajeng", posy: "Melati 1", prior: "ODGJ", status: "Sudah", tgl: "2026-03-01", lokasi: "Posyandu Melati 1" },
  { nama: "An. Kirana Putri", nik: "3573012208250005", kel: "Mayangan", posy: "Flamboyan", prior: "Balita Risti", status: "Belum", tgl: "—", lokasi: "—" },
  { nama: "Ny. Lestari Dewi", nik: "3573014802900006", kel: "Ngemplakrejo", posy: "Kenanga", prior: "Bumil Risti", status: "Sudah", tgl: "2026-02-20", lokasi: "Puskesmas Trajeng" },
  { nama: "Ny. Mariyah", nik: "3573015509700007", kel: "Tambaan", posy: "Flamboyan", prior: "ODGJ", status: "Sudah", tgl: "2026-03-02", lokasi: "Posyandu Flamboyan" },
  { nama: "An. Bagas Pratama", nik: "3573011803240008", kel: "Mayangan", posy: "Mawar 2", prior: "Balita Risti", status: "Belum", tgl: "—", lokasi: "—" },
  { nama: "An. Dinda Ayu", nik: "3573016408230009", kel: "Trajeng", posy: "Kenanga", prior: "Stunting", status: "Sudah", tgl: "2026-02-25", lokasi: "Posyandu Kenanga" },
  { nama: "Ny. Yuni Astuti", nik: "3573016207900010", kel: "Mayangan", posy: "Mawar 2", prior: "TB", status: "Belum", tgl: "—", lokasi: "—" },
];

export function sasaranRows(): SasaranRow[] {
  const rows = [...SASARAN_ROWS];
  while (rows.length < 36) {
    const b = rows[rows.length % 10];
    if (!b) break;
    rows.push({ ...b, nik: b.nik.slice(0, 12) + (1000 + rows.length), nama: `${b.nama} #${rows.length}` });
  }
  return rows;
}

const LAPORAN_NAMES = [
  "Siti Aminah",
  "Rafi Ahmad",
  "Slamet Riyadi",
  "Wahyu Hidayat",
  "Kirana Putri",
  "Lestari Dewi",
  "Mariyah",
  "Bagas Pratama",
  "Dinda Ayu",
  "Yuni Astuti",
  "Sugeng Prayitno",
  "Ningsih Rahayu",
];

const LAPORAN_HASIL: Record<string, string> = {
  Selesai: "TD normal, keluhan terkendali",
  "Perlu tindak lanjut": "Perlu kontrol ulang / rujuk PKM",
  Terjadwal: "Menunggu jadwal kunjungan",
};

export function laporanRows(): ReportRow[] {
  const kels = ["Trajeng", "Ngemplakrejo", "Tambaan", "Mayangan"];
  const prios = ["ODGJ", "Bumil Risti", "Balita Risti", "TB", "Stunting"];
  const posys = ["Melati 1", "Mawar 2", "Kenanga", "Flamboyan"];
  const rows: ReportRow[] = [];
  for (let i = 0; i < 48; i++) {
    // modulo atas array non-kosong — index selalu valid
    const kel = kels[i % 4]!;
    const prio = prios[(i * 2 + ((i / 4) | 0)) % 5]!;
    const posy = posys[(i + ((i / 4) | 0)) % 4]!;
    const st = i % 5 === 3 ? "Perlu tindak lanjut" : i % 4 === 3 ? "Terjadwal" : "Selesai";
    const m = (i % 12) + 1;
    const d = ((i * 7) % 27) + 1;
    rows.push({
      tgl: `2026-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
      kel,
      posy,
      prior: prio,
      nama: (i % 2 ? "Tn. " : "Ny. ") + LAPORAN_NAMES[i % 12]! + (i >= 12 ? ` #${i + 1}` : ""),
      sumber: i % 3 === 0 ? "Datang ke posyandu" : "Kunjungan rumah",
      hasil: LAPORAN_HASIL[st]!,
      status: st,
    });
  }
  return rows;
}