import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

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
        const page = parseInt(searchParams.get('page') ?? '1')
        const limit = parseInt(searchParams.get('limit') ?? '20')
        const offset = (page - 1) * limit

        let query = supabase
            .from('transactions')
            .select('*, categories(id, name, icon, color), accounts(id, name, type, color)', { count: 'exact' })
            .eq('user_id', user.id)
            .order('date', { ascending: false })
            .range(offset, offset + limit - 1)

        if (type) query = query.eq('type', type)
        if (accountId) query = query.eq('account_id', accountId)
        if (categoryId) query = query.eq('category_id', categoryId)
        if (dateFrom) query = query.gte('date', dateFrom)
        if (dateTo) query = query.lte('date', dateTo)

        const { data, error, count } = await query
        if (error) throw error

        return NextResponse.json({ data, count, page, limit })
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Internal error'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}

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

        const { data, error } = await supabase
            .from('transactions')
            .insert({
                user_id: user.id,
                account_id,
                amount: parseFloat(amount),
                type,
                description,
                date: date ?? new Date().toISOString().split('T')[0],
                category_id: category_id ?? null,
                notes: notes ?? null,
                is_recurring: is_recurring ?? false,
                tags: tags ?? null,
            })
            .select('*, categories(id, name, icon, color), accounts(id, name, type, color)')
            .single()

        if (error) throw error

        return NextResponse.json({ data }, { status: 201 })
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Internal error'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
