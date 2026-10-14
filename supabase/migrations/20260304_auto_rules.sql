-- Migration: Create auto_rules table
-- Sprint 2 — Automação IA

CREATE TABLE IF NOT EXISTS public.auto_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  pattern TEXT NOT NULL,
  match_type TEXT NOT NULL CHECK (match_type IN ('contains', 'starts_with', 'exact')) DEFAULT 'contains',
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  rename_to TEXT,
  set_type TEXT CHECK (set_type IN ('income', 'expense', 'transfer')),
  is_active BOOLEAN DEFAULT true,
  times_applied INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.auto_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own rules" ON public.auto_rules;
CREATE POLICY "Users can manage their own rules"
  ON public.auto_rules FOR ALL
  USING (auth.uid() = user_id);

-- Trigger para updated_at (caso não exista a função genérica ainda)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS set_auto_rules_updated_at ON public.auto_rules;
CREATE TRIGGER set_auto_rules_updated_at
  BEFORE UPDATE ON auto_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
