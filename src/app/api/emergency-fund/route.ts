import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const now = new Date()

        // ── Buscar dados em paralelo ──
        const [profileRes, accountsRes, txRes, goalsRes] = await Promise.all([
            supabase
                .from('profiles')
                .select('monthly_income')
                .eq('id', user.id)
                .single(),
            supabase
                .from('accounts')
                .select('id, name, balance, type')
                .eq('user_id', user.id)
                .eq('is_active', true),
            // Últimos 6 meses de despesas para calcular média
            supabase
                .from('transactions')
                .select('amount, type, date')
                .eq('user_id', user.id)
                .eq('type', 'expense')
                .gte('date', new Date(now.getFullYear(), now.getMonth() - 6, 1).toISOString().split('T')[0]),
            // Meta de reserva (se existir)
            supabase
                .from('goals')
                .select('id, name, target_amount, current_amount, status')
                .eq('user_id', user.id)
                .ilike('name', '%reserva%')
                .limit(1),
        ])

        const profile = profileRes.data
        const accounts = accountsRes.data ?? []
        const transactions = txRes.data ?? []
        const emergencyGoal = (goalsRes.data ?? [])[0] ?? null

        // ── Calcular despesa média mensal (últimos 6 meses) ──
        const monthlyExpenses: Record<string, number> = {}
        for (const tx of transactions) {
            const key = tx.date.substring(0, 7) // YYYY-MM
            monthlyExpenses[key] = (monthlyExpenses[key] ?? 0) + Number(tx.amount)
        }

        const months = Object.keys(monthlyExpenses)
        const avgMonthlyExpense = months.length > 0
            ? Object.values(monthlyExpenses).reduce((s, v) => s + v, 0) / months.length
            : Number(profile?.monthly_income ?? 5000) * 0.7 // fallback: 70% da renda

        // ── Metas de reserva (3, 6, 12 meses) ──
        const targets = {
            minimum: avgMonthlyExpense * 3,   // 3 meses — mínimo
            recommended: avgMonthlyExpense * 6, // 6 meses — recomendado
            comfortable: avgMonthlyExpense * 12, // 12 meses — confortável
        }

        // ── Saldo atual em contas líquidas (corrente + poupança + carteira) ──
        const liquidTypes = ['checking', 'savings', 'cash', 'wallet']
        const liquidAccounts = accounts.filter(a => liquidTypes.includes(a.type))
        const totalLiquid = liquidAccounts.reduce((s, a) => s + Number(a.balance), 0)

        // Se tem meta de reserva, usar o current_amount dela; senão, estimar com saldo líquido
        const currentReserve = emergencyGoal
            ? Number(emergencyGoal.current_amount)
            : totalLiquid * 0.3 // Estima 30% do líquido como reserva se não tem meta

        // ── Calcular status e progresso ──
        const targetAmount = targets.recommended // Meta padrão: 6 meses
        const progress = targetAmount > 0 ? Math.min((currentReserve / targetAmount) * 100, 100) : 0

        let status: 'critical' | 'building' | 'almost' | 'complete'
        if (progress >= 100) status = 'complete'
        else if (progress >= 75) status = 'almost'
        else if (progress >= 25) status = 'building'
        else status = 'critical'

        // ── Meses cobertos ──
        const monthsCovered = avgMonthlyExpense > 0
            ? currentReserve / avgMonthlyExpense
            : 0

        // ── Quanto falta e tempo estimado para atingir ──
        const remaining = Math.max(0, targetAmount - currentReserve)
        const monthlyIncome = Number(profile?.monthly_income ?? 0)
        const suggestedMonthlySaving = monthlyIncome > 0
            ? Math.min(monthlyIncome * 0.2, remaining) // 20% da renda ou o que falta
            : remaining / 12

        const monthsToComplete = suggestedMonthlySaving > 0
            ? Math.ceil(remaining / suggestedMonthlySaving)
            : 0

        // ── Dicas personalizadas ──
        const tips: Array<{ icon: string; text: string; priority: 'high' | 'medium' | 'low' }> = []
        if (status === 'critical') {
            tips.push({
                icon: '🚨',
                text: `Sua reserva cobre apenas ${monthsCovered.toFixed(1)} meses. O mínimo recomendado é 3 meses. Priorize construir essa base antes de investir.`,
                priority: 'high',
            })
        }
        if (status === 'building') {
            tips.push({
                icon: '💪',
                text: `Bom progresso! Você já tem ${monthsCovered.toFixed(1)} meses cobertos. Continue aportando ${fmt(suggestedMonthlySaving)}/mês para atingir a meta em ${monthsToComplete} meses.`,
                priority: 'medium',
            })
        }
        if (status === 'almost') {
            tips.push({
                icon: '🎯',
                text: `Quase lá! Faltam apenas ${fmt(remaining)} para completar sua reserva de 6 meses.`,
                priority: 'medium',
            })
        }
        if (status === 'complete') {
            tips.push({
                icon: '🎉',
                text: `Parabéns! Sua reserva de emergência está completa com ${monthsCovered.toFixed(1)} meses de cobertura. Agora foque em investimentos de longo prazo.`,
                priority: 'low',
            })
        }
        if (!emergencyGoal) {
            tips.push({
                icon: '💡',
                text: 'Dica: Crie uma meta chamada "Reserva de Emergência" na página de Metas para acompanhar seu progresso de forma precisa.',
                priority: 'medium',
            })
        }
        if (liquidAccounts.length === 0) {
            tips.push({
                icon: '🏦',
                text: 'Cadastre suas contas bancárias para que possamos calcular sua liquidez real.',
                priority: 'high',
            })
        }

        // ── Onde guardar a reserva (sugestões) ──
        const suggestions = [
            { name: 'CDB Liquidez Diária', desc: 'Rende ~100% CDI com resgate imediato', risk: 'Muito Baixo', color: '#10B981' },
            { name: 'Tesouro Selic', desc: 'Título público mais seguro do Brasil', risk: 'Muito Baixo', color: '#3B82F6' },
            { name: 'Poupança', desc: 'Rende menos, mas é isenta de IR', risk: 'Muito Baixo', color: '#F59E0B' },
            { name: 'Fundo DI / RF', desc: 'Fundos de renda fixa com liquidez D+0/D+1', risk: 'Baixo', color: '#8B5CF6' },
        ]

        return NextResponse.json({
            data: {
                currentReserve,
                avgMonthlyExpense: Math.round(avgMonthlyExpense * 100) / 100,
                monthsCovered: Math.round(monthsCovered * 10) / 10,
                targets,
                targetAmount,
                progress: Math.round(progress * 10) / 10,
                status,
                remaining: Math.round(remaining * 100) / 100,
                suggestedMonthlySaving: Math.round(suggestedMonthlySaving * 100) / 100,
                monthsToComplete,
                monthlyIncome,
                liquidAccounts: liquidAccounts.map(a => ({
                    id: a.id, name: a.name, balance: Number(a.balance), type: a.type,
                })),
                totalLiquid,
                hasGoal: !!emergencyGoal,
                goalId: emergencyGoal?.id ?? null,
                tips,
                suggestions,
                monthsAnalyzed: months.length,
            },
        })
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Internal error'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}

function fmt(v: number) {
    return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
