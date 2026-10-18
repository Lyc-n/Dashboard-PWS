import { selectTopWarnings, sortWarnings } from "@/features/dashboard/warning";
import type { Warning, WarningSeverity } from "@/features/dashboard/warning";
import type { FilterNotifikasi } from "@/features/notifikasi/types";

/**
 * Blok presentasi notifikasi: filter, ringkasan, dan pemisahan lonceng vs halaman.
 *
 * Semua fungsi murni dan hanya menyentuh `Warning[]` dari `warning.ts`, supaya
 * bisa diuji tanpa React maupun database.
 */

export const FILTER_SEMUA = "all";

/** Berapa item yang masih muat di dropdown lonceng tanpa jadi tinggi penuh. */
export const BATAS_LONTENG = 5;

/**
 * Warning yang cocok dengan filter. `"all"` berarti tanpa filter untuk semua
 * kolom.
 *
 * `selectTopWarnings` dipakai untuk membuang yang bukan "active" dulu — tidak
 * ada gunanya memfilter warning yang sudah dibuang.
 *
 * Warning tanpa `region` dianggap konteks global dan tetap muncul saat satu
 * wilayah dipilih. Dalam pemakaian normal ini jarang terjadi: `buildWarnings`
 * sudah menempelkan filter wilayah ke warning agregat (`mk({ region })`), jadi
 * daftar dari builder selalu punya wilayah. Aturan ini hanya menjaga halaman
 * notifikasi tidak salah menampilkan "0 hasil" kalau nanti ada warning
 * global yang ditambahkan.
 */
export function filterWarnings(list: Warning[], filter: FilterNotifikasi): Warning[] {
  const severity = filter.severity;
  const type = filter.type;
  const region = filter.region;

  return selectTopWarnings(list, Number.MAX_SAFE_INTEGER).all.filter(
    (w) =>
      (severity === FILTER_SEMUA || w.severity === severity) &&
      (type === FILTER_SEMUA || w.type === type) &&
      (region === FILTER_SEMUA || w.region === region || w.region === null),
  );
}

/** Jumlah warning per severity, hanya untuk yang sedang aktif. */
export function hitungPerSeverity(list: Warning[]): Record<WarningSeverity, number> {
  const out: Record<WarningSeverity, number> = { critical: 0, attention: 0, reminder: 0, info: 0 };
  for (const w of selectTopWarnings(list, Number.MAX_SAFE_INTEGER).all) out[w.severity] += 1;
  return out;
}

/** Ringkasan satu baris untuk header lonceng dan kartu atas halaman. */
export function ringkasanNotifikasi(list: Warning[]): {
  total: number;
  kritis: number;
  teratas: Warning | null;
} {
  const semua = selectTopWarnings(list, Number.MAX_SAFE_INTEGER).all;
  return { total: semua.length, kritis: hitungPerSeverity(list).critical, teratas: semua[0] ?? null };
}

/** Item untuk dropdown lonceng: aktif dulu, lalu potong. */
export function untukLonceng(list: Warning[], limit = BATAS_LONTENG): {
  rows: Warning[];
  hidden: number;
} {
  const semua = sortWarnings(list.filter((w) => w.status === "active"));
  return { rows: semua.slice(0, limit), hidden: Math.max(0, semua.length - limit) };
}

/** Warning dalam urutan severity, tanpa filter — urutan default halaman penuh. */
export function urutSemua(list: Warning[]): Warning[] {
  return selectTopWarnings(list, Number.MAX_SAFE_INTEGER).all;
}

/** Label ringkas untuk satu warning, dipakai `<title>` dan aria-label. */
export function labelSingkat(w: Warning): string {
  return w.description ? `${w.title} - ${w.description}` : w.title;
}