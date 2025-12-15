'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Trophy, Medal, Target, TreeDeciduous, Star } from 'lucide-react'
import { Database } from '@/types/database'

interface RankingTableProps {
  currentUserId?: string
}

type RankingWithProfile = Database['public']['Tables']['rankings']['Row'] & {
  profiles: { username: string | null; avatar_url: string | null }
}

export function RankingTable({ currentUserId }: RankingTableProps) {
  const [rankings, setRankings] = useState<RankingWithProfile[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchRankings()

    const channel = supabase
      .channel('rankings-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rankings' }, () => {
        fetchRankings()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchRankings = async () => {
    const { data } = await supabase
      .from('rankings')
      .select(`
        *,
        profiles(username, avatar_url)
      `)
      .order('total_points', { ascending: false })

    if (data) {
      setRankings(data as RankingWithProfile[])
    }
    setLoading(false)
  }

  const getMedalIcon = (position: number) => {
    switch (position) {
      case 0:
        return <Medal className="w-6 h-6 text-yellow-500" />
      case 1:
        return <Medal className="w-6 h-6 text-gray-400" />
      case 2:
        return <Medal className="w-6 h-6 text-amber-600" />
      default:
        return <span className="w-6 h-6 flex items-center justify-center text-gray-500 font-medium">{position + 1}</span>
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Tabela wyników
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="h-16 bg-gray-100 rounded" />
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
          Tabela wyników
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Header */}
        <div className="hidden md:grid grid-cols-7 gap-4 px-4 py-2 text-xs font-medium text-gray-500 border-b">
          <div className="col-span-2">Gracz</div>
          <div className="text-center flex items-center justify-center gap-1">
            <Target className="w-3 h-3" />
            Mecze
          </div>
          <div className="text-center flex items-center justify-center gap-1">
            <Star className="w-3 h-3" />
            Strzelec
          </div>
          <div className="text-center flex items-center justify-center gap-1">
            <TreeDeciduous className="w-3 h-3" />
            Drzewko
          </div>
          <div className="text-center">Bonus</div>
          <div className="text-center font-bold">Suma</div>
        </div>

        {/* Rows */}
        <div className="divide-y">
          {rankings.map((rank, index) => (
            <div
              key={rank.id}
              className={`
                grid grid-cols-3 md:grid-cols-7 gap-4 px-4 py-3 items-center
                ${currentUserId === rank.user_id ? 'bg-green-50 border-l-4 border-green-500' : ''}
                ${index < 3 ? 'bg-gradient-to-r from-yellow-50/50 to-transparent' : ''}
              `}
            >
              {/* Position & Name */}
              <div className="col-span-2 flex items-center gap-3">
                <div className="flex-shrink-0">
                  {getMedalIcon(index)}
                </div>
                <div>
                  <p className="font-medium">
                    {rank.profiles?.username || 'Anonim'}
                  </p>
                  {currentUserId === rank.user_id && (
                    <span className="text-xs text-green-600">To Ty!</span>
                  )}
                </div>
              </div>

              {/* Match Points - Mobile shows total only */}
              <div className="hidden md:block text-center text-sm">
                {rank.match_points}
              </div>

              {/* Scorer Points */}
              <div className="hidden md:block text-center text-sm">
                {rank.scorer_points}
              </div>

              {/* KO Points */}
              <div className="hidden md:block text-center text-sm">
                {rank.ko_points}
              </div>

              {/* Bonus */}
              <div className="hidden md:block text-center text-sm">
                {rank.bonus_points}
              </div>

              {/* Total */}
              <div className="text-center md:text-right">
                <span className="text-xl font-bold text-green-600">
                  {rank.total_points}
                </span>
                <span className="text-xs text-gray-500 ml-1">pkt</span>
              </div>
            </div>
          ))}
        </div>

        {rankings.length === 0 && (
          <p className="text-center text-gray-500 py-8">
            Brak danych w rankingu
          </p>
        )}
      </CardContent>
    </Card>
  )
}
