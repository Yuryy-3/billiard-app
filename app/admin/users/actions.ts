'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  const { data: profileData } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const profile = profileData as { role: string } | null
  if (profile?.role !== 'admin') throw new Error('Forbidden')
  return supabase
}

export async function setUserRole(userId: string, role: 'participant' | 'organizer' | 'admin') {
  const supabase = await assertAdmin()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).from('profiles').update({ role }).eq('id', userId)
  revalidatePath('/admin/users')
}

export async function toggleBlock(userId: string, isBlocked: boolean) {
  const supabase = await assertAdmin()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).from('profiles').update({ is_blocked: isBlocked }).eq('id', userId)
  revalidatePath('/admin/users')
}
