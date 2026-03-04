import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// ========== GET — Listar cartões com fatura ==========
export async function GET() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        // Buscar contas do tipo credit_card
        const { data: cards, error: cardsErr } = await supabase
            .from('accounts')
            .select('*')
            .eq('user_id', user.id)
            .eq('type', 'credit_card')
            .eq('is_active', true)
            .order('created_at', { ascending: false })

        if (cardsErr) throw cardsErr

        // Buscar transações de fatura (mês atual) para cada cartão
        const now = new Date()
        const cardIds = (cards ?? []).map(c => c.id)

        let invoiceItems: Record<string, { id: string; description: string; amount: number; date: string; category_id: string | null }[]> = {}

        if (cardIds.length > 0) {
            // Buscar transações dos últimos 40 dias pra cobrir ciclo de fatura
            const since = new Date()
            since.setDate(since.getDate() - 40)
            const sinceStr = since.toISOString().split('T')[0]

            const { data: txs, error: txErr } = await supabase
                .from('transactions')
                .select('id, account_id, description, amount, date, category_id')
                .eq('user_id', user.id)
                .eq('type', 'expense')
                .in('account_id', cardIds)
                .gte('date', sinceStr)
                .order('date', { ascending: false })

            if (!txErr && txs) {
                for (const tx of txs) {
                    if (!invoiceItems[tx.account_id]) invoiceItems[tx.account_id] = []
                    invoiceItems[tx.account_id].push({
                        id: tx.id,
                        description: tx.description,
                        amount: Number(tx.amount),
                        date: tx.date,
                        category_id: tx.category_id,
                    })
                }
            }
        }

        // Montar resposta
        const result = (cards ?? []).map(c => {
            const items = invoiceItems[c.id] ?? []
            const usedAmount = items.reduce((s, i) => s + i.amount, 0)

            return {
                id: c.id,
                name: c.name,
                bank_name: c.bank_name,
                last4: (c.bank_code ?? '').slice(-4) || '••••',
                limit: Number(c.credit_limit ?? 0),
                used: usedAmount,
                closing_day: c.closing_day ?? 1,
                due_day: c.due_day ?? 10,
                color: c.color ?? '#1d4ed8',
                icon: c.icon,
                invoice: items.slice(0, 20), // Limitar a 20 lançamentos
            }
        })

        return NextResponse.json({ data: result })
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Internal error'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}

// ========== POST — Criar novo cartão ==========
export async function POST(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await request.json()
        const { name, bank_name, last4, credit_limit, closing_day, due_day, color } = body

        if (!name || !credit_limit) {
            return NextResponse.json({ error: 'Nome e limite são obrigatórios' }, { status: 400 })
        }

        const { data, error } = await supabase
            .from('accounts')
            .insert({
                user_id: user.id,
                name,
                type: 'credit_card' as const,
                bank_name: bank_name || null,
                bank_code: last4 ? `****${last4.slice(-4)}` : null,
                balance: 0,
                credit_limit: parseFloat(credit_limit),
                available_credit: parseFloat(credit_limit),
                closing_day: closing_day ? parseInt(closing_day) : 1,
                due_day: due_day ? parseInt(due_day) : 10,
                color: color || '#1d4ed8',
                include_in_total: false, // Cartão de crédito não soma no saldo
            })
            .select()
            .single()

        if (error) throw error
        return NextResponse.json({ data }, { status: 201 })
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Internal error'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}

// ========== PATCH — Atualizar cartão ==========
export async function PATCH(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await request.json()
        const { id, name, bank_name, last4, credit_limit, closing_day, due_day, color } = body

        if (!id) return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 })

        // Verificar ownership
        const { data: existing } = await supabase
            .from('accounts')
            .select('id')
            .eq('id', id)
            .eq('user_id', user.id)
            .eq('type', 'credit_card')
            .single()

        if (!existing) return NextResponse.json({ error: 'Cartão não encontrado' }, { status: 404 })

        const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
        if (name !== undefined) updates.name = name
        if (bank_name !== undefined) updates.bank_name = bank_name
        if (last4 !== undefined) updates.bank_code = `****${last4.slice(-4)}`
        if (credit_limit !== undefined) {
            updates.credit_limit = parseFloat(credit_limit)
            updates.available_credit = parseFloat(credit_limit)
        }
        if (closing_day !== undefined) updates.closing_day = parseInt(closing_day)
        if (due_day !== undefined) updates.due_day = parseInt(due_day)
        if (color !== undefined) updates.color = color

        const { data, error } = await supabase
            .from('accounts')
            .update(updates)
            .eq('id', id)
            .eq('user_id', user.id)
            .select()
            .single()

        if (error) throw error
        return NextResponse.json({ data })
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Internal error'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}

// ========== DELETE — Desativar cartão ==========
export async function DELETE(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')
        if (!id) return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 })

        const { error } = await supabase
            .from('accounts')
            .update({ is_active: false, updated_at: new Date().toISOString() })
            .eq('id', id)
            .eq('user_id', user.id)
            .eq('type', 'credit_card')

        if (error) throw error
        return NextResponse.json({ success: true })
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Internal error'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
