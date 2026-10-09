-- ============================================================
-- 🧠 NEURAFIN HUB v3.0 - DATABASE SCHEMA COMPLETO
-- Inclui: v1 (base) + v2 (melhorias) + v3 (novos módulos)
-- ESTRUTURA: Tabelas primeiro, depois RLS + Policies
-- Execute este arquivo inteiro no SQL Editor do Supabase
-- ============================================================

-- ============================================================
-- EXTENSÕES
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================
-- BLOCO 1: CRIAÇÃO DAS TABELAS
-- (Todas as tabelas sem policies - apenas estrutura)
-- ============================================================

-- 1. PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  date_of_birth DATE,
  currency TEXT DEFAULT 'BRL',
  locale TEXT DEFAULT 'pt-BR',
  timezone TEXT DEFAULT 'America/Sao_Paulo',
  monthly_income DECIMAL(15,2),
  financial_goal TEXT,
  neural_score INT DEFAULT 50 CHECK (neural_score BETWEEN 0 AND 100),
  is_mei BOOLEAN DEFAULT false,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'family', 'mei')),
  plan_expires_at TIMESTAMPTZ,
  stripe_customer_id TEXT,
  onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. FAMILIES
CREATE TABLE IF NOT EXISTS public.families (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  invite_code TEXT UNIQUE DEFAULT encode(gen_random_bytes(6), 'hex'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. FAMILY_MEMBERS
CREATE TABLE IF NOT EXISTS public.family_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'adult', 'member', 'view_only')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(family_id, user_id)
);

-- 4. CATEGORIES
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
  icon TEXT,
  color TEXT DEFAULT '#6366f1',
  is_default BOOLEAN DEFAULT false,
  parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. ACCOUNTS
CREATE TABLE IF NOT EXISTS public.accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  family_id UUID REFERENCES public.families(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN (
    'checking', 'savings', 'credit_card', 'investment', 'cash', 'wallet', 'other'
  )),
  bank_name TEXT,
  bank_code TEXT,
  bank_logo TEXT,
  balance DECIMAL(15,2) DEFAULT 0,
  credit_limit DECIMAL(15,2),
  available_credit DECIMAL(15,2),
  closing_day INT CHECK (closing_day BETWEEN 1 AND 31),
  due_day INT CHECK (due_day BETWEEN 1 AND 31),
  color TEXT DEFAULT '#6366f1',
  icon TEXT,
  is_active BOOLEAN DEFAULT true,
  include_in_total BOOLEAN DEFAULT true,
  open_finance_id TEXT,
  is_shared BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TRANSACTIONS
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  family_id UUID REFERENCES public.families(id) ON DELETE SET NULL,
  amount DECIMAL(15,2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
  description TEXT NOT NULL,
  notes TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_recurring BOOLEAN DEFAULT false,
  recurring_frequency TEXT CHECK (recurring_frequency IN (
    'daily', 'weekly', 'biweekly', 'monthly', 'bimonthly', 'quarterly', 'semiannual', 'annual'
  )),
  recurring_end_date DATE,
  parent_transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
  tags TEXT[],
  transfer_account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  invoice_id UUID,
  installments INT,
  installment_number INT,
  open_finance_id TEXT UNIQUE,
  ai_categorized BOOLEAN DEFAULT false,
  ai_confidence DECIMAL(3,2),
  ai_reviewed BOOLEAN DEFAULT false,
  receipt_url TEXT,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. BUDGETS
CREATE TABLE IF NOT EXISTS public.budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  amount DECIMAL(15,2) NOT NULL,
  period TEXT DEFAULT 'monthly' CHECK (period IN ('weekly', 'monthly', 'yearly')),
  month INT CHECK (month BETWEEN 1 AND 12),
  year INT,
  alert_threshold DECIMAL(5,2) DEFAULT 80.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, category_id, period, month, year)
);

