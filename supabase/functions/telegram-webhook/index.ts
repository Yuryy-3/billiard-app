import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')!

async function sendTelegramMessage(chatId: number, text: string) {
  await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
  })
}

Deno.serve(async (req: Request) => {
  const body = await req.json()
  const message = body?.message
  if (!message) return new Response('ok')

  const chatId: number = message.chat.id
  const text: string = message.text ?? ''

  if (!text.startsWith('/start ')) {
    await sendTelegramMessage(chatId, 'Этот бот отправляет уведомления о турнирах бильярдного клуба Виктория.')
    return new Response('ok')
  }

  const token = text.slice('/start '.length).trim()

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const { data: linkToken } = await supabase
    .from('telegram_link_tokens')
    .select('user_id, expires_at')
    .eq('token', token)
    .single()

  if (!linkToken || new Date(linkToken.expires_at) < new Date()) {
    await sendTelegramMessage(chatId, '❌ Ссылка устарела или недействительна. Попробуйте снова в приложении.')
    return new Response('ok')
  }

  await supabase
    .from('profiles')
    .update({ telegram_chat_id: chatId })
    .eq('id', linkToken.user_id)

  await supabase
    .from('telegram_link_tokens')
    .delete()
    .eq('token', token)

  await sendTelegramMessage(chatId, '✅ <b>Уведомления подключены!</b>\n\nТеперь вы будете получать сообщения о начале матчей и назначении стола.')

  return new Response('ok')
})
