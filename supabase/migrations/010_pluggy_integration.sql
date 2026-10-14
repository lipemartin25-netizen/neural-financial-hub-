-- ========================================
-- SPRINT 9: OPEN FINANCE (Pluggy Integration)
-- ========================================

-- Conexões bancárias do usuário
CREATE TABLE IF NOT EXISTS public.bank_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  pluggy_item_id TEXT NOT NULL UNIQUE,
  connector_name TEXT NOT NULL,        -- Ex: "Nubank", "Itaú"
  connector_logo TEXT,
  status TEXT DEFAULT 'CONNECTED',     -- CONNECTED, OUTDATED, LOGIN_ERROR
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Contas bancárias
CREATE TABLE IF NOT EXISTS public.bank_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  connection_id UUID REFERENCES bank_connections(id) ON DELETE CASCADE NOT NULL,
  pluggy_account_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,                  -- BANK, CREDIT
  balance DECIMAL(15,2) DEFAULT 0,
  currency_code TEXT DEFAULT 'BRL',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Transações importadas
CREATE TABLE IF NOT EXISTS public.bank_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  account_id UUID REFERENCES bank_accounts(id) ON DELETE CASCADE NOT NULL,
  pluggy_transaction_id TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  type TEXT,                           -- DEBIT, CREDIT
  category TEXT,
  payment_method TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE bank_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_transactions ENABLE ROW LEVEL SECURITY;

-- Políticas
DROP POLICY IF EXISTS "Users see own connections" ON bank_connections;
CREATE POLICY "Users see own connections" ON bank_connections FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users see own accounts" ON bank_accounts;
CREATE POLICY "Users see own accounts" ON bank_accounts FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users see own transactions" ON bank_transactions;
CREATE POLICY "Users see own transactions" ON bank_transactions FOR ALL USING (auth.uid() = user_id);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_bank_transactions_user_date ON bank_transactions(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_account ON bank_transactions(account_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_connection ON bank_accounts(connection_id);
