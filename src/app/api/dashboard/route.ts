import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const now = new Date()
        const firstDay = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        const lastDayStr = `${lastDay.getFullYear()}-${String(lastDay.getMonth() + 1).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`

        // ========== Buscar tudo em paralelo ==========
        const [
            accountsRes,
            monthTxRes,
            recentTxRes,
            goalsRes,
            investmentsRes,
            budgetsRes,
            boletosRes,
        ] = await Promise.all([
            // 1. Contas — saldo total
            supabase
                .from('accounts')
                .select('id, name, balance, type, icon, color')
                .eq('user_id', user.id)
                .eq('is_active', true),

            // 2. Transações do mês — receitas/despesas
            supabase
                .from('transactions')
                .select('type, amount, category_id')
                .eq('user_id', user.id)
                .gte('date', firstDay)
                .lte('date', lastDayStr),

            // 3. Últimas 5 transações
            supabase
                .from('transactions')
                .select('id, description, amount, type, category_id, date, created_at')
                .eq('user_id', user.id)
                .order('date', { ascending: false })
                .order('created_at', { ascending: false })
                .limit(5),

            // 4. Metas
            supabase
                .from('goals')
                .select('id, name, target_amount, current_amount, color, icon, status')
                .eq('user_id', user.id)
                .order('priority', { ascending: true })
                .limit(5),

            // 5. Investimentos
            supabase
                .from('investments')
                .select('id, ticker, invested_amount, current_value')
                .eq('user_id', user.id)
                .eq('is_active', true),

            // 6. Orçamentos com gastos
            supabase
                .from('budgets')
                .select('id, category_id, amount, categories(name)')
                .eq('user_id', user.id),

            // 7. Boletos pendentes próximos
            supabase
                .from('boletos')
                .select('id, description, amount, due_date, status')
                .eq('user_id', user.id)
                .eq('status', 'pending')
                .gte('due_date', now.toISOString().split('T')[0])
                .order('due_date', { ascending: true })
                .limit(5),
        ])

        // ========== Processar dados ==========

        // Saldo total das contas
        const accounts = accountsRes.data ?? []
        const totalBalance = accounts.reduce((s, a) => s + Number(a.balance ?? 0), 0)

        // Receitas e despesas do mês
        const monthTx = monthTxRes.data ?? []
        const monthIncome = monthTx
            .filter(t => t.type === 'income')
            .reduce((s, t) => s + Number(t.amount), 0)
        const monthExpense = monthTx
            .filter(t => t.type === 'expense')
            .reduce((s, t) => s + Number(t.amount), 0)

        // Gastos por categoria no mês (pra alertas de orçamento)
        const spentByCategory: Record<string, number> = {}
        for (const t of monthTx) {
            if (t.type === 'expense' && t.category_id) {
                spentByCategory[t.category_id] = (spentByCategory[t.category_id] ?? 0) + Number(t.amount)
            }
        }

        // Últimas transações
        const recentTx = (recentTxRes.data ?? []).map(tx => ({
            id: tx.id,
            description: tx.description,
            amount: Number(tx.amount),
            type: tx.type,
            category_id: tx.category_id,
            date: tx.date,
        }))

        // Metas — top 3 pra preview
        const goals = (goalsRes.data ?? []).map(g => ({
            id: g.id,
            name: g.name,
            target: Number(g.target_amount),
            current: Number(g.current_amount),
            pct: Number(g.target_amount) > 0
                ? Math.round((Number(g.current_amount) / Number(g.target_amount)) * 100)
                : 0,
            color: g.color ?? '#3b82f6',
            icon: g.icon ?? '🎯',
            status: g.status ?? 'active',
        })).slice(0, 3)

        // Investimentos — totais
        const investments = investmentsRes.data ?? []
        const totalInvested = investments.reduce((s, i) => s + Number(i.invested_amount ?? 0), 0)
        const totalInvCurrent = investments.reduce((s, i) => s + Number(i.current_value ?? 0), 0)

        // Alertas dinâmicos
        const alerts: { text: string; type: 'warning' | 'danger'; href: string }[] = []

        // Boletos próximos (próximos 5 dias)
        const fiveDaysFromNow = new Date()
        fiveDaysFromNow.setDate(fiveDaysFromNow.getDate() + 5)
        for (const b of (boletosRes.data ?? [])) {
            const dueDate = new Date(b.due_date + 'T12:00:00')
            if (dueDate <= fiveDaysFromNow) {
                const daysLeft = Math.ceil((dueDate.getTime() - now.getTime()) / 86400000)
                const label = daysLeft <= 0 ? 'vence hoje' : daysLeft === 1 ? 'vence amanhã' : `vence em ${daysLeft} dias`
                alerts.push({
                    text: `Boleto ${b.description ?? 'sem nome'} ${label}`,
                    type: daysLeft <= 1 ? 'danger' : 'warning',
                    href: '/boletos',
                })
            }
        }

        // Orçamentos estourados
        const budgets = budgetsRes.data ?? []
        for (const bg of budgets) {
            const spent = spentByCategory[bg.category_id] ?? 0
            const limit = Number(bg.amount)
            if (limit > 0 && spent > limit) {
                const pct = Math.round((spent / limit) * 100)
                const catName = (bg.categories as { name?: string } | null)?.name ?? 'categoria'
                alerts.push({
                    text: `Orçamento de ${catName} a ${pct}%`,
                    type: 'danger',
                    href: '/budgets',
                })
            } else if (limit > 0 && spent >= limit * 0.8) {
                const pct = Math.round((spent / limit) * 100)
                const catName = (bg.categories as { name?: string } | null)?.name ?? 'categoria'
                alerts.push({
                    text: `Orçamento de ${catName} a ${pct}%`,
                    type: 'warning',
                    href: '/budgets',
                })
            }
        }

        return NextResponse.json({
            data: {
                totalBalance,
                monthIncome,
                monthExpense,
                totalInvested,
                totalInvCurrent,
                recentTx,
                goals,
                alerts: alerts.slice(0, 5), // máx 5 alertas
            },
        })
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Internal error'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
