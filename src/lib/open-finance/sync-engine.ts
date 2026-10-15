// src/lib/open-finance/sync-engine.ts
// IMPLEMENTAR EXATAMENTE ESTE FLUXO:

/*
============================================================
FLUXO DE SINCRONIZAÇÃO OPEN FINANCE (90 DIAS):
============================================================

1. CONEXÃO INICIAL:
   - User seleciona banco (40+ bancos BR disponíveis)
   - Redireciona para tela de consentimento (mock ou real)
   - User autoriza permissões: contas, transações, cartões, boletos
   - Callback salva consent_id encrypted no banco
   - Cria registro em open_finance_connections

2. SYNC INICIAL (90 DIAS):
   - Dispara job: sync_type = 'initial_90_days'
   - Busca TODAS transações dos últimos 90 dias
   - Para CADA conta encontrada:
     a. Cria account no app (checking, savings, credit_card)
     b. Importa saldo atual
   - Para CADA transação encontrada:
     a. Verifica duplicata (open_finance_id)
     b. Classifica tipo: income | expense | transfer
     c. ENVIA PARA IA categorizar automaticamente
     d. Salva com ai_categorized = true, ai_confidence
   - Para CADA fatura de cartão:
     a. Cria credit_card_invoice
     b. Importa cada transação da fatura
     c. Categoriza cada uma via IA
   - Para CADA boleto DDA detectado:
     a. Cria registro em boletos
     b. Identifica tipo (utility, tax, rent, etc)
     c. Vincula à categoria automaticamente
   - Salva sync_log com estatísticas

3. SYNC INCREMENTAL (DIÁRIA):
   - Roda via cron a cada 6h
   - Busca apenas transações novas (desde last_sync_at)
   - Mesmo fluxo de categorização
   - Atualiza saldos

4. CATEGORIZAÇÃO IA EM BATCH:
   - Agrupa transações em lotes de 20
   - Envia para OpenAI (ou Gemini fallback)
   - Prompt inclui: descrição, valor, data, instituição
   - IA retorna: categoria, subcategoria, confiança
   - Se confiança < 0.7: marca para review manual
   - User pode aceitar/corrigir na tela de review
   - Correções do user treinam futuras categorizações

5. BANCOS SUPORTADOS (MOCK REALISTA):
   Nubank, Itaú, Bradesco, Santander, Banco do Brasil,
   Caixa, Inter, C6, Original, BTG, Safra, Sicredi,
   Sicoob, Banrisul, PicPay, Mercado Pago, PagBank,
   Neon, Next, Iti, Will Bank, Pan, BMG, Daycoval,
   Modal, Pine, Agibank, Sofisa, BS2, Stone, Gerencianet,
   Asaas, Rendimento, XP, Rico, Clear, Genial, Avenue,
   Wise, Revolut
*/

// INTERFACES:
export interface SyncResult {
    connectionId: string;
    syncType: 'initial_90_days' | 'incremental' | 'manual' | 'full_refresh';
    status: 'completed' | 'partial' | 'failed';
    stats: {
        transactionsFound: number;
        transactionsImported: number;
        transactionsCategorized: number;
        transactionsDuplicate: number;
        boletosFound: number;
        boletosImported: number;
        accountsCreated: number;
        invoicesImported: number;
    };
    durationMs: number;
    errors?: string[];
}

// IMPLEMENTAR:
// - connectInstitution(userId, institutionId) → redirect URL
// - handleCallback(consentId, code) → save connection
// - syncInitial90Days(connectionId) → SyncResult
// - syncIncremental(connectionId) → SyncResult
// - categorizeBatch(transactions[]) → categorized[]
// - reviewCategorizationPage → UI para aceitar/corrigir
// - revokeConsent(connectionId) → void
// - refreshConsent(connectionId) → void
//
// MOCK MODE (OPEN_FINANCE_MODE=mock):
// - Gera dados realistas de cada banco
// - Simula delay de 2-5 segundos
// - Gera 150-300 transações por conta nos 90 dias
// - Mix realista: 70% despesas, 25% receitas, 5% transferências
// - Descrições realistas em PT-BR (Uber, iFood, Netflix, etc.)
// - Saldos realistas por tipo de banco
