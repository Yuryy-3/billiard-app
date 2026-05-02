import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'not authenticated', userError })
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, role, name, phone')
    .eq('id', user.id)
    .single()

  return NextResponse.json({
    userId: user.id,
    email: user.email,
    profile,
    profileError,
  })
}
