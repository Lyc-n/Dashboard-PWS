import { LogoEmblem } from '@/components/atoms'
import { APP_BRAND } from '@/lib/constants'
import { BRAND_ADDRESS, TODAY } from './report-shared'

export interface KopBrandRowProps {
  className?: string
}

export function KopBrandRow({
  className = 'flex items-start justify-between gap-3',
}: KopBrandRowProps) {
  return (
    <div className={className}>
      <div className="flex items-center gap-2.5">
        <LogoEmblem />
        <div className="text-[11px] leading-tight">
          <b className="block text-ink">
            {APP_BRAND.name}{' '}
            <span className="font-semibold">{APP_BRAND.region}</span>
          </b>
          <span className="text-muted">{BRAND_ADDRESS}</span>
        </div>
      </div>
      <span className="text-[10px] text-muted">Dicetak: {TODAY}</span>
    </div>
  )
}
