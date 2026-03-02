import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatRelativeDate } from '@/lib/utils'
import {
    TrendingUp, TrendingDown, Wallet, Target, ArrowUpRight,
    ArrowDownRight, Sparkles, Bell, Plus, Brain
} from 'lucide-react'
import Link from 'next/link'
import type { TransactionWithCategory } from '@/types/database'

async function getDashboardData(userId: string) {
    const supabase = await createClient()
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]

    const [accountsRes, transactionsRes, budgetsRes, goalsRes, boletosRes] = await Promise.all([
        supabase.from('accounts').select('id, name, balance, type, color, include_in_total').eq('user_id', userId).eq('is_active', true),
        supabase.from('transactions').select('id, amount, type, description, date, categories(id, name, icon, color), accounts(id, name, type, color)').eq('user_id', userId).gte('date', firstDay).lte('date', lastDay).order('date', { ascending: false }).limit(8),
        supabase.from('budgets').select('*, categories(name, icon, color)').eq('user_id', userId).eq('period', 'monthly'),
        supabase.from('goals').select('*').eq('user_id', userId).eq('is_completed', false).order('priority', { ascending: true }).limit(4),
        supabase.from('boletos').select('id, amount, due_date, beneficiary_name, status').eq('user_id', userId).eq('status', 'pending').lte('due_date', lastDay).order('due_date').limit(5),
    ])

    const accounts = accountsRes.data ?? []
    const transactions = (transactionsRes.data ?? []) as unknown as TransactionWithCategory[]
    const goals = goalsRes.data ?? []
    const boletos = boletosRes.data ?? []

    const totalBalance = accounts
        .filter(a => a.include_in_total && a.type !== 'credit_card')
        .reduce((sum, a) => sum + a.balance, 0)

    const monthIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
    const monthExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)

    return { accounts, transactions, budgets: budgetsRes.data ?? [], goals, boletos, totalBalance, monthIncome, monthExpense }
}

