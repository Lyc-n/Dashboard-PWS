import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Dot,
} from 'recharts'
import { useNavigate } from '@tanstack/react-router'
import { KegiatanTooltip } from './KegiatanTrendTooltip'
import type { MonthlyKegiatanStat } from './useKegiatanTrend'

interface KegiatanTrendChartProps {
  data: MonthlyKegiatanStat[]
  loading?: boolean
}

export function KegiatanTrendChart({ data, loading }: KegiatanTrendChartProps) {
  const navigate = useNavigate()

  if (loading) {
    return (
      <div className="h-[280px] flex items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-muted">
          <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Memuat trend kegiatan…
        </div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="h-[280px] flex items-center justify-center">
        <p className="text-sm text-muted">
          Belum ada data kegiatan untuk 12 bulan terakhir
        </p>
      </div>
    )
  }

  const handleClick = (month: string) => {
    navigate({ to: '/laporan', search: { period: month, section: 'kegiatan' } })
  }

  const maxKegiatan = Math.max(...data.map((d) => d.totalKegiatan), 1)

  return (
    <div
      className="h-[280px]"
      onClick={(e) => {
        const rect = e.currentTarget.getBoundingClientRect()
        const x = e.clientX - rect.left
        const width = rect.width
        const index = Math.round((x / width) * (data.length - 1))
        const clampedIndex = Math.max(0, Math.min(data.length - 1, index))
        const entry = data[clampedIndex]
        if (entry) handleClick(entry.month)
      }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 10, right: 30, left: 10, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--color-line)"
            vertical={false}
          />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: 'var(--color-muted)' }}
            axisLine={{ stroke: 'var(--color-line)' }}
            tickLine={false}
            interval={0}
          />
          <YAxis
            tick={{ fontSize: 11, fill: 'var(--color-muted)' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v)}
            domain={[0, maxKegiatan * 1.3]}
          />
          <Tooltip
            content={(props) => (
              // recharts mengoper seluruh props Tooltip; spreading
              // semuanya membawa field yang tidak dikenal type tooltip ini.
              <KegiatanTooltip
                active={props.active}
                payload={props.payload}
                label={
                  typeof props.label === 'string' ? props.label : undefined
                }
              />
            )}
            cursor={{ strokeDasharray: '3 3', stroke: 'var(--color-muted)' }}
            formatter={(value) => [value ?? 0, 'Kegiatan']}
          />
          <Line
            type="monotone"
            dataKey="totalKegiatan"
            stroke="var(--color-accent)"
            strokeWidth={2.5}
            dot={false}
            activeDot={{
              r: 6,
              fill: 'var(--color-accent)',
              stroke: 'var(--color-surface)',
              strokeWidth: 2,
            }}
          />
          {data.map((entry) => (
            <Dot
              key={entry.month}
              cx={0}
              cy={0}
              r={10}
              fill="transparent"
              onClick={(_props, event) => {
                event.stopPropagation()
                handleClick(entry.month)
              }}
              className="cursor-pointer"
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
