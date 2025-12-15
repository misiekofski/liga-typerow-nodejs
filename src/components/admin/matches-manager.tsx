'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Save, X, Check } from 'lucide-react'
import { format } from 'date-fns'
import { Database } from '@/types/database'

type Team = Database['public']['Tables']['teams']['Row']
type Match = Database['public']['Tables']['matches']['Row'] & {
  team_a: Team
  team_b: Team
}

interface MatchesManagerProps {
  showResultsOnly?: boolean
}

const PHASES = [
  { value: 'group', label: 'Faza grupowa' },
  { value: 'round_of_16', label: '1/8 finału' },
  { value: 'quarter_final', label: 'Ćwierćfinał' },
  { value: 'semi_final', label: 'Półfinał' },
  { value: 'third_place', label: 'Mecz o 3. miejsce' },
  { value: 'final', label: 'Finał' },
]

export function MatchesManager({ showResultsOnly = false }: MatchesManagerProps) {
  const [matches, setMatches] = useState<Match[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingResultId, setEditingResultId] = useState<string | null>(null)
  const [resultScores, setResultScores] = useState({ a: 0, b: 0 })
  const [newMatch, setNewMatch] = useState({
    team_a_id: '',
    team_b_id: '',
    phase: 'group',
    group_number: 1,
    bet_deadline: '',
  })
  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const [matchesRes, teamsRes] = await Promise.all([
      supabase
        .from('matches')
        .select(`
          *,
          team_a:teams!matches_team_a_id_fkey(*),
          team_b:teams!matches_team_b_id_fkey(*)
        `)
        .order('bet_deadline', { ascending: true }),
      supabase.from('teams').select('*').order('name'),
    ])

    if (matchesRes.data) {
      setMatches(matchesRes.data as Match[])
    }
    if (teamsRes.data) {
      setTeams(teamsRes.data)
    }
    setLoading(false)
  }

  const handleAddMatch = async () => {
    if (!newMatch.team_a_id || !newMatch.team_b_id || !newMatch.bet_deadline) return

    const { error } = await supabase.from('matches').insert({
      team_a_id: newMatch.team_a_id,
      team_b_id: newMatch.team_b_id,
      phase: newMatch.phase,
      group_number: newMatch.phase === 'group' ? newMatch.group_number : null,
      bet_deadline: new Date(newMatch.bet_deadline).toISOString(),
    })

    if (!error) {
      setNewMatch({
        team_a_id: '',
        team_b_id: '',
        phase: 'group',
        group_number: 1,
        bet_deadline: '',
      })
      setShowAddForm(false)
      fetchData()
    }
  }

  const handleSetResult = async (matchId: string) => {
    const { error } = await supabase
      .from('matches')
      .update({
        team_a_score: resultScores.a,
        team_b_score: resultScores.b,
        is_finished: true,
      })
      .eq('id', matchId)

    if (!error) {
      setEditingResultId(null)
      fetchData()
    }
  }

  const handleDeleteMatch = async (id: string) => {
    if (!confirm('Czy na pewno chcesz usunąć ten mecz?')) return

    const { error } = await supabase.from('matches').delete().eq('id', id)

    if (!error) {
      fetchData()
    }
  }

  const filteredMatches = showResultsOnly
    ? matches.filter((m) => !m.is_finished)
    : matches

  if (loading) {
    return <div className="text-center py-8">Ładowanie...</div>
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>
          {showResultsOnly ? 'Wprowadź wyniki' : `Mecze (${matches.length})`}
        </CardTitle>
        {!showResultsOnly && (
          <Button onClick={() => setShowAddForm(!showAddForm)} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Dodaj mecz
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {showAddForm && !showResultsOnly && (
          <div className="mb-6 p-4 border rounded-lg bg-gray-50">
            <h3 className="font-medium mb-3">Nowy mecz</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <select
                className="border rounded-md px-3 py-2"
                value={newMatch.team_a_id}
                onChange={(e) => setNewMatch({ ...newMatch, team_a_id: e.target.value })}
              >
                <option value="">Wybierz drużynę A</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>

              <select
                className="border rounded-md px-3 py-2"
                value={newMatch.team_b_id}
                onChange={(e) => setNewMatch({ ...newMatch, team_b_id: e.target.value })}
              >
                <option value="">Wybierz drużynę B</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>

              <select
                className="border rounded-md px-3 py-2"
                value={newMatch.phase}
                onChange={(e) => setNewMatch({ ...newMatch, phase: e.target.value })}
              >
                {PHASES.map((phase) => (
                  <option key={phase.value} value={phase.value}>
                    {phase.label}
                  </option>
                ))}
              </select>

              {newMatch.phase === 'group' && (
                <select
                  className="border rounded-md px-3 py-2"
                  value={newMatch.group_number}
                  onChange={(e) => setNewMatch({ ...newMatch, group_number: parseInt(e.target.value) })}
                >
                  {[1, 2, 3, 4, 5, 6].map((num) => (
                    <option key={num} value={num}>
                      Grupa {String.fromCharCode(64 + num)}
                    </option>
                  ))}
                </select>
              )}

              <Input
                type="datetime-local"
                value={newMatch.bet_deadline}
                onChange={(e) => setNewMatch({ ...newMatch, bet_deadline: e.target.value })}
              />

              <div className="flex gap-2">
                <Button onClick={handleAddMatch} className="flex-1">
                  <Save className="w-4 h-4 mr-2" />
                  Zapisz
                </Button>
                <Button variant="outline" onClick={() => setShowAddForm(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {filteredMatches.map((match) => (
            <div
              key={match.id}
              className={`flex items-center gap-3 p-3 border rounded-lg ${
                match.is_finished ? 'bg-green-50' : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-2 flex-1">
                {match.team_a.flag_url && (
                  <img src={match.team_a.flag_url} alt="" className="w-6 h-4 object-cover rounded" />
                )}
                <span className="font-medium">{match.team_a.name}</span>
              </div>

              {editingResultId === match.id ? (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    value={resultScores.a}
                    onChange={(e) => setResultScores({ ...resultScores, a: parseInt(e.target.value) || 0 })}
                    className="w-16 text-center"
                  />
                  <span>:</span>
                  <Input
                    type="number"
                    min="0"
                    value={resultScores.b}
                    onChange={(e) => setResultScores({ ...resultScores, b: parseInt(e.target.value) || 0 })}
                    className="w-16 text-center"
                  />
                  <Button size="sm" onClick={() => handleSetResult(match.id)}>
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditingResultId(null)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-4">
                  {match.is_finished ? (
                    <span className="font-bold text-lg">
                      {match.team_a_score} : {match.team_b_score}
                    </span>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingResultId(match.id)
                        setResultScores({ a: 0, b: 0 })
                      }}
                    >
                      Wprowadź wynik
                    </Button>
                  )}
                </div>
              )}

              <div className="flex items-center gap-2 flex-1 justify-end">
                <span className="font-medium">{match.team_b.name}</span>
                {match.team_b.flag_url && (
                  <img src={match.team_b.flag_url} alt="" className="w-6 h-4 object-cover rounded" />
                )}
              </div>

              <div className="text-sm text-gray-500 w-32 text-right">
                {format(new Date(match.bet_deadline), 'dd.MM HH:mm')}
              </div>

              {!showResultsOnly && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-red-500"
                  onClick={() => handleDeleteMatch(match.id)}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}

          {filteredMatches.length === 0 && (
            <p className="text-center text-gray-500 py-8">
              {showResultsOnly
                ? 'Wszystkie mecze mają już wyniki!'
                : 'Brak meczów. Dodaj pierwszy mecz!'}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
