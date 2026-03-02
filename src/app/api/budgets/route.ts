import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await request.json()
        const { category_id, amount, alert_threshold, period } = body

        if (!category_id || !amount) {
            return NextResponse.json({ error: 'Categoria e limite são obrigatórios' }, { status: 400 })
        }

        // Upsert budget for category (one per category)
        // In our schema right now, there isn't a strict unique constraint on (user_id, category_id, period, month, year), 
        // so we handle it manually by checking if one exists
        const { data: existing } = await supabase
            .from('budgets')
            .select('id')
            .eq('user_id', user.id)
            .eq('category_id', category_id)
            .eq('period', 'monthly')
            .single()

        let result;
        if (existing) {
            const { data, error } = await supabase
                .from('budgets')
                .update({ amount, alert_threshold })
                .eq('id', existing.id)
                .select()
                .single()
            if (error) throw error
            result = data
        } else {
            const { data, error } = await supabase
                .from('budgets')
                .insert({
                    user_id: user.id,
                    category_id,
                    amount,
                    alert_threshold: alert_threshold ?? 80,
                    period: period ?? 'monthly'
                })
                .select()
                .single()
            if (error) throw error
            result = data
        }

        return NextResponse.json({ data: result }, { status: 201 })
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Internal error'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
