import type { TooltipProps, Payload } from "recharts"
import { cn, fmtDate } from "@/lib/utils"

interface KegiatanTooltipProps extends TooltipProps {
    active?: boolean
    payload?: Payload[]
    label?: string
}

export function KegiatanTooltip({ active, payload, label }: KegiatanTooltipProps) {
    if (!active || !payload || !label) return null

    const entry = payload[0]?.payload as MonthlyKegiatanStat | undefined
    if (!entry) return null

    const { totalKegiatan, totalHadir, totalPeserta, pctHadir, byJenis } = entry

    return (
        <div
            className={cn(
                "rounded-lg border border-line bg-surface p-3 shadow-lg min-w-[220px]",
                "animate-slide-down"
            )}
        >
            <div className="font-semibold text-ink mb-1">{label}</div>
            <div className="grid grid-cols-2 gap-1 text-[12px] mb-2">
                <div className="text-muted">Total Kegiatan</div>
                <div className="font-medium text-ink text-right">{totalKegiatan}</div>
                <div className="text-muted">Total Peserta</div>
                <div className="font-medium text-ink text-right">{totalPeserta}</div>
                <div className="text-muted">Total Hadir</div>
                <div className="font-medium text-ink text-right">{totalHadir}</div>
                <div className="text-muted">Kehadiran</div>
                <div className="font-medium text-ink text-right">{pctHadir}%</div>
            </div>
            {byJenis.length > 0 && (
                <div className="border-t border-line pt-2">
                    <div className="text-[11px] font-semibold text-muted mb-1">Per Jenis:</div>
                    <div className="flex flex-wrap gap-1">
                        {byJenis.map(({ jenis, count }) => (
                            <span
                                key={jenis}
                                className="rounded-full bg-surface-2 px-2 py-0.5 text-[10px] text-muted"
                            >
                                {jenis}: {count}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

interface MonthlyKegiatanStat {
    month: string
    label: string
    totalKegiatan: number
    totalHadir: number
    totalPeserta: number
    pctHadir: number
    byJenis: Array<{ jenis: string; count: number }>
}