import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { Navbar } from '@/components/layout/navbar'
import { TodayMatches } from '@/components/matches/today-matches'
import { Leaderboard } from '@/components/leaderboard/leaderboard'
import { Trophy, Calendar, Users } from 'lucide-react'

export default async function Home() {
  const supabase = createServerComponentClient({ cookies })
  const { data: { session } } = await supabase.auth.getSession()

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <Navbar user={session?.user} />
      
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <section className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Liga Typerow ⚽
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Typuj wyniki meczów, zdobywaj punkty i rywalizuj ze znajomymi!
          </p>
        </section>

        {/* Stats Cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-xl shadow-sm border p-6 flex items-center gap-4">
            <div className="bg-green-100 p-3 rounded-lg">
              <Trophy className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Twoje punkty</p>
              <p className="text-2xl font-bold">
                {session ? '0' : '-'}
              </p>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border p-6 flex items-center gap-4">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Dzisiejsze mecze</p>
              <p className="text-2xl font-bold">0</p>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border p-6 flex items-center gap-4">
            <div className="bg-purple-100 p-3 rounded-lg">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Graczy</p>
              <p className="text-2xl font-bold">0</p>
            </div>
          </div>
        </section>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Today's Matches */}
          <div className="lg:col-span-2">
            <TodayMatches userId={session?.user?.id} />
          </div>
          
          {/* Leaderboard */}
          <div>
            <Leaderboard />
          </div>
        </div>
      </main>
    </div>
  )
}
