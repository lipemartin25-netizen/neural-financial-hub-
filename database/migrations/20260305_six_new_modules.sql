-- ══════════════════════════════════════════════════════════
-- NEURAFIN HUB — NOVAS TABELAS (6 MÓDULOS) v1.1
-- ══════════════════════════════════════════════════════════

-- 1. BUDGETS (Orçamentos)
CREATE TABLE IF NOT EXISTS public.budgets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
    month DATE NOT NULL,
    planned_amount DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, category_id, month)
);

-- Garantir que a coluna 'month' existe caso a tabela tenha sido criada sem ela anteriormente
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='budgets' AND column_name='month') THEN
        ALTER TABLE public.budgets ADD COLUMN month DATE NOT NULL DEFAULT CURRENT_DATE;
    END IF;
END $$;

-- 2. GOALS (Metas Financeiras)
CREATE TABLE IF NOT EXISTS public.goals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    icon TEXT DEFAULT '🎯',
    target_amount DECIMAL(15,2) NOT NULL,
    current_amount DECIMAL(15,2) DEFAULT 0,
    deadline DATE,
    color TEXT DEFAULT '#D4AF37',
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. ASSETS (Ativos - Balanço Patrimonial)
CREATE TABLE IF NOT EXISTS public.assets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT CHECK (type IN ('property', 'vehicle', 'investment', 'crypto', 'stock', 'fixed_income', 'other')),
    estimated_value DECIMAL(15,2) NOT NULL,
    acquisition_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. LIABILITIES (Passivos - Balanço Patrimonial)
CREATE TABLE IF NOT EXISTS public.liabilities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT CHECK (type IN ('mortgage', 'car_loan', 'credit_card', 'personal_loan', 'student_loan', 'other')),
    total_amount DECIMAL(15,2) NOT NULL,
    remaining_amount DECIMAL(15,2) NOT NULL,
    monthly_payment DECIMAL(15,2),
    interest_rate DECIMAL(5,2),
    due_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. RETIREMENT PLANS (Aposentadoria)
CREATE TABLE IF NOT EXISTS public.retirement_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    current_age INTEGER NOT NULL,
    target_retirement_age INTEGER NOT NULL,
    monthly_income DECIMAL(15,2),
    monthly_expenses DECIMAL(15,2) NOT NULL,
    current_investments DECIMAL(15,2) DEFAULT 0,
    monthly_contribution DECIMAL(15,2) DEFAULT 0,
    expected_return_rate DECIMAL(5,2) DEFAULT 8.0,
    inflation_rate DECIMAL(5,2) DEFAULT 4.0,
    desired_monthly_income DECIMAL(15,2),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. MONTHLY SNAPSHOTS (Histórico de Patrimônio)
CREATE TABLE IF NOT EXISTS public.monthly_snapshots (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    month DATE NOT NULL,
    total_income DECIMAL(15,2) DEFAULT 0,
    total_expenses DECIMAL(15,2) DEFAULT 0,
    total_assets DECIMAL(15,2) DEFAULT 0,
    total_liabilities DECIMAL(15,2) DEFAULT 0,
    net_worth DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, month)
);

-- Garantir que a coluna 'month' existe em snapshots
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='monthly_snapshots' AND column_name='month') THEN
        ALTER TABLE public.monthly_snapshots ADD COLUMN month DATE NOT NULL DEFAULT CURRENT_DATE;
    END IF;
END $$;

-- RLS POLICIES
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.liabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retirement_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_snapshots ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    -- Budgets
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'budgets' AND policyname = 'Users can manage their own budgets') THEN
        CREATE POLICY "Users can manage their own budgets" ON public.budgets FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    END IF;
    -- Goals
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'goals' AND policyname = 'Users can manage their own goals') THEN
        CREATE POLICY "Users can manage their own goals" ON public.goals FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    END IF;
    -- Assets
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'assets' AND policyname = 'Users can manage their own assets') THEN
        CREATE POLICY "Users can manage their own assets" ON public.assets FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    END IF;
    -- Liabilities
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'liabilities' AND policyname = 'Users can manage their own liabilities') THEN
        CREATE POLICY "Users can manage their own liabilities" ON public.liabilities FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    END IF;
    -- Retirement
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'retirement_plans' AND policyname = 'Users can manage their own plans') THEN
        CREATE POLICY "Users can manage their own plans" ON public.retirement_plans FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    END IF;
    -- Snapshots
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'monthly_snapshots' AND policyname = 'Users can manage their own snapshots') THEN
        CREATE POLICY "Users can manage their own snapshots" ON public.monthly_snapshots FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_budgets_user_month ON public.budgets(user_id, month);
CREATE INDEX IF NOT EXISTS idx_goals_user ON public.goals(user_id);
CREATE INDEX IF NOT EXISTS idx_assets_user ON public.assets(user_id);
CREATE INDEX IF NOT EXISTS idx_liabilities_user ON public.liabilities(user_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_user_month ON public.monthly_snapshots(user_id, month);
