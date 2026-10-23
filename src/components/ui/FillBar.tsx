import { ProgressBar } from './ProgressBar'
import { cn, CARD_SHELL } from '@/lib/utils'

export interface FillBarProps {
  label?: string
  pct: number
}

export function FillBar({ label = 'Kelengkapan form', pct }: FillBarProps) {
  return (
    <div
      aria-live="polite"
      className={cn('mt-3.5', CARD_SHELL, 'p-3 shadow-elev')}
    >
      <div className="flex justify-between text-xs font-semibold text-muted">
        <span>{label}</span>
        <strong className="text-ink">{pct}%</strong>
      </div>
      <ProgressBar value={pct} size="md" className="mt-2" />
    </div>
  )
}
