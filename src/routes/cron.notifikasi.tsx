/**
 * Endpoint cron pengiriman notifikasi.
 *
 * Satu-satunya server route di repo ini, dan sengaja begitu: cron Vercel hanya
 * bisa memanggil URL, sedangkan `createServerFn` hidup di protokol RPC yang
 * butuh konteks router. Handler ini tetap tipis - logikanya di `cron.server.ts`.
 *
 * Kenapa handler, bukan loader: loader yang melempar dirender jadi halaman
 * error SSR (500), padahal pemanggilnya mesin cron, bukan browser. Dengan
 * handler, secret salah dibalas 401 JSON bersih, dan hasilnya selalu JSON -
 * tidak ada HTML yang sia-sia dirender untuk setiap hit cron.
 *
 * Secret dibaca dari header `Authorization: Bearer <CRON_SECRET>` (cara Vercel)
 * ATAU `?secret=<CRON_SECRET>` (cara uji manual). Dijadwalkan di `vercel.json`;
 * jadwal Vercel memakai UTC, jadi `0 7 * * *` = 14.00 WIB.
 */

import { createFileRoute } from '@tanstack/react-router'
import {
  jalankanCronNotifikasi,
  secretCronCocok,
} from '@/lib/server/notifikasi/cron.server'

export const Route = createFileRoute('/cron/notifikasi')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!secretCronCocok(request)) {
          return Response.json({ error: 'secret tidak valid' }, { status: 401 })
        }
        const hasil = await jalankanCronNotifikasi()
        return Response.json(hasil)
      },
    },
  },
})
