import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const token = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).from('telegram_link_tokens').insert({
    user_id: user.id,
    token,
    expires_at: expiresAt,
  })

  const botUsername = process.env.TELEGRAM_BOT_USERNAME
  const url = `https://t.me/${botUsername}?start=${token}`

  return NextResponse.json({ url })
}
