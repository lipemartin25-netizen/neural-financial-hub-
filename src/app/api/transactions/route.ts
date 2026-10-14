import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// ========== GET (já existia — mantido idêntico) ==========
export async function GET(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { searchParams } = new URL(request.url)
        const type = searchParams.get('type')
        const accountId = searchParams.get('account_id')
        const categoryId = searchParams.get('category_id')
        const dateFrom = searchParams.get('date_from')
        const dateTo = searchParams.get('date_to')
        const search = searchParams.get('search')
        const page = parseInt(searchParams.get('page') ?? '1')
        const limit = parseInt(searchParams.get('limit') ?? '20')
        const offset = (page - 1) * limit

        let query = supabase
            .from('transactions')
            .select('*, categories(id, name, icon, color), accounts(id, name, type, color)', { count: 'exact' })
            .eq('user_id', user.id)
            .order('date', { ascending: false })
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1)

        if (type) query = query.eq('type', type)
        if (accountId) query = query.eq('account_id', accountId)
        if (categoryId) query = query.eq('category_id', categoryId)
        if (dateFrom) query = query.gte('date', dateFrom)
        if (dateTo) query = query.lte('date', dateTo)
        if (search) query = query.ilike('description', `%${search}%`)

        const { data, error, count } = await query
        if (error) throw error

        return NextResponse.json({ data, count, page, limit })
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Internal error'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}

// ========== POST (já existia — mantido idêntico) ==========
export async function POST(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await request.json()
        const { account_id, amount, type, description, date, category_id, notes, is_recurring, tags } = body

        if (!account_id || !amount || !type || !description) {
            return NextResponse.json({ error: 'Campos obrigatórios: account_id, amount, type, description' }, { status: 400 })
        }

        // ===== AUTO-CATEGORIZE VIA REGRAS (antes de inserir) =====
        let resolvedCategoryId = category_id ?? null

        if (!resolvedCategoryId) {
            const { data: rules } = await supabase
                .from('auto_rules')
                .select('category_id, pattern, match_type, id, times_applied')
                .eq('user_id', user.id)
                .eq('is_active', true)

            if (rules && rules.length > 0) {
                const desc = description.toLowerCase()
                const matched = rules.find(r => {
                    const p = (r.pattern as string).toLowerCase()
                    if (r.match_type === 'contains') return desc.includes(p)
                    if (r.match_type === 'starts_with') return desc.startsWith(p)
                    if (r.match_type === 'exact') return desc === p
                    return desc.includes(p)
                })

                if (matched && matched.category_id) {
                    resolvedCategoryId = matched.category_id
                    // Incrementar times_applied
                    await supabase.from('auto_rules').update({
                        times_applied: (matched.times_applied ?? 0) + 1,
                        updated_at: new Date().toISOString(),
                    }).eq('id', matched.id)
                }
            }
        }

        const { data, error } = await supabase
            .from('transactions')
            .insert({
                user_id: user.id,
                account_id,
                amount: parseFloat(amount),
                type,
                description,
                date: date ?? new Date().toISOString().split('T')[0],
                category_id: resolvedCategoryId,
                notes: notes ?? null,
                is_recurring: is_recurring ?? false,
                tags: tags ?? null,
                ai_categorized: resolvedCategoryId && !category_id ? true : false,
                ai_confidence: resolvedCategoryId && !category_id ? 1.0 : null,
            })
            .select('*, categories(id, name, icon, color), accounts(id, name, type, color)')
            .single()

        if (error) throw error

        // Atualizar saldo da conta automaticamente
        if (type === 'expense') {
            await supabase.rpc('update_account_balance_subtract', { p_account_id: account_id, p_amount: parseFloat(amount) })
        } else if (type === 'income') {
            await supabase.rpc('update_account_balance_add', { p_account_id: account_id, p_amount: parseFloat(amount) })
        }

        return NextResponse.json({ data }, { status: 201 })
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Internal error'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}

// ========== PATCH (NOVO — atualizar transação) ==========
export async function PATCH(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await request.json()
        const { id, ...updates } = body

        if (!id) {
            return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 })
        }

        // Garantir que o user é dono da transação
        const { data: existing } = await supabase
            .from('transactions')
            .select('id')
            .eq('id', id)
            .eq('user_id', user.id)
            .single()

        if (!existing) {
            return NextResponse.json({ error: 'Transação não encontrada' }, { status: 404 })
        }

        // Limpar campos proibidos
        delete updates.user_id
        delete updates.created_at

        if (updates.amount != null) {
            updates.amount = parseFloat(updates.amount)
        }

        const { data, error } = await supabase
            .from('transactions')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .eq('user_id', user.id)
            .select('*, categories(id, name, icon, color), accounts(id, name, type, color)')
            .single()

        if (error) throw error

        return NextResponse.json({ data })
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Internal error'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}

// ========== DELETE (NOVO — excluir transação) ==========
export async function DELETE(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 })
        }

        // Buscar transação antes de deletar (pra reverter saldo)
        const { data: existing } = await supabase
            .from('transactions')
            .select('id, amount, type, account_id')
            .eq('id', id)
            .eq('user_id', user.id)
            .single()

        if (!existing) {
            return NextResponse.json({ error: 'Transação não encontrada' }, { status: 404 })
        }

        const { error } = await supabase
            .from('transactions')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id)

        if (error) throw error

        // Reverter saldo da conta
        if (existing.account_id) {
            if (existing.type === 'expense') {
                await supabase.rpc('update_account_balance_add', { p_account_id: existing.account_id, p_amount: existing.amount })
            } else if (existing.type === 'income') {
                await supabase.rpc('update_account_balance_subtract', { p_account_id: existing.account_id, p_amount: existing.amount })
            }
        }

        return NextResponse.json({ success: true })
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Internal error'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
