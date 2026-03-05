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
        const { accountId } = await request.json()
        if (!accountId) {
            return NextResponse.json({ error: 'accountId is required' }, { status: 400 })
        }
        // Buscar o bank_account pra pegar o pluggy_account_id
        const { data: bankAccount } = await supabase
            .from('bank_accounts')
            .select('*')
            .eq('id', accountId)
            .eq('user_id', user.id)
            .single()
        if (!bankAccount) {
            return NextResponse.json({ error: 'Account not found' }, { status: 404 })
        }
        const pluggy = getPluggyClient()
        // Buscar transações dos últimos 90 dias
        const now = new Date()
        const from = new Date()
        from.setDate(from.getDate() - 90)
        const transactions = await pluggy.fetchTransactions(
            bankAccount.pluggy_account_id,
            {
                from: from.toISOString().split('T')[0],
                to: now.toISOString().split('T')[0],
                pageSize: 500,
            }
        )
        let imported = 0
        for (const tx of transactions.results) {
            const { error } = await supabase
                .from('bank_transactions')
                .upsert(
                    {
                        user_id: user.id,
                        account_id: bankAccount.id,
                        pluggy_transaction_id: tx.id,
                        description: tx.description || 'Sem descrição',
                        amount: tx.amount,
                        date: tx.date,
                        type: tx.type,
                        category: tx.category || null,
                        payment_method: tx.paymentData?.paymentMethod || null,
                    },
                    { onConflict: 'pluggy_transaction_id' }
                )
            if (!error) imported++
        }
        return NextResponse.json({
            total: transactions.results.length,
            imported,
            message: `${imported} transação(ões) importada(s)`,
        })
    } catch (error: any) {
        console.error('[Pluggy] Transactions sync error:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to sync transactions' },
            { status: 500 }
        )
    }
}
