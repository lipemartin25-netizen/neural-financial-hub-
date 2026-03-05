import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getPluggyClient } from '@/lib/pluggy'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
    try {
        const cookieStore = await cookies()
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll()
                    },
                    setAll() { },
                },
            }
        )
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        const { itemId } = await request.json()
        if (!itemId) {
            return NextResponse.json({ error: 'itemId is required' }, { status: 400 })
        }
        const pluggy = getPluggyClient()
        // Buscar dados do item (conexão)
        const item = await pluggy.fetchItem(itemId)
        // Salvar/atualizar conexão bancária
        const { data: connection, error: connError } = await supabase
            .from('bank_connections')
            .upsert(
                {
                    user_id: user.id,
                    pluggy_item_id: itemId,
                    connector_name: item.connector?.name || 'Banco',
                    connector_logo: item.connector?.imageUrl || null,
                    status: item.status,
                    last_sync_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                },
                { onConflict: 'pluggy_item_id' }
            )
            .select()
            .single()
        if (connError) {
            console.error('[Pluggy] Connection upsert error:', connError)
            return NextResponse.json({ error: 'Failed to save connection' }, { status: 500 })
        }
        // Buscar contas do item
        const accounts = await pluggy.fetchAccounts(itemId)
        const savedAccounts = []
        for (const account of accounts.results) {
            const { data: savedAccount, error: accError } = await supabase
                .from('bank_accounts')
                .upsert(
                    {
                        user_id: user.id,
                        connection_id: connection.id,
                        pluggy_account_id: account.id,
                        name: account.name || account.type,
                        type: account.type,
                        balance: account.balance ?? 0,
                        currency_code: account.currencyCode || 'BRL',
                        updated_at: new Date().toISOString(),
                    },
                    { onConflict: 'pluggy_account_id' }
                )
                .select()
                .single()
            if (!accError && savedAccount) {
                savedAccounts.push(savedAccount)
            }
        }
        return NextResponse.json({
            connection,
            accounts: savedAccounts,
            message: `${savedAccounts.length} conta(s) sincronizada(s)`,
        })
    } catch (error: any) {
        console.error('[Pluggy] Accounts sync error:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to sync accounts' },
            { status: 500 }
        )
    }
}
