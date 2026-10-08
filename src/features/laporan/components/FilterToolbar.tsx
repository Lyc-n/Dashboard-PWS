import type { ReactNode } from 'react'
import { SectionCard, Toolbar } from '@/components/molecules'

export interface FilterToolbarProps {
  title: string
  sub: string
  children: ReactNode
}

export function FilterToolbar({ title, sub, children }: FilterToolbarProps) {
  return (
    <SectionCard className="no-print" title={title} sub={sub}>
      <Toolbar>{children}</Toolbar>
    </SectionCard>
  )
}
