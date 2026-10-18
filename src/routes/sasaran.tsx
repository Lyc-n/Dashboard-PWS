import { createFileRoute, Outlet } from '@tanstack/react-router'
import { AppShell } from '@/components/layout'
import { requireAuth } from '@/lib/auth/auth'

export const Route = createFileRoute('/sasaran')({
  beforeLoad: requireAuth,
  component: SasaranLayout,
})

function SasaranLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  )
}
