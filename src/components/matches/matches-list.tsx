'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Calendar, Clock, Lock, Check, X } from 'lucide-react'
import { format, isPast } from 'date-fns'
import { pl } from 'date-fns/locale'
import { Database } from '@/types/database'

interface MatchesListProps {
  userId?: string
}

type Match = Database['public']['Tables']['matches']['Row'] & {
  team_a: { name: string; short_name: string; flag_url: string | null }
  team_b: { name: string; short_name: string; flag_url: string | null }
  user_bet?: { team_a_score: number; team_b_score: number; points_awarded: number } | null
}

const GROUPS = ['A', 'B', 'C', 'D', 'E', 'F']

export function MatchesList({ userId }: MatchesListProps) {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [activeGroup, setActiveGroup] = useState<string | null>(null)
  const [editingBet, setEditingBet] = useState<string | null>(null)
  const [betScores, setBetScores] = useState<{ a: number; b: number }>({ a: 0, b: 0 })
  const supabase = createClientComponentClient<Database>()

  useEffect(() => {
    fetchMatches()
  }, [userId, activeGroup])

  const fetchMatches = async () => {
    setLoading(true)
    let query = supabase
      .from('matches')
      .select(`
        *,
        team_a:teams!matches_team_a_id_fkey(name, short_name, flag_url),
        team_b:teams!matches_team_b_id_fkey(name, short_name, flag_url)
      `)
      .order('bet_deadline', { ascending: true })

    if (activeGroup !== null) {
      const groupNum = GROUPS.indexOf(activeGroup) + 1
      query = query.eq('group_number', groupNum)
    }

    const { data: matchesData } = await query

    if (matchesData && userId) {
      const { data: betsData } = await supabase
        .from('bets')
        .select('match_id, team_a_score, team_b_score, points_awarded')
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

    await supabase
      .from('bets')
      .upsert({
        user_id: userId,
        match_id: matchId,
        team_a_score: betScores.a,
        team_b_score: betScores.b,
      }, {
        onConflict: 'user_id,match_id'
      })

    setEditingBet(null)
    fetchMatches()
  }

  const isLocked = (deadline: string) => isPast(new Date(deadline))

  const getPointsColor = (points: number) => {
    if (points >= 5) return 'text-green-600 bg-green-100'
    if (points > 0) return 'text-yellow-600 bg-yellow-100'
    return 'text-gray-500 bg-gray-100'
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-2 flex-wrap mb-4">
          {GROUPS.map(g => (
            <div key={g} className="h-10 w-16 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
        {[1, 2, 3].map(i => (
          <div key={i} className="h-32 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Group Filter */}
      <div className="flex gap-2 flex-wrap mb-6">
        <Button
          variant={activeGroup === null ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveGroup(null)}
        >
          Wszystkie
        </Button>
        {GROUPS.map(g => (
          <Button
            key={g}
            variant={activeGroup === g ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveGroup(g)}
          >
            Grupa {g}
          </Button>
        ))}
      </div>

      {/* Matches */}
      {matches.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            Brak meczów do wyświetlenia
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {matches.map((match) => {
            const locked = isLocked(match.bet_deadline)
            const isEditing = editingBet === match.id

            return (
              <Card key={match.id} className={locked ? 'bg-gray-50' : ''}>
                <CardContent className="p-4">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-3 text-xs text-gray-500">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(match.bet_deadline), 'd MMM yyyy', { locale: pl })}
                      <Clock className="w-3 h-3 ml-2" />
                      {format(new Date(match.bet_deadline), 'HH:mm')}
                    </div>
                    <div className="flex items-center gap-2">
                      {match.phase && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                          {match.phase}
                        </span>
                      )}
                      {locked && (
                        <span className="flex items-center gap-1 text-red-500">
                          <Lock className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Match */}
                  <div className="flex items-center justify-between">
                    {/* Team A */}
                    <div className="flex-1 flex items-center gap-3">
                      <div className="text-2xl">
                        {match.team_a?.flag_url ? (
                          <img src={match.team_a.flag_url} alt="" className="w-10 h-7 object-cover rounded" />
                        ) : '🏳️'}
                      </div>
                      <div>
                        <p className="font-semibold">{match.team_a?.short_name}</p>
                        <p className="text-xs text-gray-500 hidden sm:block">{match.team_a?.name}</p>
                      </div>
                    </div>

                    {/* Score / Bet */}
                    <div className="flex-shrink-0 mx-4 text-center min-w-[120px]">
                      {match.is_finished ? (
                        <div>
                          <div className="text-2xl font-bold">
                            {match.team_a_score} - {match.team_b_score}
                          </div>
                          {match.user_bet && (
                            <div className="mt-1 text-sm">
                              <span className="text-gray-500">Twój typ: </span>
                              <span className="font-medium">
                                {match.user_bet.team_a_score} - {match.user_bet.team_b_score}
                              </span>
                              <span className={`ml-2 px-2 py-0.5 rounded text-xs ${getPointsColor(match.user_bet.points_awarded)}`}>
                                +{match.user_bet.points_awarded} pkt
                              </span>
                            </div>
                          )}
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
                          <span className="font-bold">:</span>
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
                          <Check className="w-4 h-4 inline ml-1" />
                        </div>
                      ) : (
                        <div className="text-gray-400 text-xl">- : -</div>
                      )}
                    </div>

                    {/* Team B */}
                    <div className="flex-1 flex items-center gap-3 justify-end">
                      <div className="text-right">
                        <p className="font-semibold">{match.team_b?.short_name}</p>
                        <p className="text-xs text-gray-500 hidden sm:block">{match.team_b?.name}</p>
                      </div>
                      <div className="text-2xl">
                        {match.team_b?.flag_url ? (
                          <img src={match.team_b.flag_url} alt="" className="w-10 h-7 object-cover rounded" />
                        ) : '🏳️'}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  {userId && !locked && !match.is_finished && (
                    <div className="mt-3 flex justify-center gap-2">
                      {isEditing ? (
                        <>
                          <Button size="sm" onClick={() => saveBet(match.id)}>
                            <Check className="w-4 h-4 mr-1" />
                            Zapisz
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingBet(null)}>
                            <X className="w-4 h-4 mr-1" />
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
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