-- 8. GOALS
CREATE TABLE IF NOT EXISTS public.goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  family_id UUID REFERENCES public.families(id) ON DELETE SET NULL,
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  target_amount DECIMAL(15,2) NOT NULL,
  current_amount DECIMAL(15,2) DEFAULT 0,
  target_date DATE,
  icon TEXT DEFAULT '🎯',
  color TEXT DEFAULT '#6366f1',
  category TEXT DEFAULT 'savings' CHECK (category IN (
    'emergency', 'travel', 'education', 'home', 'vehicle',
    'retirement', 'investment', 'savings', 'other'
  )),
  priority INT DEFAULT 1 CHECK (priority BETWEEN 1 AND 5),
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  is_shared BOOLEAN DEFAULT false,
  monthly_contribution DECIMAL(15,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. BILLS
CREATE TABLE IF NOT EXISTS public.bills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  type TEXT DEFAULT 'expense' CHECK (type IN ('income', 'expense')),
  frequency TEXT NOT NULL CHECK (frequency IN (
    'daily', 'weekly', 'biweekly', 'monthly', 'bimonthly',
    'quarterly', 'semiannual', 'annual', 'once'
  )),
  due_day INT CHECK (due_day BETWEEN 1 AND 31),
  next_due_date DATE,
  last_paid_date DATE,
  is_active BOOLEAN DEFAULT true,
  auto_pay BOOLEAN DEFAULT false,
  reminder_days INT DEFAULT 3,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. AI_INTERACTIONS
CREATE TABLE IF NOT EXISTS public.ai_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'chat', 'categorize', 'insight', 'forecast', 'academy', 'wealth_analysis'
  )),
  model TEXT,
  prompt TEXT,
  response TEXT,
  tokens_used INT,
  cost_usd DECIMAL(10,6),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'bill_due', 'bill_overdue', 'budget_alert', 'goal_reached',
    'boleto_due', 'account_low', 'insight', 'sync_complete',
    'transaction_imported', 'family_invite', 'security_alert', 'system'
  )),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. AUDIT_LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. USER_SESSIONS
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  device_info TEXT,
  ip_address INET,
  user_agent TEXT,
  is_active BOOLEAN DEFAULT true,
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. TWO_FACTOR_AUTH
CREATE TABLE IF NOT EXISTS public.two_factor_auth (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  secret TEXT NOT NULL,
  is_enabled BOOLEAN DEFAULT false,
  backup_codes TEXT[],
  enabled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. RATE_LIMIT_LOG
CREATE TABLE IF NOT EXISTS public.rate_limit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  identifier TEXT NOT NULL,
  action TEXT NOT NULL,
  count INT DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. CREDIT_CARD_INVOICES (v3)
CREATE TABLE IF NOT EXISTS public.credit_card_invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  month INT NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INT NOT NULL,
  open_date DATE NOT NULL,
  close_date DATE NOT NULL,
  due_date DATE NOT NULL,
  total_amount DECIMAL(15,2) DEFAULT 0,
  minimum_payment DECIMAL(15,2),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed', 'paid', 'partial', 'overdue')),
  paid_amount DECIMAL(15,2) DEFAULT 0,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(account_id, year, month)
);

-- 17. BOLETOS (v3)
CREATE TABLE IF NOT EXISTS public.boletos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  barcode TEXT,
  digitable_line TEXT,
  amount DECIMAL(15,2) NOT NULL,
  discount_amount DECIMAL(15,2),
  fine_amount DECIMAL(15,2),
  interest_amount DECIMAL(15,2),
  final_amount DECIMAL(15,2),
  beneficiary_name TEXT,
  beneficiary_document TEXT,
  payer_name TEXT,
  payer_document TEXT,
  issue_date DATE,
  due_date DATE NOT NULL,
  payment_date DATE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  type TEXT DEFAULT 'utility' CHECK (type IN (
    'utility', 'tax', 'bank_slip', 'insurance', 'rent',
    'condominium', 'education', 'health', 'subscription', 'other'
  )),
  dda_detected BOOLEAN DEFAULT false,
  dda_source TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'paid', 'overdue', 'cancelled', 'scheduled'
  )),
  is_recurring BOOLEAN DEFAULT false,
  bill_id UUID REFERENCES public.bills(id) ON DELETE SET NULL,
  notes TEXT,
  open_finance_id TEXT,
  ai_categorized BOOLEAN DEFAULT false,
  ai_confidence DECIMAL(3,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 18. OPEN_FINANCE_CONNECTIONS (v3)
CREATE TABLE IF NOT EXISTS public.open_finance_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  institution_id TEXT NOT NULL,
  institution_name TEXT NOT NULL,
  institution_logo TEXT,
  consent_id TEXT NOT NULL UNIQUE,
  consent_status TEXT DEFAULT 'active' CHECK (consent_status IN ('pending', 'active', 'expired', 'revoked')),
  consent_expires_at TIMESTAMPTZ,
  permissions TEXT[],
  last_sync_at TIMESTAMPTZ,
  sync_status TEXT DEFAULT 'idle' CHECK (sync_status IN ('idle', 'syncing', 'success', 'error')),
  sync_error TEXT,
  total_synced_transactions INT DEFAULT 0,
  accounts_linked UUID[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 19. OPEN_FINANCE_SYNC_LOG (v3)
CREATE TABLE IF NOT EXISTS public.open_finance_sync_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  connection_id UUID NOT NULL REFERENCES public.open_finance_connections(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sync_type TEXT NOT NULL CHECK (sync_type IN ('initial_90_days', 'incremental', 'manual', 'full_refresh')),
  status TEXT DEFAULT 'running' CHECK (status IN ('running', 'completed', 'partial', 'failed')),
  transactions_found INT DEFAULT 0,
  transactions_imported INT DEFAULT 0,
  transactions_categorized INT DEFAULT 0,
  transactions_duplicate INT DEFAULT 0,
  boletos_found INT DEFAULT 0,
  boletos_imported INT DEFAULT 0,
  date_from DATE,
  date_to DATE,
  duration_ms INT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- 20. WEALTH_LAB_SIMULATIONS (v3)
CREATE TABLE IF NOT EXISTS public.wealth_lab_simulations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'independence', 'retirement', 'investment',
    'tax_planning', 'objective', 'mei_projection'
  )),
  name TEXT NOT NULL,
  inputs JSONB NOT NULL,
  results JSONB NOT NULL,
  is_favorite BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 21. ACADEMY_PROGRESS (v3)
CREATE TABLE IF NOT EXISTS public.academy_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  module_id TEXT NOT NULL,
  lesson_id TEXT NOT NULL,
  status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  quiz_score DECIMAL(5,2),
  quiz_attempts INT DEFAULT 0,
  time_spent_seconds INT DEFAULT 0,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, module_id, lesson_id)
);

