import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate } from '@/lib/utils'
import Link from 'next/link'
import { Plus, ArrowUpRight, ArrowDownRight, ArrowLeftRight } from 'lucide-react'
import type { TransactionWithCategory } from '@/types/database'

export default async function TransactionsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]

    const { data: transactions } = await supabase
        .from('transactions')
        .select('*, categories(id, name, icon, color), accounts(id, name, type, color)')
        .eq('user_id', user.id)
        .gte('date', firstDay)
        .order('date', { ascending: false })
        .limit(50)

    const txs = (transactions ?? []) as unknown as TransactionWithCategory[]
    const totalIncome = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
    const totalExpense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)

    // Group by date
    const grouped: Record<string, TransactionWithCategory[]> = {}
    for (const tx of txs) {
        if (!grouped[tx.date]) grouped[tx.date] = []
        grouped[tx.date].push(tx)
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Transações</h1>
                    <p className="text-muted-foreground text-sm mt-0.5">
                        {now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                    </p>
                </div>
                <Link href="/transactions/new">
                    <button className="btn-neural flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        Nova Transação
                    </button>
                </Link>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-3 gap-4">
                <div className="glass-card p-4">
                    <p className="text-xs text-muted-foreground">Receitas</p>
                    <p className="text-lg font-bold text-emerald-400">{formatCurrency(totalIncome)}</p>
                </div>
                <div className="glass-card p-4">
                    <p className="text-xs text-muted-foreground">Despesas</p>
                    <p className="text-lg font-bold text-red-400">{formatCurrency(totalExpense)}</p>
                </div>
                <div className="glass-card p-4">
                    <p className="text-xs text-muted-foreground">Saldo</p>
                    <p className={`text-lg font-bold ${(totalIncome - totalExpense) >= 0 ? 'text-violet-400' : 'text-red-400'}`}>
                        {formatCurrency(totalIncome - totalExpense)}
                    </p>
                </div>
            </div>

            {/* Transaction list grouped by date */}
            {Object.keys(grouped).length === 0 ? (
                <div className="glass-card p-12 text-center">
                    <div className="w-16 h-16 rounded-2xl glass-card flex items-center justify-center mx-auto mb-4">
                        <ArrowLeftRight className="w-7 h-7 text-muted-foreground" />
                    </div>
                    <p className="text-foreground font-medium mb-1">Nenhuma transação este mês</p>
                    <p className="text-muted-foreground text-sm mb-4">Comece adicionando sua primeira transação</p>
                    <Link href="/transactions/new">
                        <button className="btn-neural">Adicionar Transação</button>
                    </Link>
                </div>
            ) : (
                <div className="space-y-4">
                    {Object.entries(grouped).map(([date, txList]) => (
                        <div key={date}>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 px-1">
                                {formatDate(date)}
                            </p>
                            <div className="glass-card divide-y divide-border/50">
                                {txList.map((tx) => (
                                    <div key={tx.id} className="flex items-center gap-3 p-3.5 hover:bg-white/[0.02] transition-colors">
                                        <div
                                            className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                                            style={{ background: `${tx.categories?.color ?? '#6366f1'}20` }}
                                        >
                                            {tx.categories?.icon ?? '💳'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-foreground truncate">{tx.description}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                {tx.categories && (
                                                    <span className="text-xs text-muted-foreground">{tx.categories.name}</span>
                                                )}
                                                {tx.accounts && (
                                                    <>
                                                        <span className="text-muted-foreground/30">·</span>
                                                        <span className="text-xs text-muted-foreground">{tx.accounts.name}</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5 shrink-0">
                                            {tx.type === 'income' ? (
                                                <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
                                            ) : tx.type === 'expense' ? (
                                                <ArrowDownRight className="w-3.5 h-3.5 text-red-400" />
                                            ) : (
                                                <ArrowLeftRight className="w-3.5 h-3.5 text-violet-400" />
                                            )}
                                            <span className={`text-sm font-semibold ${tx.type === 'income' ? 'text-emerald-400' :
                                                    tx.type === 'expense' ? 'text-red-400' : 'text-violet-400'
                                                }`}>
                                                {formatCurrency(tx.amount)}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
