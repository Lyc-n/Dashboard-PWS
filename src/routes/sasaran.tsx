import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppShell } from "@/components/organisms/AppShell";
import { requireAuth } from "@/lib/auth";

export const Route = createFileRoute("/sasaran")({
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