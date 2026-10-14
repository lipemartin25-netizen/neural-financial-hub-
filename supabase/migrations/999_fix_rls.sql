-- Fix infinite recursion in family RLS
DROP POLICY IF EXISTS "families_member_select" ON public.families;
CREATE POLICY "families_member_select" ON public.families FOR SELECT
  USING (owner_id = auth.uid()); 

DROP POLICY IF EXISTS "family_members_select" ON public.family_members;
CREATE POLICY "family_members_select" ON public.family_members FOR SELECT
  USING (user_id = auth.uid());
