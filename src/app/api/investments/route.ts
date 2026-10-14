import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// ========== GET ==========
export async function GET(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { searchParams } = new URL(request.url)
        const type = searchParams.get('type')

        let query = supabase
            .from('investments')
            .select('*')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .order('current_value', { ascending: false })

        if (type) query = query.eq('type', type)

        const { data, error } = await query
        if (error) throw error

        return NextResponse.json({ data })
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Internal error'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}

// ========== POST ==========
export async function POST(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await request.json()
        const { ticker, name, type, invested_amount, current_value, monthly_return, quantity, average_price, notes } = body

        if (!ticker || !invested_amount) {
            return NextResponse.json({ error: 'Ticker e valor investido são obrigatórios' }, { status: 400 })
        }

        const investedNum = parseFloat(invested_amount)
        const currentNum = current_value ? parseFloat(current_value) : investedNum

        const { data, error } = await supabase
            .from('investments')
            .insert({
                user_id: user.id,
                ticker: ticker.toUpperCase().trim(),
                name: name || ticker.toUpperCase().trim(),
                type: type || 'renda_fixa',
                invested_amount: investedNum,
                current_value: currentNum,
                monthly_return: monthly_return ? parseFloat(monthly_return) : 0,
                quantity: quantity ? parseFloat(quantity) : 0,
                average_price: average_price ? parseFloat(average_price) : 0,
                notes: notes || null,
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

// ========== PATCH ==========
export async function PATCH(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await request.json()
        const { id, ...updates } = body

        if (!id) return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 })

        // Verify ownership
        const { data: existing } = await supabase
            .from('investments')
            .select('id')
            .eq('id', id)
            .eq('user_id', user.id)
            .single()

        if (!existing) return NextResponse.json({ error: 'Investimento não encontrado' }, { status: 404 })

        delete updates.user_id
        delete updates.created_at

        if (updates.invested_amount != null) updates.invested_amount = parseFloat(updates.invested_amount)
        if (updates.current_value != null) updates.current_value = parseFloat(updates.current_value)
        if (updates.monthly_return != null) updates.monthly_return = parseFloat(updates.monthly_return)
        if (updates.quantity != null) updates.quantity = parseFloat(updates.quantity)
        if (updates.average_price != null) updates.average_price = parseFloat(updates.average_price)
        if (updates.ticker) updates.ticker = updates.ticker.toUpperCase().trim()

        const { data, error } = await supabase
            .from('investments')
            .update({ ...updates, updated_at: new Date().toISOString() })
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

// ========== DELETE ==========
export async function DELETE(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 })

        // Soft delete
        const { error } = await supabase
            .from('investments')
            .update({ is_active: false, updated_at: new Date().toISOString() })
            .eq('id', id)
            .eq('user_id', user.id)

        if (error) throw error
        return NextResponse.json({ success: true })
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Internal error'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
