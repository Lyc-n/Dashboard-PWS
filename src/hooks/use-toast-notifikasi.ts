import { useCallback, useEffect, useState } from "react";
import { useLocation } from "@tanstack/react-router";
import { useNotifikasi } from "@/hooks/use-notifikasi";
import {
  DURASI_TOAST,
  bacaDitampilkan,
  pilihKandidatToast,
  tandaiDitampilkan,
} from "@/features/notifikasi/lib/toast-dedup";
import type { Warning } from "@/features/dashboard/warning";

/**
 * Perekat antara data notifikasi dan toast (lihat `NotifikasiToast.tsx`).
 *
 * Komponen hanya menerima `aktif` + `tutup`; semua keputusan ("warning mana
 * yang dipilih", "sudah pernah tampil di mana") ada di
 * `lib/toast-dedup.ts` yang murni. Satu toast aktif pada satu waktu; selebihnya
 * mengantre sampai yang sekarang ditutup (tombol, Esc, klik, atau timer).
 *
 * Data dibaca lewat `useNotifikasi()` — cache modulnya sudah dedupe request
 * in-flight, jadi hook ini tidak menambah query berapa pun cuma karena ia
 * dipasang di Topbar bersama lonceng.
 */
export function useToastNotifikasi(): {
  aktif: Warning | null;
  jumlahAntrean: number;
  tutup: () => void;
} {
  const location = useLocation();
  const { warnings, loading, error } = useNotifikasi();

  const [antrean, setAntrean] = useState<Warning[]>([]);
  const [aktif, setAktif] = useState<Warning | null>(null);

  // Pilih kandidat setiap kali data berhasil dimuat di halaman mana pun
  // KECUALI /notifikasi — di sana daftarnya sudah tampil sendiri, toast hanya
  // menggandakan. ID ditandai saat masuk antrean (bukan saat ditutup) supaya
  // invalidate berikutnya tidak memunculkan ulang toast yang sama.
  useEffect(() => {
    if (loading || error) return;
    if (location.pathname.startsWith("/notifikasi")) return;
    const kandidat = pilihKandidatToast(warnings, bacaDitampilkan());
    if (kandidat.length === 0) return;
    tandaiDitampilkan(kandidat.map((w) => w.id));
    setAntrean((sebelum) => [...sebelum, ...kandidat]);
  }, [loading, error, warnings, location.pathname]);

  // Kepala antrean naik jadi toast aktif. Tanpa guard bawah `aktif`, kepala
  // akan ditimpa setiap render — yang baru layak naik hanya saat tidak ada
  // toast berjalan.
  useEffect(() => {
    if (aktif || antrean.length === 0) return;
    const [atas, ...sisa] = antrean;
    setAktif(atas ?? null);
    setAntrean(sisa);
  }, [aktif, antrean]);

  const tutup = useCallback(() => setAktif(null), []);

  // Auto-tutup per toast aktif. Efek ini dibangun ulang setiap `aktif` ganti,
  // jadi timer milik toast ini saja dan dibersihkan saat pindah.
  useEffect(() => {
    if (!aktif) return;
    const timer = setTimeout(tutup, DURASI_TOAST);
    return () => clearTimeout(timer);
  }, [aktif, tutup]);

  // Esc menutup toast yang sedang aktif, polanya sama dengan dropdown lonceng.
  useEffect(() => {
    if (!aktif) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") tutup();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [aktif, tutup]);

  return { aktif, jumlahAntrean: antrean.length, tutup };
}
