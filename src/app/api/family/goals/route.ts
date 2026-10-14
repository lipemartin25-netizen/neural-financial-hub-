import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// POST — criar meta familiar ou contribuir
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await request.json()
        const { action } = body

        // Buscar membership
        const { data: membership } = await supabase
            .from('family_members')
            .select('id, family_id, role')
            .eq('user_id', user.id)
            .single()

        if (!membership) return NextResponse.json({ error: 'Não está em uma família' }, { status: 400 })

        switch (action) {
            case 'create_goal': {
                const { name, icon, target_amount, deadline } = body
                if (!name || !target_amount) return NextResponse.json({ error: 'Nome e valor obrigatórios' }, { status: 400 })

                if (membership.role === 'viewer') {
                    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
                }

                const { data, error } = await supabase
                    .from('family_goals')
                    .insert({
                        family_id: membership.family_id,
                        name,
                        icon: icon ?? '🎯',
                        target_amount: parseFloat(target_amount),
                        deadline: deadline || null,
                        created_by: user.id,
                    })
                    .select()
                    .single()

                if (error) return NextResponse.json({ error: error.message }, { status: 500 })
                return NextResponse.json({ data })
            }

            case 'contribute': {
                const { goal_id, amount, note } = body
                if (!goal_id || !amount) return NextResponse.json({ error: 'Dados obrigatórios' }, { status: 400 })

                const contributionAmount = parseFloat(amount)

                // Inserir contribuição
                const { error: contErr } = await supabase
                    .from('family_goal_contributions')
                    .insert({
                        family_goal_id: goal_id,
                        member_id: membership.id,
                        amount: contributionAmount,
                        note: note || null,
                    })

                if (contErr) return NextResponse.json({ error: contErr.message }, { status: 500 })

                // Atualizar current_amount da meta
                const { data: goal } = await supabase
                    .from('family_goals')
                    .select('current_amount, target_amount')
                    .eq('id', goal_id)
                    .single()

                if (goal) {
                    const newAmount = (goal.current_amount ?? 0) + contributionAmount
                    const isCompleted = newAmount >= goal.target_amount
                    await supabase.from('family_goals').update({
                        current_amount: newAmount,
                        is_completed: isCompleted,
                    }).eq('id', goal_id)
                }

                return NextResponse.json({ success: true })
            }

            default:
                return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
        }
    } catch (err: unknown) {
        return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 })
    }
}
