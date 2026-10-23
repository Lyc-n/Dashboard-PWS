import { Link } from '@tanstack/react-router'
import { X } from 'lucide-react'
import { Button, HistoryRow, Pill } from '@/components/ui'
import {
  SEVERITY_META,
  WARNING_TYPE_ICON,
  WARNING_TYPE_LABEL,
} from '@/components/dashboard/severity'
import { warningTarget } from '@/lib/dashboard/warning'
import { labelSingkat } from '@/lib/notifikasi/ringkasan'
import { useToastNotifikasi } from '@/hooks/notifikasi/use-notifikasi-toast'
import { cn } from '@/lib/utils'

/**
 * Toast notifikasi di pojok kanan bawah.
 *
 * Muncul SENDIRI (tanpa diklik) saat ada warning `critical`/`attention` yang
 * belum pernah ditampilkan di sesi ini — keputusan bentuk dan " sekali per
 * sesi" datang dari pembicaraan proyek, logika pemilihnya ada di
 * `lib/toast-dedup.ts`, keputusan naik-turun antreannya ada di hook
 * `useToastNotifikasi`.
 *
 * Bukan dialog browser (`alert`/`confirm`), dan bukan bagian dari DOM lonceng:
 * ia fixed mengikuti viewport, hilang dari cetakan (no-print), dan klik judul
 * membawa ke sumber data lewat `warningTarget` — target yang sama dipakai
 * daftar notifikasi dan kartu dashboard, supaya semua tautan warning tidak
 * bisa berbeda tujuan.
 */
export function NotifikasiToast() {
  const { aktif, jumlahAntrean, tutup } = useToastNotifikasi()
  if (!aktif) return null

  const target = warningTarget(aktif)
  const Ikon = WARNING_TYPE_ICON[aktif.type]

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'no-print fixed top-4 left-1/2 z-50 w-[40rem] -translate-x-1/2',
        'max-w-[calc(100vw-2rem)]',
      )}
    >
      <div
        key={aktif.id}
        className={cn(
          'animate-slide-up rounded-xl border border-line bg-surface p-4 shadow-elev',
        )}
      >
        <HistoryRow className="items-start">
          <span
            className="mt-0.5 shrink-0 rounded-md border border-[var(--color-line-2)] bg-surface p-1"
            aria-hidden="true"
          >
            <Ikon size={14} strokeWidth={1.8} className="text-muted" />
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <Pill
                variant={SEVERITY_META[aktif.severity].variant}
                size="xs"
                bold
              >
                {SEVERITY_META[aktif.severity].label}
              </Pill>
              <span className="truncate text-[10px] font-medium uppercase tracking-wide text-muted">
                {WARNING_TYPE_LABEL[aktif.type]}
              </span>
              {aktif.region ? (
                <Pill variant="pending" shape="pill" size="xs">
                  {aktif.region}
                </Pill>
              ) : null}
            </div>

            {/* `search as never`: tipe search TanStack Router per-route; target
                ditentukan dinamis oleh warningTarget, pola yang sama dengan
                NotifikasiList */}
            <Link
              to={target.to}
              search={target.search as never}
              onClick={tutup}
              aria-label={labelSingkat(aktif)}
              className="mt-0.5 block font-semibold text-ink hover:underline"
            >
              {aktif.title}
            </Link>
            {aktif.description ? (
              <div className="text-[11px] text-muted">{aktif.description}</div>
            ) : null}
            {jumlahAntrean > 0 ? (
              <p className="mt-1 text-[10px] text-muted">
                +{jumlahAntrean} notifikasi lain mengantre
              </p>
            ) : null}
          </div>

          <Button
            variant="ghost"
            size="sm"
            aria-label="Tutup notifikasi"
            onClick={tutup}
            className="shrink-0 px-1.5 py-0.5"
          >
            <X size={14} strokeWidth={1.8} />
          </Button>
        </HistoryRow>
      </div>
    </div>
  )
}