-- 22. COUPLES_SHARED (v3)
CREATE TABLE IF NOT EXISTS public.couples_shared (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  partner_1_id UUID NOT NULL REFERENCES public.profiles(id),
  partner_2_id UUID NOT NULL REFERENCES public.profiles(id),
  split_type TEXT DEFAULT 'equal' CHECK (split_type IN ('equal', 'proportional', 'custom')),
  partner_1_income DECIMAL(15,2),
  partner_2_income DECIMAL(15,2),
  custom_splits JSONB,
  settlement_day INT DEFAULT 1 CHECK (settlement_day BETWEEN 1 AND 28),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 23. COUPLES_EXPENSES (v3)
CREATE TABLE IF NOT EXISTS public.couples_expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  couple_id UUID NOT NULL REFERENCES public.couples_shared(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
  paid_by UUID NOT NULL REFERENCES public.profiles(id),
  amount DECIMAL(15,2) NOT NULL,
  description TEXT NOT NULL,
  category_id UUID REFERENCES public.categories(id),
  split_p1 DECIMAL(5,2) DEFAULT 50.00,
  split_p2 DECIMAL(5,2) DEFAULT 50.00,
  is_settled BOOLEAN DEFAULT false,
  settled_at TIMESTAMPTZ,
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 24. MEI_DATA (v3)
CREATE TABLE IF NOT EXISTS public.mei_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  cnpj TEXT,
  company_name TEXT,
  activity_code TEXT,
  activity_description TEXT,
  registration_date DATE,
  annual_limit DECIMAL(15,2) DEFAULT 81000.00,
  das_amount DECIMAL(10,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 25. MEI_REVENUE (v3)
CREATE TABLE IF NOT EXISTS public.mei_revenue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mei_id UUID NOT NULL REFERENCES public.mei_data(id) ON DELETE CASCADE,
  year INT NOT NULL,
  month INT NOT NULL CHECK (month BETWEEN 1 AND 12),
  gross_revenue DECIMAL(15,2) DEFAULT 0,
  invoices_count INT DEFAULT 0,
  das_paid BOOLEAN DEFAULT false,
  das_paid_at TIMESTAMPTZ,
  das_amount DECIMAL(10,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, year, month)
);

-- ============================================================
-- BLOCO 2: ÍNDICES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_accounts_user ON public.accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_type ON public.accounts(type);
CREATE INDEX IF NOT EXISTS idx_transactions_user ON public.transactions(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_account ON public.transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON public.transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON public.transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_recurring ON public.transactions(user_id) WHERE is_recurring = true;
CREATE INDEX IF NOT EXISTS idx_budgets_user ON public.budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_user ON public.goals(user_id);
CREATE INDEX IF NOT EXISTS idx_bills_user ON public.bills(user_id);
CREATE INDEX IF NOT EXISTS idx_bills_next_due ON public.bills(next_due_date) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_ai_user ON public.ai_interactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_audit_user ON public.audit_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON public.user_sessions(user_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_rate_limit ON public.rate_limit_log(identifier, action, window_start);
CREATE INDEX IF NOT EXISTS idx_invoices_account ON public.credit_card_invoices(account_id, year DESC, month DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.credit_card_invoices(status) WHERE status != 'paid';
CREATE INDEX IF NOT EXISTS idx_boletos_user ON public.boletos(user_id, due_date DESC);
CREATE INDEX IF NOT EXISTS idx_boletos_status ON public.boletos(status) WHERE status IN ('pending', 'overdue');
CREATE INDEX IF NOT EXISTS idx_boletos_due ON public.boletos(due_date) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_of_connections_user ON public.open_finance_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_of_connections_status ON public.open_finance_connections(consent_status);
CREATE INDEX IF NOT EXISTS idx_simulations_user ON public.wealth_lab_simulations(user_id, type);
CREATE INDEX IF NOT EXISTS idx_academy_user ON public.academy_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_mei_revenue_user ON public.mei_revenue(user_id, year DESC, month DESC);

-- ============================================================
-- BLOCO 3: HABILITAR RLS (todas as tabelas)
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.two_factor_auth ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_card_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boletos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.open_finance_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.open_finance_sync_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wealth_lab_simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.couples_shared ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.couples_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mei_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mei_revenue ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- BLOCO 4: POLICIES RLS
-- (Todas as tabelas já existem, sem risco de 42P01)
-- ============================================================

-- profiles
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (id = auth.uid());

-- families
CREATE POLICY "families_owner_all" ON public.families FOR ALL USING (owner_id = auth.uid());
CREATE POLICY "families_member_select" ON public.families FOR SELECT
  USING (owner_id = auth.uid() OR id IN (
    SELECT family_id FROM public.family_members WHERE user_id = auth.uid()
  ));

-- family_members
CREATE POLICY "family_members_select" ON public.family_members FOR SELECT
  USING (user_id = auth.uid() OR family_id IN (
    SELECT id FROM public.families WHERE owner_id = auth.uid()
  ));

-- categories
CREATE POLICY "categories_select" ON public.categories FOR SELECT
  USING (user_id = auth.uid() OR is_default = true);
CREATE POLICY "categories_manage" ON public.categories FOR ALL USING (user_id = auth.uid());

-- accounts
CREATE POLICY "accounts_own_all" ON public.accounts FOR ALL USING (user_id = auth.uid());
CREATE POLICY "accounts_family_select" ON public.accounts FOR SELECT
  USING (is_shared = true AND family_id IN (
    SELECT family_id FROM public.family_members WHERE user_id = auth.uid()
  ));

-- transactions
CREATE POLICY "transactions_own_all" ON public.transactions FOR ALL USING (user_id = auth.uid());
CREATE POLICY "transactions_family_select" ON public.transactions FOR SELECT
  USING (family_id IN (
    SELECT family_id FROM public.family_members WHERE user_id = auth.uid()
  ));

-- budgets
CREATE POLICY "budgets_own_all" ON public.budgets FOR ALL USING (user_id = auth.uid());

-- goals
CREATE POLICY "goals_own_all" ON public.goals FOR ALL USING (user_id = auth.uid());
CREATE POLICY "goals_family_select" ON public.goals FOR SELECT
  USING (is_shared = true AND family_id IN (
    SELECT family_id FROM public.family_members WHERE user_id = auth.uid()
  ));

-- bills
CREATE POLICY "bills_own_all" ON public.bills FOR ALL USING (user_id = auth.uid());

-- ai_interactions
CREATE POLICY "ai_interactions_select" ON public.ai_interactions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "ai_interactions_insert" ON public.ai_interactions FOR INSERT WITH CHECK (user_id = auth.uid());

-- notifications
CREATE POLICY "notifications_own_all" ON public.notifications FOR ALL USING (user_id = auth.uid());

-- audit_logs
CREATE POLICY "audit_logs_select_own" ON public.audit_logs FOR SELECT USING (user_id = auth.uid());

-- user_sessions
CREATE POLICY "user_sessions_own_all" ON public.user_sessions FOR ALL USING (user_id = auth.uid());

-- two_factor_auth
CREATE POLICY "two_factor_own_all" ON public.two_factor_auth FOR ALL USING (user_id = auth.uid());

-- credit_card_invoices
CREATE POLICY "invoices_own_all" ON public.credit_card_invoices FOR ALL USING (user_id = auth.uid());

-- boletos
CREATE POLICY "boletos_own_all" ON public.boletos FOR ALL USING (user_id = auth.uid());

-- open_finance_connections
CREATE POLICY "of_connections_own_all" ON public.open_finance_connections FOR ALL USING (user_id = auth.uid());

-- open_finance_sync_log
CREATE POLICY "of_sync_log_select" ON public.open_finance_sync_log FOR SELECT USING (user_id = auth.uid());

-- wealth_lab_simulations
CREATE POLICY "simulations_own_all" ON public.wealth_lab_simulations FOR ALL USING (user_id = auth.uid());

-- academy_progress
CREATE POLICY "academy_own_all" ON public.academy_progress FOR ALL USING (user_id = auth.uid());

-- couples_shared
CREATE POLICY "couples_shared_partners" ON public.couples_shared FOR ALL
  USING (partner_1_id = auth.uid() OR partner_2_id = auth.uid());

-- couples_expenses
CREATE POLICY "couples_expenses_partners" ON public.couples_expenses FOR ALL
  USING (couple_id IN (
    SELECT id FROM public.couples_shared
    WHERE partner_1_id = auth.uid() OR partner_2_id = auth.uid()
  ));

-- mei_data
CREATE POLICY "mei_data_own_all" ON public.mei_data FOR ALL USING (user_id = auth.uid());

-- mei_revenue
CREATE POLICY "mei_revenue_own_all" ON public.mei_revenue FOR ALL USING (user_id = auth.uid());

-- ============================================================
-- BLOCO 5: FUNCTIONS & TRIGGERS
-- ============================================================

-- updated_at helper
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'profiles', 'families', 'accounts', 'transactions', 'budgets',
    'goals', 'bills', 'credit_card_invoices', 'boletos',
    'open_finance_connections', 'wealth_lab_simulations',
    'academy_progress', 'couples_shared', 'mei_data', 'mei_revenue'
  ]
  LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS set_updated_at ON public.%I;
      CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.%I
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
    ', t, t);
  END LOOP;
END;
$$;

-- Auto create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto update account balance on transaction
CREATE OR REPLACE FUNCTION public.update_account_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.type = 'income' THEN
      UPDATE public.accounts SET balance = balance + NEW.amount WHERE id = NEW.account_id;
    ELSIF NEW.type = 'expense' THEN
      UPDATE public.accounts SET balance = balance - NEW.amount WHERE id = NEW.account_id;
    ELSIF NEW.type = 'transfer' THEN
      UPDATE public.accounts SET balance = balance - NEW.amount WHERE id = NEW.account_id;
      IF NEW.transfer_account_id IS NOT NULL THEN
        UPDATE public.accounts SET balance = balance + NEW.amount WHERE id = NEW.transfer_account_id;
      END IF;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.type = 'income' THEN
      UPDATE public.accounts SET balance = balance - OLD.amount WHERE id = OLD.account_id;
    ELSIF OLD.type = 'expense' THEN
      UPDATE public.accounts SET balance = balance + OLD.amount WHERE id = OLD.account_id;
    ELSIF OLD.type = 'transfer' THEN
      UPDATE public.accounts SET balance = balance + OLD.amount WHERE id = OLD.account_id;
      IF OLD.transfer_account_id IS NOT NULL THEN
        UPDATE public.accounts SET balance = balance - OLD.amount WHERE id = OLD.transfer_account_id;
      END IF;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_transaction_change ON public.transactions;
CREATE TRIGGER on_transaction_change
  AFTER INSERT OR DELETE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_account_balance();

-- Calculate couple balance
CREATE OR REPLACE FUNCTION public.calculate_couple_balance(p_couple_id UUID)
RETURNS TABLE(partner_id UUID, total_paid DECIMAL, should_pay DECIMAL, balance DECIMAL) AS $$
BEGIN
  RETURN QUERY
  WITH expenses AS (
    SELECT ce.paid_by, ce.amount, ce.split_p1, ce.split_p2,
           cs.partner_1_id, cs.partner_2_id
    FROM public.couples_expenses ce
    JOIN public.couples_shared cs ON cs.id = ce.couple_id
    WHERE ce.couple_id = p_couple_id AND ce.is_settled = false
  ),
  partner_totals AS (
    SELECT partner_1_id as pid,
           SUM(CASE WHEN paid_by = partner_1_id THEN amount ELSE 0 END) as paid,
           SUM(amount * split_p1 / 100) as should
    FROM expenses GROUP BY partner_1_id
    UNION ALL
    SELECT partner_2_id as pid,
           SUM(CASE WHEN paid_by = partner_2_id THEN amount ELSE 0 END) as paid,
           SUM(amount * split_p2 / 100) as should
    FROM expenses GROUP BY partner_2_id
  )
  SELECT pid, paid, should, (paid - should) as balance FROM partner_totals;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Calculate MEI annual revenue
CREATE OR REPLACE FUNCTION public.calculate_mei_annual_revenue(p_user_id UUID, p_year INT)
RETURNS DECIMAL AS $$
BEGIN
  RETURN COALESCE(
    (SELECT SUM(gross_revenue) FROM public.mei_revenue
     WHERE user_id = p_user_id AND year = p_year), 0
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- BLOCO 6: DADOS PADRÃO
-- ============================================================

INSERT INTO public.categories (id, name, type, icon, color, is_default) VALUES
  (uuid_generate_v4(), 'Salário', 'income', '💼', '#10b981', true),
  (uuid_generate_v4(), 'Freelance', 'income', '💻', '#3b82f6', true),
  (uuid_generate_v4(), 'Investimentos', 'income', '📈', '#6366f1', true),
  (uuid_generate_v4(), 'Outras Receitas', 'income', '💰', '#f59e0b', true),
  (uuid_generate_v4(), 'Alimentação', 'expense', '🍽️', '#ef4444', true),
  (uuid_generate_v4(), 'Transporte', 'expense', '🚗', '#f97316', true),
  (uuid_generate_v4(), 'Moradia', 'expense', '🏠', '#8b5cf6', true),
  (uuid_generate_v4(), 'Saúde', 'expense', '🏥', '#ec4899', true),
  (uuid_generate_v4(), 'Educação', 'expense', '📚', '#14b8a6', true),
  (uuid_generate_v4(), 'Lazer', 'expense', '🎮', '#a855f7', true),
  (uuid_generate_v4(), 'Compras', 'expense', '🛍️', '#f43f5e', true),
  (uuid_generate_v4(), 'Assinaturas', 'expense', '📱', '#06b6d4', true),
  (uuid_generate_v4(), 'Delivery', 'expense', '🛵', '#fb923c', true),
  (uuid_generate_v4(), 'Streaming', 'expense', '📺', '#7c3aed', true),
  (uuid_generate_v4(), 'Pets', 'expense', '🐾', '#84cc16', true),
  (uuid_generate_v4(), 'Beleza', 'expense', '💄', '#f472b6', true),
  (uuid_generate_v4(), 'Roupas', 'expense', '👗', '#fb7185', true),
  (uuid_generate_v4(), 'Viagem', 'expense', '✈️', '#38bdf8', true),
  (uuid_generate_v4(), 'Impostos', 'expense', '🏛️', '#94a3b8', true),
  (uuid_generate_v4(), 'Seguros', 'expense', '🛡️', '#64748b', true),
  (uuid_generate_v4(), 'Outras Despesas', 'expense', '📋', '#6b7280', true),
  (uuid_generate_v4(), 'Transferência', 'transfer', '↔️', '#a3a3a3', true)
ON CONFLICT DO NOTHING;

-- ============================================================
-- BLOCO 7: REALTIME
-- ============================================================
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'transactions', 'notifications', 'boletos',
    'credit_card_invoices', 'couples_expenses', 'open_finance_connections'
  ]
  LOOP
    BEGIN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    EXCEPTION WHEN others THEN NULL;
    END;
  END LOOP;
END;
$$;

-- ============================================================
-- BLOCO 8: STORAGE BUCKETS
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('avatars', 'avatars', true, 5242880,
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('receipts', 'receipts', false, 10485760,
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']),
  ('exports', 'exports', false, 52428800,
    ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "avatars_public_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');
CREATE POLICY "avatars_user_upload" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "receipts_user_all" ON storage.objects FOR ALL
  USING (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "exports_user_all" ON storage.objects FOR ALL
  USING (bucket_id = 'exports' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================================
-- FIM DO SCHEMA - NEURAFIN HUB v3.0
-- ============================================================
