'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TreeDeciduous, Lock, Trophy, ChevronRight } from 'lucide-react'
import { Database, Team } from '@/types/database'

interface KOTreeBettingProps {
  userId?: string
  isLocked: boolean
}

interface KOPredictions {
  quarterFinals: (string | null)[]
  semiFinals: (string | null)[]
  final: (string | null)[]
  winner: string | null
}

interface BracketMatch {
  position: number
  team1Id: string | null
  team2Id: string | null
  winnerId: string | null
}

export function KOTreeBetting({ userId, isLocked }: KOTreeBettingProps) {
  const [teams, setTeams] = useState<Team[]>([])
  const [roundOf16, setRoundOf16] = useState<BracketMatch[]>([])
  const [predictions, setPredictions] = useState<KOPredictions>({
    quarterFinals: Array(8).fill(null),
    semiFinals: Array(4).fill(null),
    final: Array(2).fill(null),
    winner: null,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const supabase = createClientComponentClient<Database>()

  useEffect(() => {
    fetchData()
  }, [userId])

  const fetchData = async () => {
    const [teamsRes, treeRes] = await Promise.all([
      supabase.from('teams').select('*').order('name'),
      supabase.from('ko_trees').select('*').limit(1).single(),
    ])

    if (teamsRes.data) setTeams(teamsRes.data)

    if (treeRes.data) {
      const r16 = treeRes.data.round_of_16 as BracketMatch[]
      setRoundOf16(r16)
    }

    if (userId) {
      const { data: betData } = await supabase
        .from('ko_bets')
        .select('predictions')
        .eq('user_id', userId)
        .single()

      if (betData?.predictions) {
        setPredictions(betData.predictions as KOPredictions)
      }
    }

    setLoading(false)
  }

  const getTeamById = (id: string | null) => {
    if (!id) return null
    return teams.find((t) => t.id === id)
  }

  const selectWinner = (round: keyof KOPredictions, position: number, teamId: string) => {
    if (isLocked) return

    setPredictions((prev) => {
      const newPredictions = { ...prev }

      if (round === 'winner') {
        newPredictions.winner = teamId
      } else {
        const arr = [...(prev[round] as (string | null)[])]
        arr[position] = teamId
        newPredictions[round] = arr
      }

      return newPredictions
    })
  }

  const savePredictions = async () => {
    if (!userId || isLocked) return

    setSaving(true)
    const { data: existing } = await supabase
      .from('ko_bets')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (existing) {
      await supabase
        .from('ko_bets')
        .update({ predictions })
        .eq('user_id', userId)
    } else {
      const { data: tree } = await supabase
        .from('ko_trees')
        .select('id')
        .limit(1)
        .single()

      if (tree) {
        await supabase.from('ko_bets').insert({
          user_id: userId,
          ko_tree_id: tree.id,
          predictions,
        })
      }
    }

    setSaving(false)
  }

  const TeamSlot = ({
    teamId,
    onClick,
    isSelected,
    canSelect,
  }: {
    teamId: string | null
    onClick?: () => void
    isSelected?: boolean
    canSelect?: boolean
  }) => {
    const team = getTeamById(teamId)

    return (
      <button
        onClick={onClick}
        disabled={!canSelect || isLocked}
        className={`
          flex items-center gap-2 p-2 rounded border text-sm w-full
          ${isSelected ? 'bg-green-100 border-green-500' : 'bg-white border-gray-200'}
          ${canSelect && !isLocked ? 'hover:bg-gray-50 cursor-pointer' : 'cursor-default'}
          ${!team ? 'text-gray-400' : ''}
        `}
      >
        {team ? (
          <>
            <span className="text-lg">
              {team.flag_url ? (
                <img src={team.flag_url} alt="" className="w-5 h-4 object-cover rounded" />
              ) : (
                '🏳️'
              )}
            </span>
            <span className="truncate">{team.short_name}</span>
          </>
        ) : (
          <span className="text-gray-400">—</span>
        )}
      </button>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TreeDeciduous className="w-5 h-5" />
            Drzewko pucharowe
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse h-96 bg-gray-100 rounded" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TreeDeciduous className="w-5 h-5" />
          Drzewko pucharowe
          {isLocked && (
            <span className="text-xs text-red-500 flex items-center gap-1 ml-auto">
              <Lock className="w-3 h-3" />
              Zamknięte
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-[800px] flex gap-4 items-center justify-center py-4">
            {/* Round of 16 */}
            <div className="flex flex-col gap-2">
              <h4 className="text-xs font-semibold text-center text-gray-500 mb-2">1/8 finału</h4>
              {roundOf16.map((match, idx) => (
                <div key={idx} className="flex flex-col gap-1 mb-2">
                  <TeamSlot
                    teamId={match.team1Id}
                    onClick={() => match.team1Id && selectWinner('quarterFinals', idx, match.team1Id)}
                    isSelected={predictions.quarterFinals[idx] === match.team1Id}
                    canSelect={!!match.team1Id}
                  />
                  <TeamSlot
                    teamId={match.team2Id}
                    onClick={() => match.team2Id && selectWinner('quarterFinals', idx, match.team2Id)}
                    isSelected={predictions.quarterFinals[idx] === match.team2Id}
                    canSelect={!!match.team2Id}
                  />
                </div>
              ))}
            </div>

            <ChevronRight className="w-6 h-6 text-gray-300 flex-shrink-0" />

            {/* Quarter Finals */}
            <div className="flex flex-col gap-4">
              <h4 className="text-xs font-semibold text-center text-gray-500 mb-2">Ćwierćfinały</h4>
              {[0, 2, 4, 6].map((startIdx) => (
                <div key={startIdx} className="flex flex-col gap-1 mb-4">
                  <TeamSlot
                    teamId={predictions.quarterFinals[startIdx]}
                    onClick={() =>
                      predictions.quarterFinals[startIdx] &&
                      selectWinner('semiFinals', Math.floor(startIdx / 2), predictions.quarterFinals[startIdx]!)
                    }
                    isSelected={predictions.semiFinals[Math.floor(startIdx / 2)] === predictions.quarterFinals[startIdx]}
                    canSelect={!!predictions.quarterFinals[startIdx]}
                  />
                  <TeamSlot
                    teamId={predictions.quarterFinals[startIdx + 1]}
                    onClick={() =>
                      predictions.quarterFinals[startIdx + 1] &&
                      selectWinner('semiFinals', Math.floor(startIdx / 2), predictions.quarterFinals[startIdx + 1]!)
                    }
                    isSelected={predictions.semiFinals[Math.floor(startIdx / 2)] === predictions.quarterFinals[startIdx + 1]}
                    canSelect={!!predictions.quarterFinals[startIdx + 1]}
                  />
                </div>
              ))}
            </div>

            <ChevronRight className="w-6 h-6 text-gray-300 flex-shrink-0" />

            {/* Semi Finals */}
            <div className="flex flex-col gap-8">
              <h4 className="text-xs font-semibold text-center text-gray-500 mb-2">Półfinały</h4>
              {[0, 2].map((startIdx) => (
                <div key={startIdx} className="flex flex-col gap-1 mb-8">
                  <TeamSlot
                    teamId={predictions.semiFinals[startIdx]}
                    onClick={() =>
                      predictions.semiFinals[startIdx] &&
                      selectWinner('final', Math.floor(startIdx / 2), predictions.semiFinals[startIdx]!)
                    }
                    isSelected={predictions.final[Math.floor(startIdx / 2)] === predictions.semiFinals[startIdx]}
                    canSelect={!!predictions.semiFinals[startIdx]}
                  />
                  <TeamSlot
                    teamId={predictions.semiFinals[startIdx + 1]}
                    onClick={() =>
                      predictions.semiFinals[startIdx + 1] &&
                      selectWinner('final', Math.floor(startIdx / 2), predictions.semiFinals[startIdx + 1]!)
                    }
                    isSelected={predictions.final[Math.floor(startIdx / 2)] === predictions.semiFinals[startIdx + 1]}
                    canSelect={!!predictions.semiFinals[startIdx + 1]}
                  />
                </div>
              ))}
            </div>

            <ChevronRight className="w-6 h-6 text-gray-300 flex-shrink-0" />

            {/* Final */}
            <div className="flex flex-col gap-4">
              <h4 className="text-xs font-semibold text-center text-gray-500 mb-2">Finał</h4>
              <div className="flex flex-col gap-1">
                <TeamSlot
                  teamId={predictions.final[0]}
                  onClick={() =>
                    predictions.final[0] && selectWinner('winner', 0, predictions.final[0]!)
                  }
                  isSelected={predictions.winner === predictions.final[0]}
                  canSelect={!!predictions.final[0]}
                />
                <TeamSlot
                  teamId={predictions.final[1]}
                  onClick={() =>
                    predictions.final[1] && selectWinner('winner', 0, predictions.final[1]!)
                  }
                  isSelected={predictions.winner === predictions.final[1]}
                  canSelect={!!predictions.final[1]}
                />
              </div>
            </div>

            <ChevronRight className="w-6 h-6 text-gray-300 flex-shrink-0" />

            {/* Winner */}
            <div className="flex flex-col items-center gap-2">
              <h4 className="text-xs font-semibold text-center text-gray-500 mb-2">Mistrz</h4>
              <div className="p-4 bg-yellow-50 border-2 border-yellow-400 rounded-lg">
                <Trophy className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                {predictions.winner ? (
                  <div className="text-center">
                    <span className="text-2xl block mb-1">
                      {getTeamById(predictions.winner)?.flag_url ? (
                        <img
                          src={getTeamById(predictions.winner)?.flag_url || ''}
                          alt=""
                          className="w-10 h-7 mx-auto object-cover rounded"
                        />
                      ) : (
                        '🏳️'
                      )}
                    </span>
                    <span className="font-bold">{getTeamById(predictions.winner)?.name}</span>
                  </div>
                ) : (
                  <span className="text-gray-400">?</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {userId && !isLocked && (
          <div className="mt-6 flex justify-center">
            <Button onClick={savePredictions} disabled={saving} size="lg">
              {saving ? 'Zapisywanie...' : 'Zapisz drzewko'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
