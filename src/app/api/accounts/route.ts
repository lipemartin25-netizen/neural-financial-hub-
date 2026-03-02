import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await request.json()
        const { name, type, color, balance, include_in_total, credit_limit, closing_day, due_day } = body

        if (!name || !type) {
            return NextResponse.json({ error: 'Nome e tipo são obrigatórios' }, { status: 400 })
        }

        const { data, error } = await supabase
            .from('accounts')
            .insert({
                user_id: user.id,
                name,
                type,
                color: color ?? '#6366f1',
                balance: balance ?? 0,
                include_in_total: include_in_total ?? true,
                credit_limit: credit_limit || null,
                closing_day: closing_day || null,
                due_day: due_day || null
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
