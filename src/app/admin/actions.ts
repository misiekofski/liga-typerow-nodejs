'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateMatchResult(matchId: string, teamAScore: number, teamBScore: number) {
  const supabase = await createClient()
  
  // Verify user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return { error: 'Nie jesteś zalogowany' }
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    return { error: 'Nie masz uprawnień administratora' }
  }

  // Update match result
  const { data, error } = await supabase
    .from('matches')
    .update({
      team_a_score: teamAScore,
      team_b_score: teamBScore,
      is_finished: true,
    })
    .eq('id', matchId)
    .select()

  if (error) {
    console.error('Error updating match:', error)
    return { error: error.message }
  }

  if (!data || data.length === 0) {
    return { error: 'Nie udało się zaktualizować meczu' }
  }

  revalidatePath('/admin')
  return { success: true, data }
}
