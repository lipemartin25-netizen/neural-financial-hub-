-- Tabela de investimentos
create table if not exists public.investments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  ticker varchar(20) not null,
  name varchar(200),
  type varchar(50) not null default 'renda_fixa',
  invested_amount numeric(15,2) not null default 0,
  current_value numeric(15,2) not null default 0,
  monthly_return numeric(8,4) default 0,
  quantity numeric(15,8) default 0,
  average_price numeric(15,4) default 0,
  notes text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Índices
create index if not exists idx_investments_user on public.investments(user_id);
create index if not exists idx_investments_type on public.investments(user_id, type);
create index if not exists idx_investments_ticker on public.investments(user_id, ticker);

-- RLS
alter table public.investments enable row level security;

create policy "Users can view own investments"
  on public.investments for select
  using (auth.uid() = user_id);

create policy "Users can insert own investments"
  on public.investments for insert
  with check (auth.uid() = user_id);

create policy "Users can update own investments"
  on public.investments for update
  using (auth.uid() = user_id);

create policy "Users can delete own investments"
  on public.investments for delete
  using (auth.uid() = user_id);

-- Tipos válidos: renda_fixa, acao, fii, cripto, fundo, etf, coe, previdencia, outros
comment on column public.investments.type is 'renda_fixa | acao | fii | cripto | fundo | etf | coe | previdencia | outros';
comment on column public.investments.monthly_return is 'Retorno mensal em percentual (ex: 1.5 = 1.5%)';
