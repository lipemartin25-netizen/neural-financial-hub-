import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const now = new Date()
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
        const prevFirstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0]
        const prevLastDay = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0]

        const [profileRes, accountsRes, txCurRes, txPrevRes, goalsRes, investmentsRes, budgetsRes, boletosRes, categoriesRes] = await Promise.all([
            supabase.from('profiles').select('full_name, monthly_income, neural_score, financial_goal').eq('id', user.id).single(),
            supabase.from('accounts').select('id, name, balance, type, credit_limit').eq('user_id', user.id).eq('is_active', true),
            supabase.from('transactions').select('amount, type, category_id').eq('user_id', user.id).gte('date', firstDay),
            supabase.from('transactions').select('amount, type').eq('user_id', user.id).gte('date', prevFirstDay).lte('date', prevLastDay),
            supabase.from('goals').select('name, target_amount, current_amount, target_date, status').eq('user_id', user.id),
            supabase.from('investments').select('type, invested_amount, current_value').eq('user_id', user.id).eq('is_active', true),
            supabase.from('budgets').select('category_id, amount').eq('user_id', user.id),
            supabase.from('boletos').select('description, amount, due_date, status').eq('user_id', user.id).eq('status', 'pending'),
            supabase.from('categories').select('id, name').eq('user_id', user.id),
        ])

        const profile = profileRes.data
        const accounts = accountsRes.data ?? []
        const txCur = txCurRes.data ?? []
        const txPrev = txPrevRes.data ?? []
        const goals = goalsRes.data ?? []
        const investments = investmentsRes.data ?? []
        const budgets = budgetsRes.data ?? []
        const boletos = boletosRes.data ?? []
        const categories = categoriesRes.data ?? []
        const catMap = new Map(categories.map(c => [c.id, c.name]))

        // ========== Cálculos ==========
        const monthIncome = txCur.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
        const monthExpense = txCur.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)
        const prevIncome = txPrev.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
        const prevExpense = txPrev.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)

        const totalBalance = accounts.filter(a => a.type !== 'credit_card').reduce((s, a) => s + Number(a.balance), 0)
        const totalCreditUsed = accounts.filter(a => a.type === 'credit_card').reduce((s, a) => s + Math.abs(Number(a.balance)), 0)
        const totalCreditLimit = accounts.filter(a => a.type === 'credit_card').reduce((s, a) => s + Number(a.credit_limit ?? 0), 0)

        const totalInvested = investments.reduce((s, i) => s + Number(i.invested_amount ?? 0), 0)
        const totalInvCurrent = investments.reduce((s, i) => s + Number(i.current_value ?? 0), 0)

        const declaredIncome = profile?.monthly_income ? Number(profile.monthly_income) : monthIncome
        const effectiveIncome = declaredIncome > 0 ? declaredIncome : monthIncome

        // ========== 1. Taxa de Poupança ==========
        const savingRate = effectiveIncome > 0 ? ((effectiveIncome - monthExpense) / effectiveIncome) * 100 : 0
        const savingScore = savingRate >= 30 ? 95 : savingRate >= 20 ? 78 : savingRate >= 10 ? 55 : savingRate >= 0 ? 35 : 15

        // ========== 2. Reserva de Emergência ==========
        const avgExpense = prevExpense > 0 ? (monthExpense + prevExpense) / 2 : monthExpense
        const liquidAssets = totalBalance // contas bancárias (sem investimentos de longo prazo)
        const emergencyMonths = avgExpense > 0 ? liquidAssets / avgExpense : 0
        const emergencyScore = emergencyMonths >= 12 ? 98 : emergencyMonths >= 6 ? 85 : emergencyMonths >= 3 ? 60 : emergencyMonths >= 1 ? 35 : 10

        // ========== 3. Endividamento ==========
        const debtTotal = totalCreditUsed + boletos.reduce((s, b) => s + Number(b.amount), 0)
        const debtRatio = effectiveIncome > 0 ? (debtTotal / effectiveIncome) * 100 : 0
        const debtScore = debtRatio <= 10 ? 95 : debtRatio <= 30 ? 75 : debtRatio <= 50 ? 50 : debtRatio <= 80 ? 30 : 10

        // ========== 4. Diversificação ==========
        const invTypes = new Set(investments.map(i => i.type))
        const diversCount = invTypes.size
        const diversScore = diversCount >= 5 ? 95 : diversCount >= 4 ? 80 : diversCount >= 3 ? 65 : diversCount >= 2 ? 45 : diversCount >= 1 ? 30 : 10

        // ========== 5. Orçamento ==========
        const spentByCategory: Record<string, number> = {}
        for (const t of txCur) {
            if (t.type === 'expense' && t.category_id) {
                spentByCategory[t.category_id] = (spentByCategory[t.category_id] ?? 0) + Number(t.amount)
            }
        }
        const budgetOverflows = budgets.filter(b => {
            const spent = spentByCategory[b.category_id] ?? 0
            return spent > Number(b.amount)
        }).length
        const budgetTotal = budgets.length
        const budgetScore = budgetTotal === 0 ? 50 : budgetOverflows === 0 ? 95 : budgetOverflows <= 1 ? 70 : budgetOverflows <= 2 ? 50 : 25

        // ========== 6. Metas ==========
        const activeGoals = goals.filter(g => g.status === 'active' || g.status === 'in_progress')
        const onTrackGoals = activeGoals.filter(g => {
            const pct = Number(g.target_amount) > 0 ? Number(g.current_amount) / Number(g.target_amount) : 0
            return pct >= 0.5
        }).length
        const goalsScore = activeGoals.length === 0 ? 50 : Math.round((onTrackGoals / activeGoals.length) * 100)

        // ========== 7. Rentabilidade ==========
        const invReturn = totalInvested > 0 ? ((totalInvCurrent - totalInvested) / totalInvested) * 100 : 0
        const investScore = invReturn >= 15 ? 95 : invReturn >= 10 ? 80 : invReturn >= 5 ? 65 : invReturn >= 0 ? 45 : 20

        // ========== 8. Compromissos (Boletos) ==========
        const pendingBoletos = boletos.length
        const overdueBoletos = boletos.filter(b => new Date(b.due_date + 'T23:59:59') < now).length
        const boletoScore = overdueBoletos > 0 ? 15 : pendingBoletos === 0 ? 95 : pendingBoletos <= 3 ? 75 : 50

        // ========== Montar métricas ==========
        const getStatus = (score: number) =>
            score >= 80 ? 'excellent' as const : score >= 65 ? 'good' as const : score >= 45 ? 'warning' as const : 'danger' as const

        const metrics = [
            {
                name: 'Taxa de Poupança', score: Math.round(savingScore), status: getStatus(savingScore),
                detail: `Você poupa ${savingRate.toFixed(1)}% da renda`,
                tip: savingRate >= 30 ? 'Excelente! Mantenha acima de 30%' : savingRate >= 20 ? 'Bom! Tente atingir 30%' : 'Reduza gastos para poupar pelo menos 20%',
            },
            {
                name: 'Reserva de Emergência', score: Math.round(emergencyScore), status: getStatus(emergencyScore),
                detail: `${emergencyMonths.toFixed(1)} meses cobertos`,
                tip: emergencyMonths >= 6 ? 'Excelente! Mantenha entre 6-12 meses' : 'Monte uma reserva de pelo menos 6 meses de despesas',
            },
            {
                name: 'Endividamento', score: Math.round(debtScore), status: getStatus(debtScore),
                detail: `Dívidas = ${debtRatio.toFixed(1)}% da renda`,
                tip: debtRatio <= 30 ? 'Endividamento saudável' : 'Priorize quitar dívidas com juros altos',
            },
            {
                name: 'Diversificação', score: Math.round(diversScore), status: getStatus(diversScore),
                detail: `${diversCount} classe${diversCount !== 1 ? 's' : ''} de ativos`,
                tip: diversCount >= 4 ? 'Boa diversificação! Considere investimentos internacionais' : 'Diversifique entre mais classes de ativos',
            },
            {
                name: 'Orçamento', score: Math.round(budgetScore), status: getStatus(budgetScore),
                detail: budgetTotal === 0 ? 'Nenhum orçamento definido' : `${budgetOverflows} de ${budgetTotal} categorias estouraram`,
                tip: budgetTotal === 0 ? 'Defina orçamentos para controlar gastos' : budgetOverflows === 0 ? 'Todos dentro do limite!' : 'Revise as categorias que estouraram',
            },
            {
                name: 'Metas Financeiras', score: Math.round(goalsScore), status: getStatus(goalsScore),
                detail: activeGoals.length === 0 ? 'Nenhuma meta ativa' : `${onTrackGoals} de ${activeGoals.length} metas em dia`,
                tip: activeGoals.length === 0 ? 'Defina metas para manter o foco' : onTrackGoals === activeGoals.length ? 'Todas as metas no caminho!' : 'Aumente aportes nas metas atrasadas',
            },
            {
                name: 'Rentabilidade', score: Math.round(investScore), status: getStatus(investScore),
                detail: investments.length === 0 ? 'Nenhum investimento' : `Retorno: ${invReturn.toFixed(1)}%`,
                tip: investments.length === 0 ? 'Comece a investir para fazer seu dinheiro trabalhar' : invReturn >= 10 ? 'Excelente rendimento!' : 'Revise sua estratégia de investimento',
            },
            {
                name: 'Compromissos', score: Math.round(boletoScore), status: getStatus(boletoScore),
                detail: overdueBoletos > 0 ? `${overdueBoletos} boleto${overdueBoletos > 1 ? 's' : ''} vencido${overdueBoletos > 1 ? 's' : ''}!` : `${pendingBoletos} boleto${pendingBoletos !== 1 ? 's' : ''} pendente${pendingBoletos !== 1 ? 's' : ''}`,
                tip: overdueBoletos > 0 ? 'Pague os boletos vencidos URGENTE!' : pendingBoletos === 0 ? 'Nenhum compromisso pendente!' : 'Fique atento aos prazos',
            },
        ]

        const overallScore = Math.round(metrics.reduce((s, m) => s + m.score, 0) / metrics.length)

        // ========== Insights (baseados nos dados reais) ==========
        const insights: Array<{ icon: string; text: string }> = []

        if (monthExpense > prevExpense && prevExpense > 0) {
            const pctInc = ((monthExpense - prevExpense) / prevExpense * 100).toFixed(0)
            insights.push({ icon: '📊', text: `Despesas subiram ${pctInc}% em relação ao mês passado.` })
        } else if (prevExpense > 0) {
            const pctDec = ((prevExpense - monthExpense) / prevExpense * 100).toFixed(0)
            insights.push({ icon: '✅', text: `Despesas caíram ${pctDec}% vs mês passado. Ótimo!` })
        }

        if (totalInvCurrent > totalInvested && totalInvested > 0) {
            insights.push({ icon: '📈', text: `Seus investimentos rendem ${invReturn.toFixed(1)}% — R$ ${(totalInvCurrent - totalInvested).toFixed(2)} de lucro.` })
        }

        const urgentBoletos = boletos.filter(b => {
            const daysLeft = Math.ceil((new Date(b.due_date + 'T23:59:59').getTime() - now.getTime()) / 86400000)
            return daysLeft <= 3 && daysLeft >= 0
        })
        for (const b of urgentBoletos.slice(0, 2)) {
            const daysLeft = Math.ceil((new Date(b.due_date + 'T23:59:59').getTime() - now.getTime()) / 86400000)
            insights.push({ icon: '⚠️', text: `${b.description ?? 'Boleto'} (R$ ${Number(b.amount).toFixed(2)}) vence em ${daysLeft} dia${daysLeft !== 1 ? 's' : ''}.` })
        }

        if (budgetOverflows > 0) {
            const overflowed = budgets.filter(b => (spentByCategory[b.category_id] ?? 0) > Number(b.amount))
                .map(b => catMap.get(b.category_id) ?? 'categoria').slice(0, 3)
            insights.push({ icon: '🔴', text: `Orçamento estourado em: ${overflowed.join(', ')}.` })
        }

        if (savingRate >= 25) {
            insights.push({ icon: '💰', text: `Taxa de poupança em ${savingRate.toFixed(0)}% — acima da média brasileira!` })
        }

        if (insights.length === 0) {
            insights.push({ icon: '🧠', text: 'Continue monitorando suas finanças. Consistência é a chave!' })
        }

        // ========== Ações recomendadas ==========
        const actions: Array<{ label: string; priority: string; color: string; href: string }> = []

        if (overdueBoletos > 0) actions.push({ label: 'Pagar boletos vencidos', priority: 'Urgente', color: '#f87171', href: '/boletos' })
        if (budgetOverflows > 0) actions.push({ label: 'Revisar orçamentos estourados', priority: 'Alta', color: '#fbbf24', href: '/budgets' })
        if (emergencyMonths < 3) actions.push({ label: 'Montar reserva de emergência', priority: 'Alta', color: '#fbbf24', href: '/goals' })
        if (diversCount < 3 && investments.length > 0) actions.push({ label: 'Diversificar investimentos', priority: 'Média', color: '#60a5fa', href: '/investments' })
        if (activeGoals.length === 0) actions.push({ label: 'Criar metas financeiras', priority: 'Média', color: '#60a5fa', href: '/goals' })
        if (savingRate < 20 && effectiveIncome > 0) actions.push({ label: 'Reduzir despesas para poupar mais', priority: 'Média', color: '#60a5fa', href: '/transactions' })
        if (investments.length === 0) actions.push({ label: 'Começar a investir', priority: 'Média', color: '#60a5fa', href: '/investments' })

        if (actions.length === 0) {
            actions.push({ label: 'Tudo em ordem! Continue assim', priority: 'Info', color: '#34d399', href: '/dashboard' })
        }

        return NextResponse.json({
            data: {
                overallScore,
                metrics,
                insights: insights.slice(0, 5),
                actions: actions.slice(0, 4),
                summary: {
                    monthIncome,
                    monthExpense,
                    totalBalance,
                    totalInvCurrent,
                    emergencyMonths: Math.round(emergencyMonths * 10) / 10,
                    savingRate: Math.round(savingRate * 10) / 10,
                },
            },
        })
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Internal error'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
