import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, PiggyBank, AlertTriangle, Wallet } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export default async function BudgetsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]

    const [budgetsRes, transactionsRes] = await Promise.all([
        supabase.from('budgets').select('*, categories(id, name, color, icon)').eq('user_id', user.id).eq('period', 'monthly'),
        supabase.from('transactions').select('amount, category_id').eq('user_id', user.id).eq('type', 'expense').gte('date', firstDay).lte('date', lastDay)
    ])

    const budgets = budgetsRes.data ?? []
    const txs = transactionsRes.data ?? []

    // Add spent to each budget
    const budgetsWithSpending = budgets.map(budget => {
        const spent = txs.filter(t => t.category_id === budget.category_id).reduce((s, t) => s + t.amount, 0)
        const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0
        return { ...budget, spent, percentage }
    }).sort((a, b) => b.percentage - a.percentage)

    const overBudgets = budgetsWithSpending.filter(b => b.percentage >= 100).length
    const warningBudgets = budgetsWithSpending.filter(b => b.percentage >= b.alert_threshold && b.percentage < 100).length

    return (
        <div className="max-w-5xl mx-auto space-y-6 animate-fade-in pb-10">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Orçamentos</h1>
                    <p className="text-muted-foreground text-sm mt-0.5">Controle mensal de gastos por categoria</p>
                </div>
                <Link href="/budgets/new">
                    <button className="btn-neural flex items-center gap-2">
                        <Plus className="w-4 h-4" /> Novo Orçamento
                    </button>
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="glass-card p-5">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-muted-foreground uppercase font-medium">Ativos este Mês</p>
                        <Wallet className="w-4 h-4 text-emerald-400" />
                    </div>
                    <p className="text-2xl font-bold text-foreground">{budgets.length}</p>
                </div>
                <div className="glass-card p-5 border-l-2 border-l-amber-500/50">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-muted-foreground uppercase font-medium">Em Alerta (&gt; Limite)</p>
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    </div>
                    <p className="text-2xl font-bold text-amber-400">{warningBudgets}</p>
                </div>
                <div className="glass-card p-5 border-l-2 border-l-red-500/50">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-muted-foreground uppercase font-medium">Estourados</p>
                        <AlertTriangle className="w-4 h-4 text-red-400" />
                    </div>
                    <p className="text-2xl font-bold text-red-400">{overBudgets}</p>
                </div>
            </div>

            <div className="glass-card p-6">
                <h2 className="font-semibold text-foreground mb-6">Progresso por Categoria</h2>

                {budgetsWithSpending.length === 0 ? (
                    <div className="text-center py-10">
                        <div className="w-16 h-16 rounded-2xl glass-card flex items-center justify-center mx-auto mb-4 bg-white/5">
                            <PiggyBank className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <p className="text-foreground font-medium mb-1">Sem orçamentos ativos</p>
                        <p className="text-muted-foreground text-sm mb-4">Crie orçamentos para limitar seus gastos em Supermercado, Lazer, etc.</p>
                        <Link href="/budgets/new">
                            <button className="btn-neural">Criar meu primeiro orçamento</button>
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {budgetsWithSpending.map(budget => {
                            const cat = budget.categories as any
                            const isDanger = budget.percentage >= 100
                            const isWarning = budget.percentage >= budget.alert_threshold && !isDanger
                            const ringColor = isDanger ? '#ef4444' : isWarning ? '#f59e0b' : (cat?.color ?? '#10b981')
                            const fillPct = Math.min(budget.percentage, 100)

                            return (
                                <div key={budget.id} className="relative p-5 rounded-2xl border border-white/5 bg-white/[0.02] flex flex-col items-center group hover:bg-white/[0.04] transition-colors">
                                    <div className="absolute top-3 right-3">
                                        {isDanger && <AlertTriangle className="w-4 h-4 text-red-500" title="Orçamento estourado!" />}
                                    </div>

                                    {/* Circular Progress */}
                                    <div className="relative w-32 h-32 mb-4">
                                        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                                            <circle cx="50" cy="50" r="40" className="stroke-white/10" strokeWidth="8" fill="none" />
                                            <circle
                                                cx="50"
                                                cy="50"
                                                r="40"
                                                stroke={ringColor}
                                                strokeWidth="8"
                                                fill="none"
                                                strokeDasharray="251.2"
                                                strokeDashoffset={251.2 - (251.2 * fillPct) / 100}
                                                className="transition-all duration-1000 ease-out drop-shadow-md"
                                                strokeLinecap="round"
                                            />
                                        </svg>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                                            <span className="text-2xl text-muted-foreground/30 opacity-20 absolute">{cat?.icon}</span>
                                            <span className="text-xl font-bold text-foreground z-10">{budget.percentage.toFixed(0)}%</span>
                                        </div>
                                    </div>

                                    <p className="text-sm font-medium text-foreground mb-1">{cat?.name ?? 'Categoria'}</p>

                                    <div className="flex items-center justify-between w-full mt-2 text-xs">
                                        <div className="flex flex-col">
                                            <span className="text-muted-foreground">Gasto</span>
                                            <span className={isDanger ? 'text-red-400 font-bold' : 'text-foreground font-medium'}>
                                                {formatCurrency(budget.spent)}
                                            </span>
                                        </div>
                                        <div className="flex flex-col text-right">
                                            <span className="text-muted-foreground">Limite</span>
                                            <span className="text-foreground font-medium">
                                                {formatCurrency(budget.amount)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
