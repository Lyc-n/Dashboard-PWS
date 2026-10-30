import { createFileRoute } from '@tanstack/react-router'
import { FormDesigner } from '../components/FormDesigner' // Sesuaikan path folder Anda

export const Route = createFileRoute('/form-designer')({
  component: RouteComponent,
})

function RouteComponent() {
  return <FormDesigner />
}
