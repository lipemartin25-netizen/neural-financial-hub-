-- ========================================
-- SPRINT 5: Family Sharing
-- ========================================
-- Tabela de famílias/grupos
CREATE TABLE IF NOT EXISTS public.families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'Minha Família',
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invite_code TEXT UNIQUE DEFAULT encode(gen_random_bytes(6), 'hex'),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Membros da família
CREATE TABLE IF NOT EXISTS public.family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  nickname TEXT,
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(family_id, user_id)
);

-- Transações compartilhadas com a família
CREATE TABLE IF NOT EXISTS public.family_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  shared_by UUID NOT NULL REFERENCES auth.users(id),
  split_type TEXT DEFAULT 'none' CHECK (split_type IN ('none', 'equal', 'custom')),
  shared_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(family_id, transaction_id)
);

-- Splits (divisão de despesas)
CREATE TABLE IF NOT EXISTS public.family_splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_transaction_id UUID NOT NULL REFERENCES family_transactions(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  is_paid BOOLEAN DEFAULT false,
  paid_at TIMESTAMPTZ
);

-- Metas familiares
CREATE TABLE IF NOT EXISTS public.family_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT DEFAULT '🎯',
  target_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  current_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  deadline DATE,
  is_completed BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Contribuições para metas familiares
CREATE TABLE IF NOT EXISTS public.family_goal_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_goal_id UUID NOT NULL REFERENCES family_goals(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_goal_contributions ENABLE ROW LEVEL SECURITY;

-- DROP POLOCIES IF EXISTS (Idempotency)
DROP POLICY IF EXISTS "family_members_can_view_family" ON families;
DROP POLICY IF EXISTS "owner_can_update_family" ON families;
DROP POLICY IF EXISTS "auth_can_create_family" ON families;
DROP POLICY IF EXISTS "owner_can_delete_family" ON families;
DROP POLICY IF EXISTS "members_can_view_members" ON family_members;
DROP POLICY IF EXISTS "admins_can_manage_members" ON family_members;
DROP POLICY IF EXISTS "members_view_family_tx" ON family_transactions;
DROP POLICY IF EXISTS "members_share_tx" ON family_transactions;
DROP POLICY IF EXISTS "members_view_splits" ON family_splits;
DROP POLICY IF EXISTS "members_view_family_goals" ON family_goals;
DROP POLICY IF EXISTS "members_manage_family_goals" ON family_goals;
DROP POLICY IF EXISTS "members_view_contributions" ON family_goal_contributions;
DROP POLICY IF EXISTS "members_contribute" ON family_goal_contributions;

-- Policies: famílias — membros podem ver
CREATE POLICY "family_members_can_view_family" ON families
  FOR SELECT USING (
    id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid())
  );
CREATE POLICY "owner_can_update_family" ON families
  FOR UPDATE USING (owner_id = auth.uid());
CREATE POLICY "auth_can_create_family" ON families
  FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY "owner_can_delete_family" ON families
  FOR DELETE USING (owner_id = auth.uid());

-- Policies: family_members
CREATE POLICY "members_can_view_members" ON family_members
  FOR SELECT USING (
    family_id IN (SELECT family_id FROM family_members fm WHERE fm.user_id = auth.uid())
  );
CREATE POLICY "admins_can_manage_members" ON family_members
  FOR ALL USING (
    family_id IN (
      SELECT family_id FROM family_members fm
      WHERE fm.user_id = auth.uid() AND fm.role IN ('owner', 'admin')
    )
  );

-- Policies: family_transactions
CREATE POLICY "members_view_family_tx" ON family_transactions
  FOR SELECT USING (
    family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid())
  );
CREATE POLICY "members_share_tx" ON family_transactions
  FOR INSERT WITH CHECK (shared_by = auth.uid());

-- Policies: family_splits
CREATE POLICY "members_view_splits" ON family_splits
  FOR SELECT USING (
    family_transaction_id IN (
      SELECT ft.id FROM family_transactions ft
      JOIN family_members fm ON fm.family_id = ft.family_id
      WHERE fm.user_id = auth.uid()
    )
  );

-- Policies: family_goals
CREATE POLICY "members_view_family_goals" ON family_goals
  FOR SELECT USING (
    family_id IN (SELECT family_id FROM family_members WHERE user_id = auth.uid())
  );
CREATE POLICY "members_manage_family_goals" ON family_goals
  FOR ALL USING (
    family_id IN (
      SELECT family_id FROM family_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'member')
    )
  );

-- Policies: contributions
CREATE POLICY "members_view_contributions" ON family_goal_contributions
  FOR SELECT USING (
    family_goal_id IN (
      SELECT fg.id FROM family_goals fg
      JOIN family_members fm ON fm.family_id = fg.family_id
      WHERE fm.user_id = auth.uid()
    )
  );
CREATE POLICY "members_contribute" ON family_goal_contributions
  FOR INSERT WITH CHECK (
    member_id IN (SELECT id FROM family_members WHERE user_id = auth.uid())
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_family_members_user ON family_members(user_id);
CREATE INDEX IF NOT EXISTS idx_family_members_family ON family_members(family_id);
CREATE INDEX IF NOT EXISTS idx_family_tx_family ON family_transactions(family_id);
CREATE INDEX IF NOT EXISTS idx_family_goals_family ON family_goals(family_id);

-- Adicionar campo na notifications para family (se a tabela notifications existir)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'notifications') THEN
    ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS family_id UUID REFERENCES public.families(id);
  END IF;
END $$;
