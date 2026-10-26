import webpush from 'web-push'
import { db } from '@/lib/server/db.server'
import { pushSubscriptions } from '@/lib/schema/schema'
import { eq } from 'drizzle-orm'

export interface PushSubscriptionInput {
  endpoint: string
  keys: { p256dh: string; auth: string }
  userAgent?: string
}

export async function simpanPushSubscription(input: PushSubscriptionInput) {
  await db
    .insert(pushSubscriptions)
    .values({
      endpoint: input.endpoint,
      p256dh: input.keys.p256dh,
      auth: input.keys.auth,
      userAgent: input.userAgent ?? null,
    })
    .onConflictDoUpdate({
      target: pushSubscriptions.endpoint,
      set: {
        p256dh: input.keys.p256dh,
        auth: input.keys.auth,
        userAgent: input.userAgent ?? null,
        lastUsedAt: new Date(),
      },
    })
}

export async function hapusPushSubscription(endpoint: string) {
  await db
    .delete(pushSubscriptions)
    .where(eq(pushSubscriptions.endpoint, endpoint))
}

export async function listPushSubscriptions() {
  return db.select().from(pushSubscriptions)
}

export function konfigurasiWebPush() {
  const publicKey = process.env.VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  const subject = process.env.VAPID_SUBJECT ?? 'mailto:admin@localhost'
  if (!publicKey || !privateKey) return false
  webpush.setVapidDetails(subject, publicKey, privateKey)
  return true
}

export async function kirimPushKeSemua(payload: object) {
  if (!konfigurasiWebPush()) return { terkirim: 0, gagal: 0 }
  const subs = await listPushSubscriptions()
  let terkirim = 0
  let gagal = 0
  for (const s of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        JSON.stringify(payload),
      )
      terkirim++
      await db
        .update(pushSubscriptions)
        .set({ lastUsedAt: new Date() })
        .where(eq(pushSubscriptions.endpoint, s.endpoint))
    } catch (err: any) {
      gagal++
      if (err?.statusCode === 410 || err?.statusCode === 404) {
        await hapusPushSubscription(s.endpoint)
      }
    }
  }
  return { terkirim, gagal }
}
