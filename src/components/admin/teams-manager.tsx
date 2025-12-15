'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Trash2, Edit2, Save, X } from 'lucide-react'
import { Database } from '@/types/database'

type Team = Database['public']['Tables']['teams']['Row']

export function TeamsManager() {
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newTeam, setNewTeam] = useState({ name: '', short_name: '', flag_url: '' })
  const [editTeam, setEditTeam] = useState({ name: '', short_name: '', flag_url: '' })
  const [showAddForm, setShowAddForm] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchTeams()
  }, [])

  const fetchTeams = async () => {
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .order('name')

    if (!error && data) {
      setTeams(data)
    }
    setLoading(false)
  }

  const handleAddTeam = async () => {
    if (!newTeam.name || !newTeam.short_name) return

    const { error } = await supabase
      .from('teams')
      .insert({
        name: newTeam.name,
        short_name: newTeam.short_name,
        flag_url: newTeam.flag_url || null,
      })

    if (!error) {
      setNewTeam({ name: '', short_name: '', flag_url: '' })
      setShowAddForm(false)
      fetchTeams()
    }
  }

  const handleUpdateTeam = async (id: string) => {
    const { error } = await supabase
      .from('teams')
      .update({
        name: editTeam.name,
        short_name: editTeam.short_name,
        flag_url: editTeam.flag_url || null,
      })
      .eq('id', id)

    if (!error) {
      setEditingId(null)
      fetchTeams()
    }
  }

  const handleDeleteTeam = async (id: string) => {
    if (!confirm('Czy na pewno chcesz usunąć tę drużynę?')) return

    const { error } = await supabase
      .from('teams')
      .delete()
      .eq('id', id)

    if (!error) {
      fetchTeams()
    }
  }

  const startEditing = (team: Team) => {
    setEditingId(team.id)
    setEditTeam({
      name: team.name,
      short_name: team.short_name,
      flag_url: team.flag_url || '',
    })
  }

  if (loading) {
    return <div className="text-center py-8">Ładowanie...</div>
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Drużyny ({teams.length})</CardTitle>
        <Button onClick={() => setShowAddForm(!showAddForm)} size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Dodaj drużynę
        </Button>
      </CardHeader>
      <CardContent>
        {showAddForm && (
          <div className="mb-6 p-4 border rounded-lg bg-gray-50">
            <h3 className="font-medium mb-3">Nowa drużyna</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <Input
                placeholder="Nazwa (np. Polska)"
                value={newTeam.name}
                onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
              />
              <Input
                placeholder="Skrót (np. POL)"
                value={newTeam.short_name}
                onChange={(e) => setNewTeam({ ...newTeam, short_name: e.target.value.toUpperCase() })}
                maxLength={3}
              />
              <Input
                placeholder="URL flagi (opcjonalnie)"
                value={newTeam.flag_url}
                onChange={(e) => setNewTeam({ ...newTeam, flag_url: e.target.value })}
              />
              <div className="flex gap-2">
                <Button onClick={handleAddTeam} className="flex-1">
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
          {teams.map((team) => (
            <div
              key={team.id}
              className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50"
            >
              {team.flag_url && (
                <img
                  src={team.flag_url}
                  alt={team.name}
                  className="w-8 h-6 object-cover rounded"
                />
              )}
              
              {editingId === team.id ? (
                <>
                  <Input
                    value={editTeam.name}
                    onChange={(e) => setEditTeam({ ...editTeam, name: e.target.value })}
                    className="flex-1"
                  />
                  <Input
                    value={editTeam.short_name}
                    onChange={(e) => setEditTeam({ ...editTeam, short_name: e.target.value.toUpperCase() })}
                    className="w-20"
                    maxLength={3}
                  />
                  <Input
                    value={editTeam.flag_url}
                    onChange={(e) => setEditTeam({ ...editTeam, flag_url: e.target.value })}
                    placeholder="URL flagi"
                    className="w-48"
                  />
                  <Button size="sm" onClick={() => handleUpdateTeam(team.id)}>
                    <Save className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                    <X className="w-4 h-4" />
                  </Button>
                </>
              ) : (
                <>
                  <span className="flex-1 font-medium">{team.name}</span>
                  <span className="text-gray-500 w-12">{team.short_name}</span>
                  <Button size="sm" variant="ghost" onClick={() => startEditing(team)}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost" className="text-red-500" onClick={() => handleDeleteTeam(team.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>
          ))}

          {teams.length === 0 && (
            <p className="text-center text-gray-500 py-8">
              Brak drużyn. Dodaj pierwszą drużynę!
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
