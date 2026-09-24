import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/pin')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/pin"!</div>
}