export default async function DashboardPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()
    const { accounts, transactions, goals, boletos, totalBalance, monthIncome, monthExpense } = await getDashboardData(user.id)

    const monthBalance = monthIncome - monthExpense
    const savingsRate = monthIncome > 0 ? (monthBalance / monthIncome) * 100 : 0
    const firstName = profile?.full_name?.split(' ')[0] ?? 'Usuário'

    return (
        <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Olá, {firstName} 👋</h1>
                    <p className="text-muted-foreground text-sm mt-0.5">
                        {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {boletos.length > 0 && (
                        <Link href="/boletos">
                            <div className="relative p-2 glass-card rounded-xl cursor-pointer hover:scale-105 transition-transform">
                                <Bell className="w-5 h-5 text-amber-400" />
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center text-[10px] font-bold text-black">
                                    {boletos.length}
                                </div>
                            </div>
                        </Link>
                    )}
                    <Link href="/transactions/new">
                        <button className="btn-neural flex items-center gap-2">
                            <Plus className="w-4 h-4" />
                            Nova Transação
                        </button>
                    </Link>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Balance */}
                <div className="glass-card p-5 relative overflow-hidden">
                    <div className="absolute top-3 right-3 w-8 h-8 rounded-lg neural-gradient flex items-center justify-center">
                        <Wallet className="w-4 h-4 text-white" />
                    </div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Patrimônio Líquido</p>
                    <p className="text-2xl font-bold text-foreground">{formatCurrency(totalBalance)}</p>
                    <p className="text-xs text-muted-foreground mt-1">{accounts.length} conta{accounts.length !== 1 ? 's' : ''} ativa{accounts.length !== 1 ? 's' : ''}</p>
                </div>

                {/* Month Income */}
                <div className="glass-card p-5 relative overflow-hidden">
                    <div className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                    </div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Receitas do Mês</p>
                    <p className="text-2xl font-bold text-emerald-400">{formatCurrency(monthIncome)}</p>
                    <div className="flex items-center gap-1 mt-1">
                        <ArrowUpRight className="w-3 h-3 text-emerald-400" />
                        <p className="text-xs text-emerald-400">Entrada total</p>
                    </div>
                </div>

                {/* Month Expense */}
                <div className="glass-card p-5 relative overflow-hidden">
                    <div className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
                        <TrendingDown className="w-4 h-4 text-red-400" />
                    </div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Despesas do Mês</p>
                    <p className="text-2xl font-bold text-red-400">{formatCurrency(monthExpense)}</p>
                    <div className="flex items-center gap-1 mt-1">
                        <ArrowDownRight className="w-3 h-3 text-red-400" />
                        <p className="text-xs text-red-400">Saída total</p>
                    </div>
                </div>

                {/* Savings Rate */}
                <div className="glass-card p-5 relative overflow-hidden">
                    <div className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
                        <Target className="w-4 h-4 text-violet-400" />
                    </div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Taxa de Poupança</p>
                    <p className={`text-2xl font-bold ${savingsRate >= 0 ? 'text-violet-400' : 'text-red-400'}`}>
                        {savingsRate.toFixed(1)}%
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                        {formatCurrency(monthBalance)} {monthBalance >= 0 ? 'economizado' : 'negativo'}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Transactions */}
                <div className="lg:col-span-2 glass-card p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-semibold text-foreground">Transações Recentes</h2>
                        <Link href="/transactions" className="text-xs text-primary hover:underline">Ver todas</Link>
                    </div>

                    {transactions.length === 0 ? (
                        <div className="text-center py-10">
                            <div className="w-12 h-12 rounded-2xl glass-card flex items-center justify-center mx-auto mb-3">
                                <ArrowUpRight className="w-6 h-6 text-muted-foreground" />
                            </div>
                            <p className="text-muted-foreground text-sm">Nenhuma transação este mês</p>
                            <Link href="/transactions/new">
                                <button className="btn-neural mt-3 text-xs px-4 py-2">Adicionar primeira</button>
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {transactions.map((tx) => (
                                <div key={tx.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/[0.03] transition-colors group">
                                    <div
                                        className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0"
                                        style={{ background: `${tx.categories?.color ?? '#6366f1'}20` }}
                                    >
                                        {tx.categories?.icon ?? '💳'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-foreground truncate">{tx.description}</p>
                                        <p className="text-xs text-muted-foreground">{formatRelativeDate(tx.date)} · {tx.accounts?.name}</p>
                                    </div>
                                    <span className={`text-sm font-semibold shrink-0 ${tx.type === 'income' ? 'text-emerald-400' :
                                            tx.type === 'expense' ? 'text-red-400' : 'text-violet-400'
                                        }`}>
                                        {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''}
                                        {formatCurrency(tx.amount)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                    {/* Goals */}
                    <div className="glass-card p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-semibold text-foreground">Metas</h2>
                            <Link href="/goals" className="text-xs text-primary hover:underline">Ver todas</Link>
                        </div>
                        {goals.length === 0 ? (
                            <div className="text-center py-6">
                                <p className="text-muted-foreground text-sm">Nenhuma meta criada</p>
                                <Link href="/goals">
                                    <button className="btn-ghost mt-2 text-xs px-3 py-1.5">Criar meta</button>
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {goals.map((goal) => {
                                    const pct = Math.min((goal.current_amount / goal.target_amount) * 100, 100)
                                    return (
                                        <div key={goal.id}>
                                            <div className="flex items-center justify-between mb-1">
                                                <div className="flex items-center gap-2">
                                                    <span>{goal.icon}</span>
                                                    <span className="text-sm font-medium text-foreground truncate max-w-[100px]">{goal.name}</span>
                                                </div>
                                                <span className="text-xs text-muted-foreground">{pct.toFixed(0)}%</span>
                                            </div>
                                            <div className="progress-bar">
                                                <div
                                                    className="progress-fill"
                                                    style={{ width: `${pct}%`, background: goal.color ?? '#6366f1' }}
                                                />
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>

                    {/* Boletos */}
                    {boletos.length > 0 && (
                        <div className="glass-card p-5">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="font-semibold text-foreground flex items-center gap-2">
                                    <span className="text-amber-400">⚡</span> Boletos Pendentes
                                </h2>
                                <Link href="/boletos" className="text-xs text-primary hover:underline">Ver todos</Link>
                            </div>
                            <div className="space-y-2">
                                {boletos.map((boleto) => (
                                    <div key={boleto.id} className="flex items-center justify-between p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/10">
                                        <div>
                                            <p className="text-xs font-medium text-foreground truncate max-w-[120px]">
                                                {boleto.beneficiary_name ?? 'Boleto'}
                                            </p>
                                            <p className="text-[10px] text-amber-400">{formatRelativeDate(boleto.due_date)}</p>
                                        </div>
                                        <span className="text-xs font-semibold text-amber-400">{formatCurrency(boleto.amount)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* AI Quick Chat */}
                    <Link href="/ai">
                        <div className="glass-card-hover p-5 cursor-pointer">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-8 h-8 rounded-lg neural-gradient flex items-center justify-center">
                                    <Brain className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-foreground">NeuraFin IA</p>
                                    <p className="text-xs text-muted-foreground">Assistente financeiro</p>
                                </div>
                                <Sparkles className="w-4 h-4 text-violet-400 ml-auto" />
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Pergunte sobre seus gastos, peça insights ou análises personalizadas.
                            </p>
                        </div>
                    </Link>
                </div>
            </div>

            {/* Accounts */}
            {accounts.length > 0 && (
                <div className="glass-card p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-semibold text-foreground">Contas</h2>
                        <Link href="/accounts" className="text-xs text-primary hover:underline">Gerenciar</Link>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {accounts.map((account) => (
                            <div key={account.id} className="p-3 rounded-xl border border-white/5 hover:border-white/10 transition-all">
                                <div
                                    className="w-8 h-8 rounded-lg mb-2 flex items-center justify-center"
                                    style={{ background: `${account.color}30` }}
                                >
                                    <Wallet className="w-4 h-4" style={{ color: account.color }} />
                                </div>
                                <p className="text-xs text-muted-foreground truncate">{account.name}</p>
                                <p className={`text-sm font-bold mt-0.5 ${account.balance < 0 ? 'text-red-400' : 'text-foreground'}`}>
                                    {formatCurrency(account.balance)}
                                </p>
                            </div>
                        ))}
                        <Link href="/accounts/new">
                            <div className="p-3 rounded-xl border border-dashed border-white/10 hover:border-primary/30 transition-all flex flex-col items-center justify-center gap-1 cursor-pointer min-h-[80px]">
                                <Plus className="w-4 h-4 text-muted-foreground" />
                                <p className="text-xs text-muted-foreground">Nova conta</p>
                            </div>
                        </Link>
                    </div>
                </div>
            )}
        </div>
    )
}
