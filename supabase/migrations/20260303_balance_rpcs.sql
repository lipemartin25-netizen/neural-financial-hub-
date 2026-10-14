-- RPC para adicionar valor ao saldo de uma conta
create or replace function public.update_account_balance_add(
  p_account_id uuid,
  p_amount numeric
)
returns void
language plpgsql
security definer
as $$
begin
  update public.accounts
  set balance = balance + p_amount,
      updated_at = now()
  where id = p_account_id;
end;
$$;

-- RPC para subtrair valor do saldo de uma conta
create or replace function public.update_account_balance_subtract(
  p_account_id uuid,
  p_amount numeric
)
returns void
language plpgsql
security definer
as $$
begin
  update public.accounts
  set balance = balance - p_amount,
      updated_at = now()
  where id = p_account_id;
end;
$$;

-- Summary para Dashboard e contexto da IA
create or replace function public.get_transaction_summary(p_user_id uuid)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_income numeric := 0;
  v_expense numeric := 0;
  v_balance numeric := 0;
  v_last_30 numeric := 0;
  v_month_income numeric := 0;
  v_month_expense numeric := 0;
begin
  -- Totais gerais
  select
    coalesce(sum(case when type = 'income' then amount else 0 end), 0),
    coalesce(sum(case when type = 'expense' then amount else 0 end), 0)
  into v_income, v_expense
  from public.transactions
  where user_id = p_user_id;

  v_balance := v_income - v_expense;

  -- Últimos 30 dias
  select coalesce(sum(amount), 0)
  into v_last_30
  from public.transactions
  where user_id = p_user_id
    and type = 'expense'
    and date >= (current_date - interval '30 days')::date;

  -- Mês atual
  select
    coalesce(sum(case when type = 'income' then amount else 0 end), 0),
    coalesce(sum(case when type = 'expense' then amount else 0 end), 0)
  into v_month_income, v_month_expense
  from public.transactions
  where user_id = p_user_id
    and extract(month from date) = extract(month from current_date)
    and extract(year from date) = extract(year from current_date);

  return jsonb_build_object(
    'total_income', v_income,
    'total_expense', v_expense,
    'total_balance', v_balance,
    'last_30_days_expense', v_last_30,
    'month_income', v_month_income,
    'month_expense', v_month_expense
  );
end;
$$;

revoke all on function public.update_account_balance_add(uuid, numeric) from public;
grant execute on function public.update_account_balance_add(uuid, numeric) to authenticated;

revoke all on function public.update_account_balance_subtract(uuid, numeric) from public;
grant execute on function public.update_account_balance_subtract(uuid, numeric) to authenticated;

revoke all on function public.get_transaction_summary(uuid) from public;
grant execute on function public.get_transaction_summary(uuid) to authenticated;
