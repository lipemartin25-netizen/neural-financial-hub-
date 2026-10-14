import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Últimos 12 meses de transações agrupadas por mês
    const twelveMonthsAgo = new Date()
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)
    const fromDate = twelveMonthsAgo.toISOString().split('T')[0]

    const { data: transactions, error: txError } = await supabase
        .from('transactions')
        .select('date, amount, type, category:categories(name, icon)')
        .eq('user_id', user.id)
        .gte('date', fromDate)
        .order('date', { ascending: true })

    if (txError) return NextResponse.json({ error: txError.message }, { status: 500 })

    // Agrupar por mês
    const monthlyData: Record<string, { income: number; expenses: number }> = {}
    const categoryData: Record<string, { name: string; icon: string; total: number }> = {}

    transactions?.forEach((tx: any) => {
        const month = tx.date.substring(0, 7) // '2026-03'
        if (!monthlyData[month]) monthlyData[month] = { income: 0, expenses: 0 }

        const amount = Number(tx.amount)
        if (tx.type === 'income') {
            monthlyData[month].income += amount
        } else {
            monthlyData[month].expenses += amount
        }

        // Categorias (só despesas)
        if (tx.type === 'expense' && tx.category) {
            const catName = tx.category.name || 'Sem Categoria'
            if (!categoryData[catName]) {
                categoryData[catName] = { name: catName, icon: tx.category.icon || '💰', total: 0 }
            }
            categoryData[catName].total += amount
        }
    })

    const monthly = Object.entries(monthlyData)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, data]) => ({ month, ...data }))

    const categories = Object.values(categoryData)
        .sort((a, b) => b.total - a.total)

    return NextResponse.json({ monthly, categories })
}
