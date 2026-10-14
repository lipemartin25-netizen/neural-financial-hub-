-- ========================================
-- FIX: RLS para tabelas sem proteção
-- ========================================

-- ===== user_gamification =====
ALTER TABLE user_gamification ENABLE ROW LEVEL SECURITY;
-- Drop policies se existirem (idempotente)
DROP POLICY IF EXISTS "users_own_gamification" ON user_gamification;
CREATE POLICY "users_own_gamification" ON user_gamification
  FOR ALL USING (user_id = auth.uid());

-- ===== user_badges =====
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "users_own_badges" ON user_badges;
CREATE POLICY "users_own_badges" ON user_badges
  FOR ALL USING (user_id = auth.uid());

-- ===== families =====
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "family_owner_manage" ON families;
CREATE POLICY "family_owner_manage" ON families
  FOR ALL USING (owner_id = auth.uid());

-- Membros podem VER sua família
DROP POLICY IF EXISTS "family_members_read" ON families;
CREATE POLICY "family_members_read" ON families
  FOR SELECT USING (
    id IN (
      SELECT family_id FROM family_members WHERE user_id = auth.uid()
    )
  );

-- ===== family_members =====
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
-- Pode ver membros da própria família
DROP POLICY IF EXISTS "view_own_family_members" ON family_members;
CREATE POLICY "view_own_family_members" ON family_members
  FOR SELECT USING (
    family_id IN (
      SELECT family_id FROM family_members fm WHERE fm.user_id = auth.uid()
    )
  );

-- Pode inserir se é owner/admin da família OU é o próprio user (join)
DROP POLICY IF EXISTS "insert_family_members" ON family_members;
CREATE POLICY "insert_family_members" ON family_members
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    OR family_id IN (
      SELECT family_id FROM family_members fm
      WHERE fm.user_id = auth.uid() AND fm.role IN ('owner', 'admin')
    )
  );

-- Pode atualizar se é owner/admin
DROP POLICY IF EXISTS "update_family_members" ON family_members;
CREATE POLICY "update_family_members" ON family_members
  FOR UPDATE USING (
    family_id IN (
      SELECT family_id FROM family_members fm
      WHERE fm.user_id = auth.uid() AND fm.role IN ('owner', 'admin')
    )
  );

-- Pode deletar: owner/admin remove outros, ou o próprio sai
DROP POLICY IF EXISTS "delete_family_members" ON family_members;
CREATE POLICY "delete_family_members" ON family_members
  FOR DELETE USING (
    user_id = auth.uid()
    OR family_id IN (
      SELECT family_id FROM family_members fm
      WHERE fm.user_id = auth.uid() AND fm.role IN ('owner', 'admin')
    )
  );

-- ===== family_goals =====
ALTER TABLE family_goals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "family_goals_access" ON family_goals;
CREATE POLICY "family_goals_access" ON family_goals
  FOR ALL USING (
    family_id IN (
      SELECT family_id FROM family_members WHERE user_id = auth.uid()
    )
  );

-- ===== family_transactions =====
ALTER TABLE family_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "family_tx_access" ON family_transactions;
CREATE POLICY "family_tx_access" ON family_transactions
  FOR ALL USING (
    family_id IN (
      SELECT family_id FROM family_members WHERE user_id = auth.uid()
    )
  );

-- Adicionar colunas de anti-farming
ALTER TABLE user_gamification ADD COLUMN IF NOT EXISTS last_xp_action TEXT;
ALTER TABLE user_gamification ADD COLUMN IF NOT EXISTS last_xp_action_at TIMESTAMPTZ;

-- ===== VERIFICAÇÃO FINAL =====
-- Listar todas as tabelas e se RLS está ativo
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
