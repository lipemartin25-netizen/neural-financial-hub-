import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'
export async function GET() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        const now = new Date()
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)
        const startDate = `${sixMonthsAgo.getFullYear()}-${String(sixMonthsAgo.getMonth() + 1).padStart(2, '0')}-01`
        // Transações dos últimos 6 meses
        const { data: transactions } = await supabase
            .from('transactions')
            .select('amount, type, date, category_id')
            .eq('user_id', user.id)
            .gte('date', startDate)
            .order('date', { ascending: true })
        const txs = transactions ?? []
        // 1. Tendência mensal (6 meses)
        const monthlyMap: Record<string, { income: number; expense: number; balance: number }> = {}
        for (let i = 0; i < 6; i++) {
            const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
            monthlyMap[key] = { income: 0, expense: 0, balance: 0 }
        }
        for (const tx of txs) {
            const key = tx.date.substring(0, 7) // YYYY-MM
            if (monthlyMap[key]) {
                if (tx.type === 'income') monthlyMap[key].income += Number(tx.amount)
                if (tx.type === 'expense') monthlyMap[key].expense += Number(tx.amount)
            }
        }
        const monthNames: Record<string, string[]> = {
            'pt-BR': ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
        }
        const monthly = Object.entries(monthlyMap).map(([key, val]) => {
            const m = parseInt(key.split('-')[1]) - 1
            return {
                month: monthNames['pt-BR'][m],
                income: Math.round(val.income * 100) / 100,
                expense: Math.round(val.expense * 100) / 100,
                balance: Math.round((val.income - val.expense) * 100) / 100,
            }
        })
        // 2. Despesas por categoria (mês atual)
        const firstDay = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
        const currentMonthTxs = txs.filter(tx =>
            tx.type === 'expense' && tx.date >= firstDay
        )
        const catTotals: Record<string, number> = {}
        for (const tx of currentMonthTxs) {
            const cat = tx.category_id ?? 'other'
            catTotals[cat] = (catTotals[cat] ?? 0) + Number(tx.amount)
        }
        // Buscar nomes das categorias
        const catIds = Object.keys(catTotals).filter(c => c !== 'other')
        let catNames: Record<string, { name: string; color: string }> = {}
        if (catIds.length > 0) {
            const { data: cats } = await supabase
                .from('categories')
                .select('id, name, color')
                .in('id', catIds)
            catNames = Object.fromEntries(
                (cats ?? []).map(c => [c.id, { name: c.name, color: c.color }])
            )
        }
        const COLORS = ['#c9a858', '#34d399', '#f87171', '#60a5fa', '#a78bfa', '#fb923c', '#f472b6', '#22d3ee']
        const byCategory = Object.entries(catTotals)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8)
            .map(([id, val], i) => ({
                name: catNames[id]?.name ?? 'Outros',
                value: Math.round(val * 100) / 100,
                color: catNames[id]?.color ?? COLORS[i % COLORS.length],
            }))
        // 3. Daily spending (últimos 30 dias)
        const thirtyDaysAgo = new Date(now)
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        const thirtyStart = thirtyDaysAgo.toISOString().split('T')[0]
        const dailyMap: Record<string, number> = {}
        for (let i = 0; i < 30; i++) {
            const d = new Date(thirtyDaysAgo)
            d.setDate(d.getDate() + i)
            dailyMap[d.toISOString().split('T')[0]] = 0
        }
        for (const tx of txs) {
            if (tx.type === 'expense' && tx.date >= thirtyStart) {
                dailyMap[tx.date] = (dailyMap[tx.date] ?? 0) + Number(tx.amount)
            }
        }
        const daily = Object.entries(dailyMap).map(([date, value]) => ({
            date: new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
            value: Math.round(value * 100) / 100,
        }))
        return NextResponse.json({
            data: { monthly, byCategory, daily },
        })
    } catch (err: unknown) {
        return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 })
    }
}
