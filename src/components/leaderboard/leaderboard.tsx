'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Trophy, Medal } from 'lucide-react'
import { Database } from '@/types/database'

type RankingWithProfile = Database['public']['Tables']['rankings']['Row'] & {
  profiles: { username: string | null; avatar_url: string | null }
}

export function Leaderboard() {
  const [rankings, setRankings] = useState<RankingWithProfile[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient<Database>()

  useEffect(() => {
    fetchRankings()

    const channel = supabase
      .channel('rankings-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rankings' }, () => {
        fetchRankings()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchRankings = async () => {
    const { data, error } = await supabase
      .from('rankings')
      .select(`
        *,
        profiles(username, avatar_url)
      `)
      .order('total_points', { ascending: false })
      .limit(10)

    if (data) {
      setRankings(data as RankingWithProfile[])
    }
    setLoading(false)
  }

  const getMedalColor = (position: number) => {
    switch (position) {
      case 0: return 'text-yellow-500'
      case 1: return 'text-gray-400'
      case 2: return 'text-amber-600'
      default: return 'text-gray-300'
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Ranking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-12 bg-gray-100 rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          Ranking
        </CardTitle>
      </CardHeader>
      <CardContent>
        {rankings.length === 0 ? (
          <p className="text-center text-gray-500 py-4">
            Brak danych w rankingu
          </p>
        ) : (
          <div className="space-y-2">
            {rankings.map((rank, index) => (
              <div
                key={rank.id}
                className={`flex items-center gap-3 p-3 rounded-lg ${
                  index < 3 ? 'bg-gradient-to-r from-green-50 to-white' : 'bg-gray-50'
                }`}
              >
                <div className="w-8 text-center">
                  {index < 3 ? (
                    <Medal className={`w-6 h-6 mx-auto ${getMedalColor(index)}`} />
                  ) : (
                    <span className="text-gray-500 font-medium">{index + 1}</span>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {rank.profiles?.username || 'Anonim'}
                  </p>
                </div>
                
                <div className="text-right">
                  <p className="font-bold text-green-600">{rank.total_points}</p>
                  <p className="text-xs text-gray-500">pkt</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
