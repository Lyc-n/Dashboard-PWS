import { createFileRoute } from '@tanstack/react-router'
import { requireAuth } from '@/lib/auth/auth'
import { KunjunganRumahFormScene } from '@/components/kunjungan-rumah/KunjunganRumahFormScene'

export const Route = createFileRoute('/kunjungan-rumah')({
  beforeLoad: requireAuth,
  component: KunjunganRumah,
})

function KunjunganRumah() {
  return <KunjunganRumahFormScene />
}
