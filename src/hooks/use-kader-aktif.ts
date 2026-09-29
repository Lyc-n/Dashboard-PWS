import { useCallback, useEffect, useState } from "react";
import { listKaderUntukRekap } from "@/lib/utils.functions";
import type { Staff } from "@/lib/staff";

/**
 * Daftar kader aktif untuk filter di Rekap Kunjungan Rumah.
 *
 * Sumbernya `users` dengan `role = 'kader'`, bukan `admin_staff` yang sudah
 * dihapus. Bentuk hasilnya tetap `Staff` supaya `computeRekap()` dan
 * `kaderNameOf()` tidak perlu diubah keduanya.
 *
 * `fasKesId` sengaja tidak diisi dari UI sekarang: sesi login masih memakai satu
 * PIN global dan `SESSION_PROFILE` hard-coded, jadi tidak ada `users.id` yang
 * diketahui untuk tahu fasilitas mana yang miliknya sendiri.
 * Setelah login per-akun selesai, baris ini bisa diisi dari `users.fasKesId`
 * milik akun yang sedang login, dan daftar kader otomatis tersaring ke satu
 * fasilitas.
 */
export function useKaderAktif() {
  const [kader, setKader] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setKader(await listKaderUntukRekap({ data: { fasKesId: null } }));
    } catch {
      setError("Gagal memuat daftar kader.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { kader, staff: kader, loading, error, refresh };
}
