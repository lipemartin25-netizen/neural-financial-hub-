-- ========================================
-- SPRINT 7A: Gamification / Badges
-- ========================================

-- Badges/Conquistas do usuário
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

-- XP & Streak tracking
CREATE TABLE IF NOT EXISTS user_gamification (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  xp INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_activity_date DATE,
  total_transactions INTEGER NOT NULL DEFAULT 0,
  total_goals_completed INTEGER NOT NULL DEFAULT 0,
  total_budgets_on_track INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_gamification ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    DROP POLICY IF EXISTS "users_own_badges" ON user_badges;
    CREATE POLICY "users_own_badges" ON user_badges FOR ALL USING (user_id = auth.uid());

    DROP POLICY IF EXISTS "users_own_gamification" ON user_gamification;
    CREATE POLICY "users_own_gamification" ON user_gamification FOR ALL USING (user_id = auth.uid());
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_gamification_user ON user_gamification(user_id);

-- Adicionar campo de preferências no profile
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'pt-BR';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'dark';
