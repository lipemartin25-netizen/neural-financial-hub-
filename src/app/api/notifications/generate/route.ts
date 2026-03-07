import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const today = new Date().toISOString().split('T')[0]
        const threeDaysFromNow = new Date()
        threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3)
        const threeDays = threeDaysFromNow.toISOString().split('T')[0]

        const notifications: Array<{
            user_id: string; type: string; title: string; message: string; data?: Record<string, unknown>
        }> = []

        // 1. Boletos vencendo em 3 dias
        const { data: upcomingBoletos } = await supabase
            .from('boletos')
            .select('id, beneficiary_name, amount, due_date')
            .eq('user_id', user.id)
            .eq('status', 'pending')
            .gte('due_date', today)
            .lte('due_date', threeDays)

        for (const b of upcomingBoletos ?? []) {
            const existing = await supabase
                .from('notifications')
                .select('id')
                .eq('user_id', user.id)
                .eq('type', 'boleto_due')
                .contains('data', { boleto_id: b.id })
                .limit(1)

            if (!existing.data?.length) {
                const dueDate = new Date(b.due_date + 'T12:00:00')
                const daysDiff = Math.ceil((dueDate.getTime() - new Date().getTime()) / 86400000)
                notifications.push({
                    user_id: user.id,
                    type: 'boleto_due',
                    title: '📄 Boleto vencendo!',
                    message: `${b.beneficiary_name ?? 'Boleto'} de R$ ${Number(b.amount).toFixed(2)} vence ${daysDiff <= 0 ? 'hoje' : `em ${daysDiff} dia${daysDiff > 1 ? 's' : ''}`}.`,
                    data: { boleto_id: b.id },
                })
            }
        }

        // 2. Boletos vencidos
        const { data: overdueBoletos } = await supabase
            .from('boletos')
            .select('id, beneficiary_name, amount, due_date')
            .eq('user_id', user.id)
            .eq('status', 'pending')
            .lt('due_date', today)

        for (const b of overdueBoletos ?? []) {
            // Marcar como overdue
            await supabase.from('boletos').update({ status: 'overdue' }).eq('id', b.id)

            const existing = await supabase
                .from('notifications')
                .select('id')
                .eq('user_id', user.id)
                .eq('type', 'boleto_overdue')
                .contains('data', { boleto_id: b.id })
                .limit(1)

            if (!existing.data?.length) {
                notifications.push({
                    user_id: user.id,
                    type: 'boleto_overdue',
                    title: '🔴 Boleto vencido!',
                    message: `${b.beneficiary_name ?? 'Boleto'} de R$ ${Number(b.amount).toFixed(2)} venceu em ${new Date(b.due_date + 'T12:00:00').toLocaleDateString('pt-BR')}.`,
                    data: { boleto_id: b.id },
                })
            }
        }

        // 3. Orçamento estourado (> 90%)
        const currentMonth = new Date().getMonth() + 1
        const currentYear = new Date().getFullYear()
        const monthStart = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`
        const monthEnd = `${currentYear}-${String(currentMonth).padStart(2, '0')}-31`

        const { data: budgets } = await supabase
            .from('budgets')
            .select('id, category_id, amount, alert_threshold, categories(name, icon)')
            .eq('user_id', user.id)

        for (const budget of budgets ?? []) {
            const { data: txs } = await supabase
                .from('transactions')
                .select('amount')
                .eq('user_id', user.id)
                .eq('type', 'expense')
                .eq('category_id', budget.category_id)
                .gte('date', monthStart)
                .lte('date', monthEnd)

            const spent = (txs ?? []).reduce((s, t) => s + Number(t.amount), 0)
            const pct = budget.amount > 0 ? (spent / budget.amount) * 100 : 0
            const threshold = budget.alert_threshold ?? 80

            if (pct >= threshold) {
                const categories = budget.categories as any
                const catData = Array.isArray(categories) ? categories[0] : categories
                const catName = catData?.name ?? 'Categoria'
                const catIcon = catData?.icon ?? '📊'

                const existing = await supabase
                    .from('notifications')
                    .select('id')
                    .eq('user_id', user.id)
                    .eq('type', 'budget_alert')
                    .contains('data', { budget_id: budget.id, month: currentMonth })
                    .limit(1)

                if (!existing.data?.length) {
                    notifications.push({
                        user_id: user.id,
                        type: 'budget_alert',
                        title: pct >= 100 ? `🔴 Orçamento estourado!` : `⚠️ Orçamento quase no limite`,
                        message: `${catIcon} ${catName}: R$ ${spent.toFixed(2)} de R$ ${budget.amount.toFixed(2)} (${pct.toFixed(0)}%).`,
                        data: { budget_id: budget.id, month: currentMonth, year: currentYear },
                    })
                }
            }
        }

        // 4. Meta próxima de ser alcançada (> 90%)
        const { data: goals } = await supabase
            .from('goals')
            .select('id, name, icon, target_amount, current_amount')
            .eq('user_id', user.id)
            .eq('is_completed', false)

        for (const goal of goals ?? []) {
            const pct = goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0
            if (pct >= 90) {
                const existing = await supabase
                    .from('notifications')
                    .select('id')
                    .eq('user_id', user.id)
                    .eq('type', 'goal_almost')
                    .contains('data', { goal_id: goal.id })
                    .limit(1)

                if (!existing.data?.length) {
                    notifications.push({
                        user_id: user.id,
                        type: 'goal_almost',
                        title: '🎯 Meta quase alcançada!',
                        message: `${goal.icon} ${goal.name}: ${pct.toFixed(0)}% concluída! Faltam R$ ${(goal.target_amount - goal.current_amount).toFixed(2)}.`,
                        data: { goal_id: goal.id },
                    })
                }
            }
        }

        // Inserir todas as notificações
        if (notifications.length > 0) {
            await supabase.from('notifications').insert(notifications)
        }

        return NextResponse.json({ data: { generated: notifications.length } })
    } catch (err: unknown) {
        return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 })
    }
}
