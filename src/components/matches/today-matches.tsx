'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Calendar, Clock, Lock } from 'lucide-react'
import { format, isPast } from 'date-fns'
import { pl } from 'date-fns/locale'
import { Database } from '@/types/database'

interface TodayMatchesProps {
  userId?: string
}

type Match = Database['public']['Tables']['matches']['Row'] & {
  team_a: { name: string; short_name: string; flag_url: string | null }
  team_b: { name: string; short_name: string; flag_url: string | null }
  user_bet?: { team_a_score: number; team_b_score: number } | null
}

export function TodayMatches({ userId }: TodayMatchesProps) {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [editingBet, setEditingBet] = useState<string | null>(null)
  const [betScores, setBetScores] = useState<{ a: number; b: number }>({ a: 0, b: 0 })
  const supabase = createClient()

  useEffect(() => {
    fetchTodayMatches()
  }, [userId])

  const fetchTodayMatches = async () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const { data: matchesData, error } = await supabase
      .from('matches')
      .select(`
        *,
        team_a:teams!matches_team_a_id_fkey(name, short_name, flag_url),
        team_b:teams!matches_team_b_id_fkey(name, short_name, flag_url)
      `)
      .gte('bet_deadline', today.toISOString())
      .lt('bet_deadline', tomorrow.toISOString())
      .order('bet_deadline', { ascending: true })

    if (matchesData && userId) {
      const { data: betsData } = await supabase
        .from('bets')
        .select('match_id, team_a_score, team_b_score')
        .eq('user_id', userId)
        .in('match_id', matchesData.map(m => m.id))

      const matchesWithBets = matchesData.map(match => ({
        ...match,
        user_bet: betsData?.find(b => b.match_id === match.id) || null
      }))
      setMatches(matchesWithBets as Match[])
    } else {
      setMatches((matchesData || []) as Match[])
    }
    setLoading(false)
  }

  const saveBet = async (matchId: string) => {
    if (!userId) return

    const { error } = await supabase
      .from('bets')
      .upsert({
        user_id: userId,
        match_id: matchId,
        team_a_score: betScores.a,
        team_b_score: betScores.b,
      }, {
        onConflict: 'user_id,match_id'
      })

    if (!error) {
      setEditingBet(null)
      fetchTodayMatches()
    }
  }

  const isLocked = (deadline: string) => isPast(new Date(deadline))

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Dzisiejsze mecze
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-100 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (matches.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Dzisiejsze mecze
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-gray-500 py-8">
            Brak meczów na dziś
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Dzisiejsze mecze
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {matches.map((match) => {
          const locked = isLocked(match.bet_deadline)
          const isEditing = editingBet === match.id

          return (
            <div
              key={match.id}
              className={`p-4 rounded-lg border ${locked ? 'bg-gray-50' : 'bg-white'}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {format(new Date(match.bet_deadline), 'HH:mm', { locale: pl })}
                </span>
                {locked && (
                  <span className="text-xs text-red-500 flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    Zamknięte
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between">
                {/* Team A */}
                <div className="flex-1 text-center">
                  <div className="text-2xl mb-1">
                    {match.team_a?.flag_url ? (
                      <img src={match.team_a.flag_url} alt="" className="w-8 h-6 mx-auto object-cover rounded" />
                    ) : (
                      '🏳️'
                    )}
                  </div>
                  <p className="font-medium text-sm">{match.team_a?.short_name}</p>
                </div>

                {/* Score / Bet */}
                <div className="flex-1 text-center">
                  {match.is_finished ? (
                    <div className="text-2xl font-bold">
                      {match.team_a_score} - {match.team_b_score}
                    </div>
                  ) : isEditing && !locked ? (
                    <div className="flex items-center justify-center gap-2">
                      <Input
                        type="number"
                        min="0"
                        max="20"
                        className="w-14 text-center"
                        value={betScores.a}
                        onChange={(e) => setBetScores({ ...betScores, a: parseInt(e.target.value) || 0 })}
                      />
                      <span>-</span>
                      <Input
                        type="number"
                        min="0"
                        max="20"
                        className="w-14 text-center"
                        value={betScores.b}
                        onChange={(e) => setBetScores({ ...betScores, b: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  ) : match.user_bet ? (
                    <div className="text-xl font-semibold text-green-600">
                      {match.user_bet.team_a_score} - {match.user_bet.team_b_score}
                    </div>
                  ) : (
                    <div className="text-gray-400">- : -</div>
                  )}
                </div>

                {/* Team B */}
                <div className="flex-1 text-center">
                  <div className="text-2xl mb-1">
                    {match.team_b?.flag_url ? (
                      <img src={match.team_b.flag_url} alt="" className="w-8 h-6 mx-auto object-cover rounded" />
                    ) : (
                      '🏳️'
                    )}
                  </div>
                  <p className="font-medium text-sm">{match.team_b?.short_name}</p>
                </div>
              </div>

              {/* Actions */}
              {userId && !locked && !match.is_finished && (
                <div className="mt-3 flex justify-center gap-2">
                  {isEditing ? (
                    <>
                      <Button size="sm" onClick={() => saveBet(match.id)}>
                        Zapisz
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingBet(null)}>
                        Anuluj
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingBet(match.id)
                        setBetScores({
                          a: match.user_bet?.team_a_score || 0,
                          b: match.user_bet?.team_b_score || 0
                        })
                      }}
                    >
                      {match.user_bet ? 'Zmień typ' : 'Typuj'}
                    </Button>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
