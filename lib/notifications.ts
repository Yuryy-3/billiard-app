import type { Database } from '@/lib/supabase/types'

type PushInsert = Database['public']['Tables']['push_subscriptions']['Insert']

export async function subscribeToPush(userId: string) {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return null

  const registration = await navigator.serviceWorker.ready
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey) as unknown as string,
  })

  const sub = subscription.toJSON()

  const { createClient } = await import('@/lib/supabase/client')
  const supabase = createClient()
  const record: PushInsert = {
    user_id: userId,
    endpoint: sub.endpoint!,
    p256dh: sub.keys!.p256dh,
    auth: sub.keys!.auth,
  }
  await supabase.from('push_subscriptions').upsert(record as never, { onConflict: 'endpoint' })

  return subscription
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from(Array.from(rawData).map(char => char.charCodeAt(0)))
}
