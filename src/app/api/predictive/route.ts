import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { generatePredictiveInsights } from '@/lib/ai/predictive'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        // 1. Buscar dados históricos do usuário para alimentar a IA
        const threeMonthsAgo = new Date()
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
        const threeMonthsAgoStr = threeMonthsAgo.toISOString().split('T')[0]

        const [txRes, accountsRes, profileRes] = await Promise.all([
            // Transações dos últimos 90 dias
            supabase
                .from('transactions')
                .select('amount, type, date, description, category_id, categories(name)')
                .eq('user_id', user.id)
                .gte('date', threeMonthsAgoStr),

            // Saldos atuais
            supabase
                .from('accounts')
                .select('balance')
                .eq('user_id', user.id),

            // Perfil
            supabase
                .from('profiles')
                .select('full_name')
                .eq('id', user.id)
                .single()
        ])

        const transactions = txRes.data ?? []
        const currentBalance = (accountsRes.data ?? []).reduce((s, a) => s + Number(a.balance), 0)
        const userName = profileRes.data?.full_name || 'usuário'

        // 2. Agrupar dados para o motor preditivo
        // Expenses by month
        const monthlyMap: Record<string, number> = {}
        const catMap: Record<string, number> = {}
        const recurring: Array<{ description: string, amount: number }> = []

        transactions.forEach(tx => {
            const amount = Number(tx.amount)
            if (tx.type === 'expense') {
                const month = tx.date.substring(0, 7) // YYYY-MM
                monthlyMap[month] = (monthlyMap[month] || 0) + amount

                const catName = (tx.categories as any)?.name || 'Outros'
                catMap[catName] = (catMap[catName] || 0) + amount

                // Heurística simples para recorrentes: msm descrição mais de 2x em meses diferentes
                // (Aqui poderíamos ter uma lógica mais complexa, mas vamos simplificar para o MVP)
            }
        })

        const last3MonthsExpenses = Object.entries(monthlyMap)
            .map(([month, amount]) => ({ month, amount }))
            .sort((a, b) => a.month.localeCompare(b.month))
            .slice(-3)

        const recentCategories = Object.entries(catMap)
            .map(([name, amount]) => ({ name, amount }))
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 5)

        // 3. Chamar a IA para gerar os insights
        const insights = await generatePredictiveInsights(userName, {
            last3MonthsExpenses,
            recurringExpenses: [], // TODO: Identificar recorrentes reais
            currentBalance,
            recentCategories
        })

        // 4. Salvar log da interação (opcional, mas bom para auditoria)
        await supabase.from('ai_interactions').insert({
            user_id: user.id,
            type: 'forecast',
            model: 'gemini-pro',
            prompt: 'Análise Preditiva Financeira',
            response: JSON.stringify(insights)
        })

        return NextResponse.json({ data: insights })

    } catch (err: any) {
        console.error('[Predictive API Error]:', err)
        return NextResponse.json({ error: err.message || 'Erro ao gerar previsões' }, { status: 500 })
    }
}
