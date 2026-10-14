import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        // Buscar família do user
        const { data: membership } = await supabase
            .from('family_members')
            .select('family_id, role')
            .eq('user_id', user.id)
            .single()

        if (!membership || !['owner', 'admin'].includes(membership.role)) {
            return NextResponse.json({ error: 'Sem permissão para criar orçamentos familiares' }, { status: 403 })
        }

        const body = await request.json()
        const { action, category_id, amount } = body

        if (action === 'create') {
            const { error } = await supabase.from('budgets').insert({
                user_id: user.id,
                family_id: membership.family_id,
                category_id,
                planned_amount: amount,
                month: new Date().toISOString().slice(0, 7) + '-01'
            })

            if (error) return NextResponse.json({ error: error.message }, { status: 500 })
            return NextResponse.json({ success: true })
        }

        return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
    } catch (err: unknown) {
        return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 })
    }
}
