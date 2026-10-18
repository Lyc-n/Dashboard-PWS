import { useCallback, useEffect, useMemo, useState } from "react";
import { buildWarnings } from "@/features/dashboard/warning";
import { getNotifikasi, invalidateNotifikasi, onNotifikasiChange } from "@/features/notifikasi/lib/notifikasi-cache";
import { filterWarnings, ringkasanNotifikasi } from "@/features/notifikasi/lib/ringkasan";
import type { FilterNotifikasi, NotifikasiData } from "@/features/notifikasi/types";

const KOSONG: NotifikasiData = {
  regions: [],
  jadwal: [],
  tindakLanjut: [],
  ringkasan: { warga: 0, kunjungan: 0 },
};

const TANPA_FILTER: FilterNotifikasi = { severity: "all", type: "all", region: "all" };

/**
 * Data notifikasi untuk lonceng Topbar dan halaman /notifikasi.
 *
 * `warnings` dihitung DI KLIEN lewat `buildWarnings()`, bukan dikirim dari
 * server. Alasannya: `buildWarnings` fungsi murni, dan filter wilayah di lonceng
 * harus berubah seketika tanpa query kedua. Builder yang sama juga dipakai
 * dashboard, jadi angka di lonceng tidak mungkin melenceng dari kartu
 * "Perlu Perhatian".
 *
 * Pengambilan data lewat cache modul (`lib/notifikasi-cache.ts`), jadi lonceng di
 * Topbar dan daftar di /notifikasi membaca hasil yang sama dan tidak menarik
 * query berulang tiap navigasi.
 */
export function useNotifikasi(filter: FilterNotifikasi = TANPA_FILTER) {
  const [data, setData] = useState<NotifikasiData>(KOSONG);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const muat = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    getNotifikasi()
      .then((hasil) => {
        if (cancelled) return;
        setData(hasil);
        setError(null);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setError("Gagal memuat notifikasi dari database.");
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const cleanup = muat();
    // Record kunjungan yang baru disimpan memanggil invalidateNotifikasi(), yang
    // memancing muat ulang di SEMUA pemanggil sekalian — lonceng dan halaman.
    const unsubscribe = onNotifikasiChange(muat);
    return () => {
      cleanup();
      unsubscribe();
    };
  }, [muat]);

  const { severity, type, region } = filter;

  // `region: undefined` berarti semua wilayah; builder memperlakukannya sebagai "all".
  const semua = useMemo(
    () =>
      buildWarnings(
        { regions: data.regions, jadwal: data.jadwal, tindakLanjut: data.tindakLanjut },
        { region: region === "all" ? undefined : region },
      ),
    [data.regions, data.jadwal, data.tindakLanjut, region],
  );

  const warnings = useMemo(
    () => filterWarnings(semua, { severity, type, region: "all" }),
    [semua, severity, type],
  );

  const ringkasan = useMemo(() => ringkasanNotifikasi(semua), [semua]);

  /** Daftar wilayah untuk dropdown; sumbernya cakupan, bukan daftar hardcoded. */
  const regions = useMemo(() => data.regions.map((r) => r.name), [data.regions]);

  /** Muat ulang paksa, melewati TTL cache. */
  const reload = useCallback(async () => {
    invalidateNotifikasi();
    muat();
  }, [muat]);

  return { data, warnings, semua, regions, ringkasan, loading, error, reload };
}