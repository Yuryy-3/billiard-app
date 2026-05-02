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

export async function setTournamentStatus(
  tournamentId: string,
  status: 'draft' | 'open' | 'closed' | 'ongoing' | 'finished'
) {
  const supabase = await assertAdmin()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).from('tournaments').update({ status }).eq('id', tournamentId)
  revalidatePath('/admin/tournaments')
}

export async function deleteTournament(tournamentId: string) {
  const supabase = await assertAdmin()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).from('tournaments').delete().eq('id', tournamentId)
  revalidatePath('/admin/tournaments')
}
