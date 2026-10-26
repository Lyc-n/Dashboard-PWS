import { createFileRoute } from '@tanstack/react-router'
import { jalankanPengirimanNotifikasiCron } from '@/lib/api/server-fns'

export const Route = createFileRoute('/cron/notifikasi')({
  loader: async () => await jalankanPengirimanNotifikasiCron(),
  component: () => null,
})
