import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const now = new Date()

        const [accountsRes, investmentsRes, boletosRes, txRes] = await Promise.all([
            supabase
                .from('accounts')
                .select('id, name, balance, type, credit_limit')
                .eq('user_id', user.id)
                .eq('is_active', true),
            supabase
                .from('investments')
                .select('id, ticker, name, type, invested_amount, current_value')
                .eq('user_id', user.id)
                .eq('is_active', true),
            supabase
                .from('boletos')
                .select('id, description, amount, due_date, status')
                .eq('user_id', user.id)
                .eq('status', 'pending'),
            // Últimos 6 meses de transações para evolução patrimonial
            supabase
                .from('transactions')
                .select('amount, type, date')
                .eq('user_id', user.id)
                .gte('date', new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString().split('T')[0]),
        ])

        const accounts = accountsRes.data ?? []
        const investments = investmentsRes.data ?? []
        const boletos = boletosRes.data ?? []
        const transactions = txRes.data ?? []

        // ========== ATIVOS ==========
        // 1. Contas bancárias (exceto cartão de crédito)
        const bankAccounts = accounts.filter(a => a.type !== 'credit_card')
        const totalBankBalance = bankAccounts.reduce((s, a) => s + Number(a.balance), 0)

        // 2. Investimentos agrupados por tipo
        const invByType: Record<string, { items: typeof investments; total: number }> = {}
        for (const inv of investments) {
            const type = inv.type ?? 'other'
            if (!invByType[type]) invByType[type] = { items: [], total: 0 }
            invByType[type].items.push(inv)
            invByType[type].total += Number(inv.current_value ?? 0)
        }

        const invTypeLabels: Record<string, { label: string; color: string }> = {
            stock: { label: 'Ações', color: '#3B82F6' },
            fii: { label: 'FIIs', color: '#8B5CF6' },
            fixed_income: { label: 'Renda Fixa', color: '#10B981' },
            crypto: { label: 'Criptomoedas', color: '#F59E0B' },
            etf: { label: 'ETFs', color: '#06B6D4' },
            international: { label: 'Internacional', color: '#EC4899' },
            savings: { label: 'Poupança', color: '#22d3ee' },
            other: { label: 'Outros', color: '#6b7280' },
        }

        const totalInvCurrent = investments.reduce((s, i) => s + Number(i.current_value ?? 0), 0)
        const totalInvested = investments.reduce((s, i) => s + Number(i.invested_amount ?? 0), 0)

        const assetGroups = [
            {
                name: 'Contas Bancárias',
                icon: 'bank',
                value: totalBankBalance,
                color: '#3B82F6',
                subItems: bankAccounts.map(a => ({ name: a.name, value: Number(a.balance) })),
            },
            ...Object.entries(invByType).map(([type, data]) => ({
                name: invTypeLabels[type]?.label ?? type,
                icon: 'investments',
                value: data.total,
                color: invTypeLabels[type]?.color ?? '#6b7280',
                subItems: data.items.map(i => ({
                    name: i.ticker ? `${i.ticker}${i.name ? ` — ${i.name}` : ''}` : i.name ?? 'Investimento',
                    value: Number(i.current_value ?? 0),
                })),
            })),
        ].filter(g => g.value > 0)

        const totalAssets = totalBankBalance + totalInvCurrent

        // ========== PASSIVOS ==========
        const creditCards = accounts.filter(a => a.type === 'credit_card')
        const liabilities: Array<{ name: string; value: number; color: string; detail: string }> = []

        for (const card of creditCards) {
            const used = Math.abs(Number(card.balance))
            if (used > 0) {
                liabilities.push({
                    name: card.name,
                    value: used,
                    color: '#8B5CF6',
                    detail: `Limite: R$ ${Number(card.credit_limit ?? 0).toFixed(2)}`,
                })
            }
        }

        for (const b of boletos) {
            liabilities.push({
                name: b.description ?? 'Boleto pendente',
                value: Number(b.amount),
                color: '#F59E0B',
                detail: `Vence: ${b.due_date}`,
            })
        }

        const totalLiabilities = liabilities.reduce((s, l) => s + l.value, 0)
        const netWorth = totalAssets - totalLiabilities

        // ========== EVOLUÇÃO PATRIMONIAL (estimativa mensal) ==========
        // Calculamos o patrimônio líquido retroativo baseado no fluxo
        const history: Array<{ label: string; value: number }> = []
        let runningNet = netWorth

        // Trabalhar de trás pra frente: mês atual → 5 meses atrás
        for (let i = 0; i < 6; i++) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
            const label = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }).replace('.', '')

            if (i === 0) {
                history.unshift({ label, value: netWorth })
            } else {
                // Somar receitas e subtrair despesas do mês "i" para estimar o patrimônio anterior
                const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
                const monthTx = transactions.filter(t => (t.date as string).startsWith(monthKey))
                const monthIncome = monthTx.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
                const monthExpense = monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)

                // O patrimônio do mês anterior = atual - economia daquele mês
                runningNet = runningNet - (monthIncome - monthExpense)
                history.unshift({ label, value: Math.max(0, runningNet) })
            }
        }

        // Variação vs mês anterior
        const prevNetWorth = history.length >= 2 ? history[history.length - 2].value : netWorth
        const change = netWorth - prevNetWorth
        const changePct = prevNetWorth > 0 ? (change / prevNetWorth) * 100 : 0

        return NextResponse.json({
            data: {
                netWorth,
                totalAssets,
                totalLiabilities,
                change,
                changePct: Math.round(changePct * 10) / 10,
                debtRatio: totalAssets > 0 ? Math.round((totalLiabilities / totalAssets) * 1000) / 10 : 0,
                assetGroups,
                liabilities,
                history,
                investmentReturn: totalInvested > 0 ? Math.round(((totalInvCurrent - totalInvested) / totalInvested) * 1000) / 10 : 0,
                totalInvested,
                totalInvCurrent,
            },
        })
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Internal error'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
