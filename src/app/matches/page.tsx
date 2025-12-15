import { createClient } from '@/utils/supabase/server'
import { Navbar } from '@/components/layout/navbar'
import { MatchesList } from '@/components/matches/matches-list'

export default async function MatchesPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <Navbar user={session?.user} />
      
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Mecze</h1>
        
        <MatchesList userId={session?.user?.id} />
      </main>
    </div>
  )
}
