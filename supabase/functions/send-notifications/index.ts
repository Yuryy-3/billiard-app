import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webpush from 'https://esm.sh/web-push@3'

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')!

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

webpush.setVapidDetails(
  `mailto:${Deno.env.get('VAPID_EMAIL')}`,
  Deno.env.get('VAPID_PUBLIC_KEY')!,
  Deno.env.get('VAPID_PRIVATE_KEY')!,
)

async function sendTelegram(chatId: number, message: string) {
  await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'HTML' }),
  })
}

Deno.serve(async (req: Request) => {
  const { user_id, match_id, type, message } = await req.json()

  // Push-уведомления
  const { data: subscriptions } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .eq('user_id', user_id)

  if (subscriptions && subscriptions.length > 0) {
    await Promise.all(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            JSON.stringify({ title: 'Виктория', body: message }),
          )
          await supabase.from('notifications').insert({
            user_id, match_id: match_id ?? null, type, channel: 'push',
          })
        } catch (_) { /* подписка устарела */ }
      }),
    )
  }

  // Telegram (для match_soon и table_assigned)
  if (type === 'match_soon' || type === 'table_assigned') {
    const { data: profile } = await supabase
      .from('profiles')
      .select('telegram_chat_id')
      .eq('id', user_id)
      .single()

    if (profile?.telegram_chat_id) {
      await sendTelegram(profile.telegram_chat_id, message)
      await supabase.from('notifications').insert({
        user_id, match_id: match_id ?? null, type, channel: 'telegram',
      })
    }
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
