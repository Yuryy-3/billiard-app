import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webpush from 'https://esm.sh/web-push@3'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

webpush.setVapidDetails(
  `mailto:${Deno.env.get('VAPID_EMAIL')}`,
  Deno.env.get('VAPID_PUBLIC_KEY')!,
  Deno.env.get('VAPID_PRIVATE_KEY')!,
)

Deno.serve(async (req: Request) => {
  const { user_id, match_id, type, message } = await req.json()

  const { data: subscriptions } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .eq('user_id', user_id)

  if (subscriptions && subscriptions.length > 0) {
    await Promise.all(
      subscriptions.map(async (sub) => {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          JSON.stringify({ title: message, body: message }),
        )
        await supabase.from('notifications').insert({
          user_id,
          match_id: match_id ?? null,
          type,
          channel: 'push',
        })
      }),
    )
  }

  if (type === 'match_soon' || type === 'table_assigned') {
    const { data: profile } = await supabase
      .from('profiles')
      .select('phone')
      .eq('id', user_id)
      .single()

    if (profile?.phone) {
      const smscLogin = Deno.env.get('SMSC_LOGIN')!
      const smscPassword = Deno.env.get('SMSC_PASSWORD')!
      const phone = encodeURIComponent(profile.phone)
      const mes = encodeURIComponent(message)

      await fetch(
        `https://smsc.ru/sys/send.php?login=${smscLogin}&psw=${smscPassword}&phones=${phone}&mes=${mes}&fmt=3`,
      )

      await supabase.from('notifications').insert({
        user_id,
        match_id: match_id ?? null,
        type,
        channel: 'sms',
      })
    }
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
