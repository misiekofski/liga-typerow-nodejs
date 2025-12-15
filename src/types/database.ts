export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      teams: {
        Row: {
          id: string
          name: string
          short_name: string
          flag_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          short_name: string
          flag_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          short_name?: string
          flag_url?: string | null
          created_at?: string
        }
      }
      players: {
        Row: {
          id: string
          name: string
          goals: number
          team_id: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          goals?: number
          team_id: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          goals?: number
          team_id?: string
          created_at?: string
        }
      }
      matches: {
        Row: {
          id: string
          phase: string
          group_number: number | null
          bet_deadline: string
          points_for_exact: number
          points_for_winner: number
          team_a_id: string
          team_b_id: string
          team_a_score: number | null
          team_b_score: number | null
          is_finished: boolean
          created_at: string
        }
        Insert: {
          id?: string
          phase: string
          group_number?: number | null
          bet_deadline: string
          points_for_exact?: number
          points_for_winner?: number
          team_a_id: string
          team_b_id: string
          team_a_score?: number | null
          team_b_score?: number | null
          is_finished?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          phase?: string
          group_number?: number | null
          bet_deadline?: string
          points_for_exact?: number
          points_for_winner?: number
          team_a_id?: string
          team_b_id?: string
          team_a_score?: number | null
          team_b_score?: number | null
          is_finished?: boolean
          created_at?: string
        }
      }
      bets: {
        Row: {
          id: string
          user_id: string
          match_id: string
          team_a_score: number
          team_b_score: number
          points_awarded: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          match_id: string
          team_a_score: number
          team_b_score: number
          points_awarded?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          match_id?: string
          team_a_score?: number
          team_b_score?: number
          points_awarded?: number
          created_at?: string
          updated_at?: string
        }
      }
      scorer_bets: {
        Row: {
          id: string
          user_id: string
          player_id: string
          points_awarded: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          player_id: string
          points_awarded?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          player_id?: string
          points_awarded?: number
          created_at?: string
        }
      }
      ko_trees: {
        Row: {
          id: string
          round_of_16: Json
          quarter_finals: Json | null
          semi_finals: Json | null
          final: Json | null
          winner_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          round_of_16: Json
          quarter_finals?: Json | null
          semi_finals?: Json | null
          final?: Json | null
          winner_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          round_of_16?: Json
          quarter_finals?: Json | null
          semi_finals?: Json | null
          final?: Json | null
          winner_id?: string | null
          created_at?: string
        }
      }
      ko_bets: {
        Row: {
          id: string
          user_id: string
          ko_tree_id: string
          predictions: Json
          points_awarded: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          ko_tree_id: string
          predictions: Json
          points_awarded?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          ko_tree_id?: string
          predictions?: Json
          points_awarded?: number
          created_at?: string
        }
      }
      rankings: {
        Row: {
          id: string
          user_id: string
          total_points: number
          match_points: number
          scorer_points: number
          ko_points: number
          bonus_points: number
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          total_points?: number
          match_points?: number
          scorer_points?: number
          ko_points?: number
          bonus_points?: number
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          total_points?: number
          match_points?: number
          scorer_points?: number
          ko_points?: number
          bonus_points?: number
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          username: string | null
          avatar_url: string | null
          is_admin: boolean
          created_at: string
        }
        Insert: {
          id: string
          username?: string | null
          avatar_url?: string | null
          is_admin?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          username?: string | null
          avatar_url?: string | null
          is_admin?: boolean
          created_at?: string
        }
      }
      settings: {
        Row: {
          id: string
          key: string
          value: Json
          updated_at: string
        }
        Insert: {
          id?: string
          key: string
          value: Json
          updated_at?: string
        }
        Update: {
          id?: string
          key?: string
          value?: Json
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

export type Team = Database['public']['Tables']['teams']['Row']
export type Player = Database['public']['Tables']['players']['Row']
export type Match = Database['public']['Tables']['matches']['Row']
export type Bet = Database['public']['Tables']['bets']['Row']
export type ScorerBet = Database['public']['Tables']['scorer_bets']['Row']
export type KOTree = Database['public']['Tables']['ko_trees']['Row']
export type KOBet = Database['public']['Tables']['ko_bets']['Row']
export type Ranking = Database['public']['Tables']['rankings']['Row']
export type Profile = Database['public']['Tables']['profiles']['Row']
