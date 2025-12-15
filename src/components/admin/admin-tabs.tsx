'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TeamsManager } from './teams-manager'
import { MatchesManager } from './matches-manager'
import { Users, Trophy, Calendar } from 'lucide-react'

export function AdminTabs() {
  return (
    <Tabs defaultValue="teams" className="w-full">
      <TabsList className="grid w-full grid-cols-3 max-w-md">
        <TabsTrigger value="teams" className="flex items-center gap-2">
          <Users className="w-4 h-4" />
          Drużyny
        </TabsTrigger>
        <TabsTrigger value="matches" className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Mecze
        </TabsTrigger>
        <TabsTrigger value="results" className="flex items-center gap-2">
          <Trophy className="w-4 h-4" />
          Wyniki
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="teams" className="mt-6">
        <TeamsManager />
      </TabsContent>
      
      <TabsContent value="matches" className="mt-6">
        <MatchesManager />
      </TabsContent>
      
      <TabsContent value="results" className="mt-6">
        <MatchesManager showResultsOnly />
      </TabsContent>
    </Tabs>
  )
}
