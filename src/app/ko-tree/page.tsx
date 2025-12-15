import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Navbar } from '@/components/layout/navbar'
import { KOTreeBetting } from '@/components/ko-tree/ko-tree-betting'

const KO_TREE_DEADLINE = new Date('2024-06-29T18:00:00')

export default async function KOTreePage() {
  const supabase = createServerComponentClient({ cookies })
  const { data: { session } } = await supabase.auth.getSession()

  const isLocked = new Date() > KO_TREE_DEADLINE

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <Navbar user={session?.user} />
      
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Drzewko pucharowe</h1>
        
        <KOTreeBetting userId={session?.user?.id} isLocked={isLocked} />
      </main>
    </div>
  )
}
