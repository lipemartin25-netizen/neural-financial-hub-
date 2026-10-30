
-- CORREÇÃO DEFINITIVA DE RECURSÃO RLS PARA family_members
DROP POLICY IF EXISTS "view_own_family_members" ON public.family_members;
DROP POLICY IF EXISTS "members_can_view_members" ON public.family_members;
DROP POLICY IF EXISTS "family_members_select" ON public.family_members;
DROP POLICY IF EXISTS "admins_can_manage_members" ON public.family_members;
DROP POLICY IF EXISTS "insert_family_members" ON public.family_members;
DROP POLICY IF EXISTS "update_family_members" ON public.family_members;
DROP POLICY IF EXISTS "delete_family_members" ON public.family_members;

CREATE POLICY "family_members_select_own" ON public.family_members
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "family_members_manage_own" ON public.family_members
  FOR ALL USING (user_id = auth.uid());

-- CORREÇÃO PARA ACCOUNTS E TRANSACTIONS
DROP POLICY IF EXISTS "accounts_family_select" ON public.accounts;
CREATE POLICY "accounts_family_select" ON public.accounts
  FOR SELECT USING (
    user_id = auth.uid() OR (
      is_shared = true AND family_id IN (
        SELECT fm.family_id FROM public.family_members fm WHERE fm.user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "transactions_family_select" ON public.transactions;
CREATE POLICY "transactions_family_select" ON public.transactions
  FOR SELECT USING (
    user_id = auth.uid() OR (
      family_id IN (
        SELECT fm.family_id FROM public.family_members fm WHERE fm.user_id = auth.uid()
      )
    )
  );
