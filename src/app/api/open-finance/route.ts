import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// Mapeamento de categorias padrão para fallback
const slugToName: Record<string, string> = {
    'food': 'alimentação',
    'transport': 'transporte',
    'housing': 'moradia',
    'health': 'saúde',
    'education': 'educação',
    'entertainment': 'lazer',
    'shopping': 'compras',
    'subscriptions': 'assinaturas',
    'utilities': 'moradia',
    'pets': 'pets',
    'personal': 'beleza',
    'salary': 'salário',
    'investments_return': 'investimentos'
}

// Limpar credenciais de possíveis caracteres invisíveis (\r\n\t literal ou real)
const cleanCredential = (value: string | undefined): string => {
    if (!value) return '';
    return value
        .replace(/\\r\\n/g, '')
        .replace(/\\r/g, '')
        .replace(/\\n/g, '')
        .replace(/[\r\n\t\s]/g, '')
        .trim();
};

const PLUGGY_CLIENT_ID = cleanCredential(process.env.PLUGGY_CLIENT_ID);
const PLUGGY_CLIENT_SECRET = cleanCredential(process.env.PLUGGY_CLIENT_SECRET);
const PLUGGY_API_URL = 'https://api.pluggy.ai';

// Obter API Key da Pluggy via Fetch Direto (mais transparente para debug)
async function getPluggyApiKey(): Promise<string> {
    console.log('[Pluggy] Obtendo API Key...');
    if (!PLUGGY_CLIENT_ID || !PLUGGY_CLIENT_SECRET) {
        throw new Error('Credenciais Pluggy não configuradas no ambiente');
    }

    const response = await fetch(`${PLUGGY_API_URL}/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            clientId: PLUGGY_CLIENT_ID,
            clientSecret: PLUGGY_CLIENT_SECRET,
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('[Pluggy] Erro na autenticação:', response.status, errorText);
        throw new Error(`Erro na autenticação Pluggy: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('[Pluggy] API Key obtida com sucesso');
    return data.apiKey;
}

// Criar Connect Token para o widget
async function createPluggyConnectToken(apiKey: string): Promise<string> {
    console.log('[Pluggy] Criando Connect Token...');
    const response = await fetch(`${PLUGGY_API_URL}/connect_token`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-API-KEY': apiKey,
        },
        body: JSON.stringify({
            options: {
                connectorTypes: [1, 2, 3, 4], // Banks, Investments, Credit Cards, etc.
            }
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('[Pluggy] Erro ao criar connect token:', response.status, errorText);
        throw new Error(`Erro ao criar connect token: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.accessToken;
}

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// GET — Obter connect token ou listar conexões
export async function GET(request: NextRequest) {
    const action = request.nextUrl.searchParams.get('action')
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        if (process.env.OPEN_FINANCE_MODE === 'mock') {
            if (action === 'connect_token') {
                return NextResponse.json({ connectToken: 'mock_access_token_123', success: true, demo: true })
            }
            // Listar conexões simuladas
            const { data: connections } = await supabase
                .from('open_finance_connections')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
            return NextResponse.json({ data: connections ?? [] })
        }
    } catch (err: any) {
        console.error('[Open Finance GET] Erro:', err)
        return NextResponse.json({ 
            error: 'Erro ao processar requisição', 
            details: err.message || 'Unknown error' 
        }, { status: 500 })
    }
}

// POST — Salvar conexão ou Sincronizar
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await request.json()
        const { action, itemId, connectorName, connectorLogo } = body

        // ═══ MOCK MODE INTERCEPTOR ═══
        if (process.env.OPEN_FINANCE_MODE === 'mock') {
            if (action === 'save_connection' || !action) {
                await supabase.from('open_finance_connections').upsert({
                    user_id: user.id,
                    item_id: itemId || `mock-${Date.now()}`,
                    connector_name: connectorName || 'Banco Demo',
                    connector_logo: connectorLogo || 'https://dashboard.pluggy.ai/favicons/favicon-32x32.png',
                    status: 'active',
                    last_sync_at: new Date().toISOString()
                } as any, { onConflict: 'user_id,item_id' })
                return NextResponse.json({ success: true })
            }

            if (action === 'sync') {
                console.log('[Mock Sync] Gerando dados fictícios...')
                // Criar conta fictícia
                const { data: dbAccount } = await supabase.from('accounts').upsert({
                    user_id: user.id,
                    name: connectorName ? `Conta ${connectorName}` : 'Conta Corrente Mock',
                    type: 'checking',
                    bank_name: connectorName || 'Banco Demo',
                    balance: Math.random() * 5000 + 1000,
                    open_finance_id: `mock-acc-${itemId}`,
                } as any, { onConflict: 'open_finance_id' }).select('id').single()

                if (dbAccount) {
                    // Criar 10 transações fictícias
                    const mockTransactions = Array.from({ length: 10 }).map((_, i) => ({
                        user_id: user.id,
                        account_id: dbAccount.id,
                        amount: Math.random() * 200 + 10,
                        type: Math.random() > 0.3 ? 'expense' : 'income',
                        description: ['Uber', 'iFood', 'Amazon', 'Netflix', 'Salário', 'Pix Recebido', 'Supermercado'][Math.floor(Math.random() * 7)],
                        date: new Date(Date.now() - i * 86400000).toISOString().split('T')[0],
                        open_finance_id: `mock-tx-${itemId}-${i}`
                    }))
                    await supabase.from('transactions').upsert(mockTransactions as any, { onConflict: 'open_finance_id' })
                }

                return NextResponse.json({ success: true, imported: 10 })
            }
        }

        // ═══ SINCRONIZAR TRANSAÇÕES (Lógica robusta com SDK) ═══
        const { fetchAccounts, fetchTransactions, fetchItem, mapPluggyCategory } = await import('@/lib/pluggy')

        if (action === 'sync') {
            console.log(`[API Sync] Iniciando sincronização para item: ${itemId}`)
            
            const { data: syncLog } = await supabase.from('open_finance_sync_log').insert({
                user_id: user.id,
                sync_type: 'manual',
                status: 'running',
                date_from: new Date(Date.now() - 90 * 86400000).toISOString().split('T')[0],
                date_to: new Date().toISOString().split('T')[0],
            } as any).select('id').maybeSingle()

            const syncLogId = syncLog?.id

            try {
                const item = await fetchItem(itemId)
                if (['LOGIN_ERROR', 'OUTDATED', 'REVOKED'].includes(item.status as any)) {
                    throw new Error(`Item com status inválido: ${item.status}`)
                }

                const { data: dbCategories } = await supabase.from('categories').select('id, name')
                const categoryMap: Record<string, string> = {}
                dbCategories?.forEach(c => categoryMap[c.name.toLowerCase()] = c.id)

                const { results: pluggyAccounts } = await fetchAccounts(itemId)
                let totalImported = 0

                for (const pa of pluggyAccounts) {
                    // Upsert da conta com mapeamento refinado (baseado no JSON da Pluggy)
                    const { data: dbAccount } = await supabase.from('accounts').upsert({
                        user_id: user.id,
                        name: pa.name || pa.marketingName || 'Conta Pluggy',
                        type: pa.type === 'CREDIT' || pa.subtype === 'CREDIT_CARD' ? 'credit_card' : 
                              pa.subtype === 'SAVINGS_ACCOUNT' ? 'savings' : 
                              ['SECURITY', 'MUTUAL_FUND', 'FIXED_INCOME', 'ETF', 'EQUITY', 'INVESTMENT'].includes(pa.type as string) ? 'investment' : 'checking',
                        bank_name: (pa as any).creditData?.brand || (pa as any).bankData?.brand || 'Banco',
                        balance: pa.balance ?? 0,
                        open_finance_id: pa.id,
                    } as any, { onConflict: 'open_finance_id' }).select('id').single()

                    if (!dbAccount) continue

                    const to = new Date().toISOString().split('T')[0]
                    const from = new Date(Date.now() - 90 * 86400000).toISOString().split('T')[0]
                    
                    let page = 1
                    let hasMore = true
                    while (hasMore) {
                        const txResponse = await fetchTransactions(pa.id, { from, to, page, pageSize: 500 })
                        const txBatch = txResponse.results.map(pt => ({
                            user_id: user.id,
                            account_id: dbAccount.id,
                            amount: Math.abs(pt.amount),
                            type: pt.amount >= 0 ? 'income' : 'expense',
                            description: pt.description || 'Transação',
                            date: (pt.date as any).toISOString?.().split('T')[0] || pt.date,
                            open_finance_id: pt.id,
                            category_id: categoryMap[slugToName[mapPluggyCategory(pt.category)]] || null
                        }))

                        if (txBatch.length > 0) {
                            const { error: txErr } = await supabase.from('transactions').upsert(txBatch as any, { 
                                onConflict: 'open_finance_id',
                                ignoreDuplicates: true 
                            })
                            if (!txErr) totalImported += txBatch.length
                        }

                        if (txResponse.totalPages > page) page++
                        else hasMore = false
                    }
                }

                await supabase.from('open_finance_connections').update({
                    last_sync_at: new Date().toISOString(),
                    sync_status: 'success',
                    total_synced_transactions: totalImported
                }).eq('user_id', user.id).eq('item_id', itemId)

                if (syncLogId) {
                    await supabase.from('open_finance_sync_log').update({
                        status: 'completed',
                        transactions_imported: totalImported,
                        completed_at: new Date().toISOString()
                    }).eq('id', syncLogId)
                }

                return NextResponse.json({ success: true, imported: totalImported })
            } catch (syncErr: any) {
                console.error('[API Sync] Falha:', syncErr)
                if (syncLogId) {
                    await supabase.from('open_finance_sync_log').update({
                        status: 'failed',
                        error_message: syncErr.message,
                        completed_at: new Date().toISOString()
                    }).eq('id', syncLogId)
                }
                throw syncErr
            }
        }

        return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
    } catch (err: any) {
        console.error('[Open Finance POST] Erro:', err)
        return NextResponse.json({ error: err.message || 'Error' }, { status: 500 })
    }
}
