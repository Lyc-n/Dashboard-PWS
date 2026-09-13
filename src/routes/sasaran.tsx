import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppShell } from "@/components/organisms/AppShell";

export const Route = createFileRoute("/sasaran")({
  component: SasaranLayout,
})

function SasaranLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  )
}