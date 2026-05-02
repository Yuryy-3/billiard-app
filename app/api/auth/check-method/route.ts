import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { email } = await req.json()
  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'email required' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data, error } = await supabase.rpc('user_has_password', { user_email: email })
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // data === null → пользователь не найден (новый)
  // data === false → аккаунт без пароля
  // data === true → есть пароль
  const method = data === true ? 'password' : 'otp'
  return NextResponse.json({ method })
}
