import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await request.json()
        const { name, target_amount, current_amount, target_date, monthly_contribution, icon, color } = body

        if (!name || !target_amount) {
            return NextResponse.json({ error: 'Nome e Valor Total são obrigatórios' }, { status: 400 })
        }

        const { data, error } = await supabase
            .from('goals')
            .insert({
                user_id: user.id,
                name,
                target_amount,
                current_amount: current_amount || 0,
                target_date: target_date || null,
                monthly_contribution: monthly_contribution || null,
                icon: icon || '🎯',
                color: color || '#3b82f6',
                priority: 1 // default priority
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
