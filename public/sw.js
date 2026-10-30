/**
 * Service worker notifikasi Dashboard PWS.
 *
 * Tugasnya dua: menampilkan push yang datang dari cron (`/cron/notifikasi`) dan
 * membuka aplikasi saat notifikasinya diketuk. Sengaja tanpa cache/precache -
 * ini bukan PWA offline, caching di sini hanya akan menyajikan versi basi.
 *
 * Skrip ini file statis di `public/`, jadi tidak lewat bundler: jangan pakai
 * import atau sintaks yang butuh kompilasi.
 */

self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('push', (event) => {
  // Dibaca sekali sebagai teks lalu di-parse sendiri: `event.data.json()`
  // menghabiskan body, jadi `event.data.text()` sebagai cadangan akan gagal.
  const teks = event.data ? event.data.text() : ''
  let data = {}
  try {
    data = teks ? JSON.parse(teks) : {}
  } catch {
    data = { body: teks }
  }

  const title = data.title || 'Dashboard PWS'
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || '',
      data: { url: data.url || '/' },
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = (event.notification.data && event.notification.data.url) || '/'

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then(async (list) => {
        // Fokuskan tab aplikasi yang sudah terbuka; jangan buka tab baru kalau
        // dashboard-nya sebenarnya masih hidup di background. Tab yang dibuka
        // di halaman lain ikut diarahkan ke tujuan notifikasi.
        for (const client of list) {
          if (
            client.url.startsWith(self.location.origin) &&
            'focus' in client
          ) {
            if ('navigate' in client) {
              try {
                await client.navigate(url)
              } catch {
                // Navigasi bisa ditolak (mis. form belum tersimpan); fokus saja.
              }
            }
            return client.focus()
          }
        }
        if (self.clients.openWindow) return self.clients.openWindow(url)
        return undefined
      }),
  )
})
