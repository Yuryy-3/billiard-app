'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single() as unknown as { data: { role: string } | null }
  if (profile?.role !== 'admin') throw new Error('Forbidden')
  return supabase
}

export async function setUserRole(userId: string, role: 'participant' | 'organizer' | 'admin') {
  const supabase = await assertAdmin()
  await (supabase.from('profiles') as unknown as { update: (v: Record<string, unknown>) => { eq: (col: string, val: string) => Promise<unknown> } })
    .update({ role })
    .eq('id', userId)
  revalidatePath('/admin/users')
}

export async function toggleBlock(userId: string, isBlocked: boolean) {
  const supabase = await assertAdmin()
  await (supabase.from('profiles') as unknown as { update: (v: Record<string, unknown>) => { eq: (col: string, val: string) => Promise<unknown> } })
    .update({ is_blocked: isBlocked })
    .eq('id', userId)
  revalidatePath('/admin/users')
}
