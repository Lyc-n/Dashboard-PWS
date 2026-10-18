import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { Button, Select } from "@/components/atoms";
import { NotifikasiList } from "@/features/notifikasi/components/NotifikasiList";
import { FILTER_SEMUA, untukLonceng } from "@/features/notifikasi/lib/ringkasan";
import { useNotifikasi } from "@/hooks/use-notifikasi";
import type { FilterNotifikasi } from "@/features/notifikasi/types";

/**
 * Lonceng notifikasi di Topbar.
 *
 * Pengganti pesan WhatsApp: peringatan yang sebelumnya dikirim ke nomor kader
 * sekarang muncul di dalam aplikasi, dan bisa dibuka tanpa pindah halaman.
 * Tidak ada status "sudah dibaca" yang disimpan — session di aplikasi ini masih
 * milik satu profil admin hardcoded (`SESSION_PROFILE`), jadi tabel read-state
 * tidak akan pernah dibaca oleh lebih dari satu orang. Badgeinya karena itu
 * menampilkan JUMLAH warning aktif, bukan jumlah belum dibaca.
 *
 * Data diambil lewat `useNotifikasi`, yang memanggil server fn sama dengan
 * halaman /notifikasi. TTL 5 menit di sisi server (lihat
 * `services/notifikasi-cache.ts`) menjaga agar render di tiap halaman tidak
 * menarik seluruh tabel `survey_entries`.
 */
export function NotifikasiBell() {
  const [open, setOpen] = useState(false);
  const [region, setRegion] = useState(FILTER_SEMUA);
  const ref = useRef<HTMLDivElement>(null);

  const filter: FilterNotifikasi = { severity: FILTER_SEMUA, type: FILTER_SEMUA, region };
  const { warnings, regions, ringkasan, loading, error } = useNotifikasi(filter);

  // Sama seperti dropdown profil: tutup saat klik jatuh di luar.
  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handle);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", handle);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const { rows, hidden } = untukLonceng(warnings);
  const total = ringkasan.total;
  const kritis = ringkasan.kritis;

  return (
    <div ref={ref} className="relative">
      <Button
        aria-label={total > 0 ? `Notifikasi, ${total} aktif` : "Notifikasi"}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((o) => !o)}
        variant="ghost"
        size="sm"
        className="relative px-1.5"
      >
        <Bell size={18} strokeWidth={1.8} />
        {total > 0 ? (
          <span
            className={
              "absolute -right-0.5 -top-0.5 min-w-4 rounded-full px-1 text-[10px] font-bold leading-4 " +
              (kritis > 0
                ? "bg-danger text-surface"
                : "bg-warn text-surface")
            }
            aria-hidden="true"
          >
            {total > 99 ? "99+" : total}
          </span>
        ) : null}
      </Button>

      {open ? (
        <div
          role="menu"
          aria-label="Daftar notifikasi"
          className="absolute right-0 top-full z-50 mt-2 w-88 max-w-[calc(100vw-1.5rem)] rounded-xl border border-line bg-surface shadow-elev"
        >
          <div className="flex items-center justify-between gap-2 border-b border-line px-3 py-2.5">
            <div className="text-[13px] font-bold text-ink">Notifikasi</div>
            <div className="text-[11px] text-muted">
              {loading ? "Memuat…" : total > 0 ? `${total} aktif` : "Semua beres"}
            </div>
          </div>

          {regions.length > 1 ? (
            <div className="border-b border-line px-3 py-2">
              <label className="flex items-center gap-2 text-[11px] text-muted">
                <span className="shrink-0">Wilayah</span>
                <Select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  aria-label="Filter wilayah notifikasi"
                  className="min-w-0 flex-1 py-1 text-[11px]"
                >
                  <option value={FILTER_SEMUA}>Semua wilayah</option>
                  {regions.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </Select>
              </label>
            </div>
          ) : null}

          <div className="max-h-96 overflow-auto p-2">
            {error ? (
              <p className="px-1 py-2 text-[12px] text-danger">{error}</p>
            ) : (
              <NotifikasiList warnings={rows} ringkas kosong="Tidak ada notifikasi untuk wilayah ini." />
            )}
          </div>

          <div className="border-t border-line p-2">
            {hidden > 0 ? (
              <p className="px-1 pb-1.5 text-[11px] text-muted">{hidden} notifikasi lain belum ditampilkan.</p>
            ) : null}
            <Link
              to="/notifikasi"
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-2 text-center text-[12px] font-bold text-accent hover:bg-surface-2"
            >
              Lihat semua notifikasi
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}