import { ProgressBar } from '@/components/atoms'

export interface KelStat {
  kel: string
  n: number
  pct: number
}

export interface KelStatsGridProps {
  stats: KelStat[]
  unit: string
}

export function KelStatsGrid({ stats, unit }: KelStatsGridProps) {
  return (
    <div className="mt-3 grid grid-cols-4 gap-3 max-md:grid-cols-2 max-sm:grid-cols-1">
      {stats.map((s) => (
        <div
          key={s.kel}
          className="rounded-[10px] border border-[var(--color-line-2)] bg-surface p-3.5 shadow-card"
        >
          <div className="text-xs font-semibold text-ink">Kel. {s.kel}</div>
          <div className="mt-0.5 text-[11px] text-muted">
            {s.n} {unit}
          </div>
          <ProgressBar value={s.pct} className="mt-2" />
        </div>
      ))}
    </div>
  )
}
