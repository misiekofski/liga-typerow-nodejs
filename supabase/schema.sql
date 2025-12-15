-- Liga Typerow - Supabase Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLES
-- ============================================

-- Teams table
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(150) NOT NULL,
  short_name VARCHAR(3) NOT NULL,
  flag_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Players table (for best scorer betting)
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  goals INTEGER DEFAULT 0,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User profiles (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT,
  avatar_url TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Matches table
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phase VARCHAR(20) NOT NULL, -- 'Grupa A', 'Ćwierćfinał', 'Półfinał', 'Finał'
  group_number INTEGER, -- 1-6 for groups, 9+ for knockout
  bet_deadline TIMESTAMPTZ NOT NULL,
  points_for_exact INTEGER DEFAULT 5,
  points_for_winner INTEGER DEFAULT 2,
  team_a_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  team_b_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  team_a_score INTEGER,
  team_b_score INTEGER,
  is_finished BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User bets on matches
CREATE TABLE bets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  team_a_score INTEGER NOT NULL DEFAULT 0,
  team_b_score INTEGER NOT NULL DEFAULT 0,
  points_awarded INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, match_id)
);

-- Best scorer bets
CREATE TABLE scorer_bets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  points_awarded INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Knockout tree structure (set by admin)
CREATE TABLE ko_trees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  round_of_16 JSONB NOT NULL, -- Array of {position, team1Id, team2Id}
  quarter_finals JSONB,
  semi_finals JSONB,
  final JSONB,
  winner_id UUID REFERENCES teams(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User knockout predictions
CREATE TABLE ko_bets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ko_tree_id UUID REFERENCES ko_trees(id) ON DELETE CASCADE,
  predictions JSONB NOT NULL, -- {quarterFinals: [], semiFinals: [], final: [], winner: id}
  points_awarded INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, ko_tree_id)
);

-- Rankings (aggregated points)
CREATE TABLE rankings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  total_points INTEGER DEFAULT 0,
  match_points INTEGER DEFAULT 0,
  scorer_points INTEGER DEFAULT 0,
  ko_points INTEGER DEFAULT 0,
  bonus_points INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Settings (for admin-configurable values)
CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key VARCHAR(100) UNIQUE NOT NULL,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE scorer_bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ko_trees ENABLE ROW LEVEL SECURITY;
ALTER TABLE ko_bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Teams: everyone can read
CREATE POLICY "Teams are viewable by everyone" ON teams FOR SELECT USING (true);
CREATE POLICY "Teams are editable by admins" ON teams FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Players: everyone can read
CREATE POLICY "Players are viewable by everyone" ON players FOR SELECT USING (true);
CREATE POLICY "Players are editable by admins" ON players FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Profiles: users can read all, update own
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Matches: everyone can read
CREATE POLICY "Matches are viewable by everyone" ON matches FOR SELECT USING (true);
CREATE POLICY "Matches are editable by admins" ON matches FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Bets: users can read all (after deadline), manage own (before deadline)
CREATE POLICY "Users can view own bets" ON bets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view all bets after deadline" ON bets FOR SELECT USING (
  EXISTS (SELECT 1 FROM matches WHERE matches.id = bets.match_id AND matches.bet_deadline < NOW())
);
CREATE POLICY "Users can insert own bets before deadline" ON bets FOR INSERT WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (SELECT 1 FROM matches WHERE matches.id = match_id AND matches.bet_deadline > NOW())
);
CREATE POLICY "Users can update own bets before deadline" ON bets FOR UPDATE USING (
  auth.uid() = user_id AND
  EXISTS (SELECT 1 FROM matches WHERE matches.id = match_id AND matches.bet_deadline > NOW())
);

-- Scorer bets: similar to bets
CREATE POLICY "Users can view own scorer bets" ON scorer_bets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own scorer bets" ON scorer_bets FOR ALL USING (auth.uid() = user_id);

-- KO Trees: everyone can read
CREATE POLICY "KO trees are viewable by everyone" ON ko_trees FOR SELECT USING (true);
CREATE POLICY "KO trees are editable by admins" ON ko_trees FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- KO Bets: users can read all, manage own
CREATE POLICY "Users can view own KO bets" ON ko_bets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own KO bets" ON ko_bets FOR ALL USING (auth.uid() = user_id);

-- Rankings: everyone can read
CREATE POLICY "Rankings are viewable by everyone" ON rankings FOR SELECT USING (true);
CREATE POLICY "Rankings are editable by system/admins" ON rankings FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Settings: everyone can read, admins can edit
CREATE POLICY "Settings are viewable by everyone" ON settings FOR SELECT USING (true);
CREATE POLICY "Settings are editable by admins" ON settings FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  
  INSERT INTO public.rankings (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to calculate points for a bet
CREATE OR REPLACE FUNCTION calculate_bet_points(
  bet_a INTEGER,
  bet_b INTEGER,
  actual_a INTEGER,
  actual_b INTEGER,
  points_exact INTEGER,
  points_winner INTEGER
)
RETURNS INTEGER AS $$
BEGIN
  -- Exact score match
  IF bet_a = actual_a AND bet_b = actual_b THEN
    RETURN points_exact;
  END IF;
  
  -- Correct winner/draw prediction
  IF (bet_a > bet_b AND actual_a > actual_b) OR
     (bet_a < bet_b AND actual_a < actual_b) OR
     (bet_a = bet_b AND actual_a = actual_b) THEN
    RETURN points_winner;
  END IF;
  
  RETURN 0;
END;
$$ LANGUAGE plpgsql;

-- Function to update rankings after match result
CREATE OR REPLACE FUNCTION update_rankings_after_match()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_finished = TRUE AND (OLD.is_finished = FALSE OR OLD.is_finished IS NULL) THEN
    -- Update all bets for this match
    UPDATE bets
    SET points_awarded = calculate_bet_points(
      team_a_score,
      team_b_score,
      NEW.team_a_score,
      NEW.team_b_score,
      NEW.points_for_exact,
      NEW.points_for_winner
    )
    WHERE match_id = NEW.id;
    
    -- Recalculate rankings
    UPDATE rankings r
    SET 
      match_points = COALESCE((
        SELECT SUM(points_awarded) 
        FROM bets 
        WHERE user_id = r.user_id
      ), 0),
      total_points = COALESCE((
        SELECT SUM(points_awarded) FROM bets WHERE user_id = r.user_id
      ), 0) + r.scorer_points + r.ko_points + r.bonus_points,
      updated_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_match_finished
  AFTER UPDATE ON matches
  FOR EACH ROW EXECUTE FUNCTION update_rankings_after_match();

-- ============================================
-- INITIAL DATA (Settings)
-- ============================================

INSERT INTO settings (key, value) VALUES
  ('points_for_exact', '5'),
  ('points_for_winner', '2'),
  ('points_per_goal_scorer', '1'),
  ('ko_tree_deadline', '"2024-06-29T18:00:00Z"'),
  ('tournament_start', '"2024-06-14T21:00:00Z"');

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_matches_deadline ON matches(bet_deadline);
CREATE INDEX idx_matches_group ON matches(group_number);
CREATE INDEX idx_bets_user ON bets(user_id);
CREATE INDEX idx_bets_match ON bets(match_id);
CREATE INDEX idx_rankings_points ON rankings(total_points DESC);
