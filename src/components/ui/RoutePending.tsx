/**
 * Placeholder route saat `loader`/lazy masih dimuat.
 *
 * Halaman laporan, dashboard, dan riwayat menulis paragraf yang sama dengan
 * teks berbeda; dijadikan satu supaya spacing/ukuran teksnya itu satu baku.
 */
import type { ReactNode } from 'react'

export function RoutePending({ children }: { children: ReactNode }) {
  return <p className="p-4 text-sm text-muted">{children}</p>
}
