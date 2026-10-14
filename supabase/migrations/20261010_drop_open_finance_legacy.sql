-- ==============================================================================
-- NEURAFIN HUB: GOVERNANÇA E ELIMINAÇÃO DEFINITIVA DE OPEN FINANCE / PLUGGY
-- Data: 2026-10-10
--
-- Decisão Arquitetural:
-- O Neurafin Hub opera sob modelo de Cofre Privado e Finanças Manuais/Documentais.
-- Todas as integrações com agregadores bancários externos (Pluggy / Open Finance)
-- foram descontinuadas. Esta migração remove tabelas ativas e dependências legadas.
-- ==============================================================================

-- 1. Remoção de políticas de segurança legadas
DROP POLICY IF EXISTS "Users see own transactions" ON bank_transactions;
DROP POLICY IF EXISTS "Users see own accounts" ON bank_accounts;
DROP POLICY IF EXISTS "Users see own connections" ON bank_connections;

-- 2. Remoção de índices legados
DROP INDEX IF EXISTS idx_bank_transactions_user_date;
DROP INDEX IF EXISTS idx_bank_transactions_account;
DROP INDEX IF EXISTS idx_bank_accounts_connection;

-- 3. Exclusão definitiva das tabelas de conexão bancária de terceiros
DROP TABLE IF EXISTS public.bank_transactions CASCADE;
DROP TABLE IF EXISTS public.bank_accounts CASCADE;
DROP TABLE IF EXISTS public.bank_connections CASCADE;

-- 4. Registro no log de auditoria / metadados do schema
COMMENT ON SCHEMA public IS 'Neurafin Hub - Schema governado, cofre privado e finanças manuais sem Open Finance externo.';
