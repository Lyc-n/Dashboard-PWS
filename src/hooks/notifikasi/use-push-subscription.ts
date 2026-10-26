import { useCallback, useState } from 'react'
import { simpanPushSubscriptionFn } from '@/lib/api/server-fns'

export function usePushSubscription() {
  const [status, setStatus] = useState<
    'idle' | 'granted' | 'denied' | 'unsupported'
  >('idle')

  const aktifkan = useCallback(async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setStatus('unsupported')
      return
    }
    const perm = await Notification.requestPermission()
    if (perm !== 'granted') {
      setStatus('denied')
      return
    }
    const reg = await navigator.serviceWorker.register('/sw.js')
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: import.meta.env.VITE_VAPID_PUBLIC_KEY,
    })
    const json = sub.toJSON() as any
    await simpanPushSubscriptionFn({
      data: {
        endpoint: json.endpoint,
        keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
        userAgent: navigator.userAgent,
      },
    })
    setStatus('granted')
  }, [])

  return { status, aktifkan }
}
