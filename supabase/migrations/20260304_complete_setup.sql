
-- 1. Tabelas Base (com IF NOT EXISTS)
CREATE TABLE IF NOT EXISTS accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- checking, savings, credit, investment, cash
    bank_name TEXT,
    balance DECIMAL(15,2) DEFAULT 0,
    credit_limit DECIMAL(15,2),
    color TEXT DEFAULT '#C9A858',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL significa categoria padrão do sistema
    name TEXT NOT NULL,
    icon TEXT,
    color TEXT,
    type TEXT DEFAULT 'expense', -- income, expense
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    amount DECIMAL(15,2) NOT NULL,
    type TEXT NOT NULL, -- income, expense, transfer
    description TEXT NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT,
    is_recurring BOOLEAN DEFAULT false,
    tags TEXT[],
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    ai_categorized BOOLEAN DEFAULT false,
    ai_confidence FLOAT
);

CREATE TABLE IF NOT EXISTS boletos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    beneficiary_name TEXT,
    amount DECIMAL(15,2) NOT NULL,
    due_date DATE NOT NULL,
    status TEXT DEFAULT 'pending', -- pending, paid, overdue, cancelled, scheduled
    type TEXT,
    barcode TEXT,
    notes TEXT,
    payment_date TIMESTAMPTZ,
    account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
    transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_boletos_user_id ON boletos(user_id);
CREATE INDEX IF NOT EXISTS idx_boletos_due_date ON boletos(due_date);

-- 3. Triggers e Funções Auxiliares

-- Updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON accounts FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_boletos_updated_at BEFORE UPDATE ON boletos FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Automatização de Vencimento
CREATE OR REPLACE FUNCTION mark_overdue_boletos()
RETURNS void AS $$
BEGIN
    UPDATE boletos 
    SET status = 'overdue' 
    WHERE status = 'pending' AND due_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- 4. RLS Policies
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE boletos ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    -- Accounts
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'accounts' AND policyname = 'Users can manage their own accounts') THEN
        CREATE POLICY "Users can manage their own accounts" ON accounts FOR ALL USING (auth.uid() = user_id);
    END IF;

    -- Categories
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'categories' AND policyname = 'Users can see system categories') THEN
        CREATE POLICY "Users can see system categories" ON categories FOR SELECT USING (user_id IS NULL OR auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'categories' AND policyname = 'Users can manage their own categories') THEN
        CREATE POLICY "Users can manage their own categories" ON categories FOR ALL USING (auth.uid() = user_id);
    END IF;

    -- Transactions
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'transactions' AND policyname = 'Users can manage their own transactions') THEN
        CREATE POLICY "Users can manage their own transactions" ON transactions FOR ALL USING (auth.uid() = user_id);
    END IF;

    -- Boletos
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'boletos' AND policyname = 'Users can manage their own boletos') THEN
        CREATE POLICY "Users can manage their own boletos" ON boletos FOR ALL USING (auth.uid() = user_id);
    END IF;
END $$;

-- 5. Seed Categorias Padrão
CREATE OR REPLACE FUNCTION seed_system_categories()
RETURNS void AS $$
BEGIN
    INSERT INTO categories (name, icon, color, type, is_default)
    VALUES 
        ('Alimentação', '🍔', '#f87171', 'expense', true),
        ('Moradia', '🏠', '#60a5fa', 'expense', true),
        ('Transporte', '🚗', '#fbbf24', 'expense', true),
        ('Lazer', '🎮', '#a78bfa', 'expense', true),
        ('Saúde', '🏥', '#34d399', 'expense', true),
        ('Salário', '💸', '#10b981', 'income', true),
        ('Investimento', '📈', '#818cf8', 'income', true)
    ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql;

SELECT seed_system_categories();
