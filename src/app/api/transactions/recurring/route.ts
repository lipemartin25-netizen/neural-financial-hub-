import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET — listar recorrentes
export async function GET() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { data, error } = await supabase
            .from('recurring_transactions')
            .select(`
        *,
        categories(id, name, icon, color),
        accounts(id, name)
      `)
            .eq('user_id', user.id)
            .eq('is_active', true)
            .order('next_date', { ascending: true })

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ data })
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Internal error'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}

// POST — criar recorrente
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await request.json()
        const { account_id, amount, type, description, category_id, frequency, start_date, notes } = body

        if (!account_id || !amount || !type || !description || !frequency || !start_date) {
            return NextResponse.json({ error: 'Campos obrigatórios: account_id, amount, type, description, frequency, start_date' }, { status: 400 })
        }

        const { data, error } = await supabase
            .from('recurring_transactions')
            .insert({
                user_id: user.id,
                account_id,
                amount,
                type,
                description,
                category_id: category_id || null,
                frequency, // 'daily', 'weekly', 'monthly', 'yearly'
                start_date,
                next_date: start_date,
                notes: notes || null,
                is_active: true,
            })
            .select()
            .single()

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ data }, { status: 201 })
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Internal error'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}

// DELETE — desativar recorrente
export async function DELETE(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')
        if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

        const { error } = await supabase
            .from('recurring_transactions')
            .update({ is_active: false })
            .eq('id', id)
            .eq('user_id', user.id)

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ success: true })
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Internal error'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
