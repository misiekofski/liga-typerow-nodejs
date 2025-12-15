import { createClient } from '@/utils/supabase/server'
import { Navbar } from '@/components/layout/navbar'
import { RankingTable } from '@/components/ranking/ranking-table'

export default async function RankingPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <Navbar user={session?.user} />
      
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Ranking</h1>
        
        <RankingTable currentUserId={session?.user?.id} />
      </main>
    </div>
  )
}
