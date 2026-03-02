import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, Wallet, Landmark, CreditCard, ChevronRight } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { Account } from '@/types/database'

export default async function AccountsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: accounts } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

    const typedAccounts = (accounts ?? []) as Account[]
    const totalBalance = typedAccounts
        .filter(a => a.include_in_total && a.type !== 'credit_card')
        .reduce((s, a) => s + a.balance, 0)

    // Group accounts by type for better UI
    const groups = {
        checking: typedAccounts.filter(a => a.type === 'checking' || a.type === 'cash'),
        creditCards: typedAccounts.filter(a => a.type === 'credit_card'),
        investments: typedAccounts.filter(a => a.type === 'investment' || a.type === 'savings')
    }

    const TypeIcon = {
        checking: Wallet,
        cash: Wallet,
        credit_card: CreditCard,
        investment: Landmark,
        savings: Landmark,
        wallet: Wallet,
        other: Wallet
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-10">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Minhas Contas</h1>
                    <p className="text-muted-foreground text-sm mt-0.5">Visão consolidada do seu patrimônio físico e contas</p>
                </div>
                <Link href="/accounts/new">
                    <button className="btn-neural flex items-center gap-2">
                        <Plus className="w-4 h-4" /> Conta ou Cartão
                    </button>
                </Link>
            </div>

            <div className="glass-card p-6 border-b-4 border-b-primary flex items-center justify-between">
                <div>
                    <p className="text-xs uppercase tracking-wider font-medium text-muted-foreground">Saldo Consolidado (Total em Contas)</p>
                    <p className="text-3xl font-bold mt-1 text-foreground">{formatCurrency(totalBalance)}</p>
                </div>
            </div>

            <div className="space-y-8 mt-6">
                {/* Checking & Cash */}
                {groups.checking.length > 0 && (
                    <section className="space-y-4">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <Wallet className="w-5 h-5 text-indigo-400" /> Corrente & Carteira
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {groups.checking.map((acc) => {
                                const Icon = TypeIcon[acc.type] ?? Wallet
                                return (
                                    <div key={acc.id} className="glass-card-hover p-5 relative overflow-hidden group cursor-pointer border border-white/5">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="w-10 h-10 rounded-xl flex items-center justify-center border border-white/10" style={{ backgroundColor: `${acc.color}20` }}>
                                                <Icon className="w-5 h-5" style={{ color: acc.color }} />
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                        <p className="text-sm font-medium text-muted-foreground">{acc.name}</p>
                                        <p className={`text-xl font-bold mt-1 ${acc.balance < 0 ? 'text-red-400' : 'text-foreground'}`}>
                                            {formatCurrency(acc.balance)}
                                        </p>
                                        {!acc.include_in_total && (
                                            <span className="absolute top-3 right-3 text-[10px] bg-red-500/10 text-red-400 px-2 flex items-center h-4 rounded-full">
                                                Ignorado do saldo
                                            </span>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </section>
                )}

                {/* Credit Cards */}
                {groups.creditCards.length > 0 && (
                    <section className="space-y-4">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-amber-400" /> Cartões de Crédito
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {groups.creditCards.map((acc) => {
                                const pct = acc.credit_limit ? (acc.balance / acc.credit_limit) * 100 : 0
                                return (
                                    <div key={acc.id} className="account-card-3d p-6 relative overflow-hidden rounded-2xl cursor-pointer">
                                        <div className="absolute inset-0 opacity-80" style={{ background: `linear-gradient(135deg, ${acc.color}, #1f2937)` }} />
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl pointer-events-none" />

                                        <div className="relative z-10">
                                            <div className="flex justify-between items-start mb-6">
                                                <p className="font-semibold tracking-widest text-white">{acc.name.toUpperCase()}</p>
                                                <CreditCard className="w-6 h-6 text-white/50" />
                                            </div>
                                            <div className="mb-2">
                                                <p className="text-[10px] uppercase text-white/70 tracking-wider">Fatura Atual</p>
                                                <p className="text-2xl font-bold text-white">{formatCurrency(acc.balance)}</p>
                                            </div>
                                            {acc.credit_limit && (
                                                <div className="mt-4">
                                                    <div className="flex justify-between text-xs text-white/70 mb-1">
                                                        <span>Limite Usado: {pct.toFixed(0)}%</span>
                                                        <span>Total: {formatCurrency(acc.credit_limit)}</span>
                                                    </div>
                                                    <div className="h-1.5 w-full bg-black/30 rounded-full overflow-hidden">
                                                        <div className="h-full bg-white transition-all duration-500" style={{ width: `${Math.min(pct, 100)}%` }} />
                                                    </div>
                                                </div>
                                            )}

                                            <div className="flex items-center gap-4 mt-4 select-none pointer-events-none text-xs text-white/50">
                                                <div>
                                                    <span>Venc</span>
                                                    <span className="text-white ml-2">{String(acc.due_day).padStart(2, '0')}/mês</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </section>
                )}

                {/* Investments / Savings */}
                {groups.investments.length > 0 && (
                    <section className="space-y-4">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <Landmark className="w-5 h-5 text-emerald-400" /> Investimentos
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {groups.investments.map((acc) => (
                                <div key={acc.id} className="glass-card-hover p-4 relative overflow-hidden group cursor-pointer flex items-center gap-4 border border-white/5">
                                    <div className="w-12 h-12 rounded-xl flex items-center justify-center border border-white/10 bg-emerald-500/10 shrink-0">
                                        <Landmark className="w-6 h-6 text-emerald-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">{acc.name}</p>
                                        <p className="text-lg font-bold text-foreground">
                                            {formatCurrency(acc.balance)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {Object.values(groups).every(g => g.length === 0) && (
                    <div className="glass-card p-12 text-center mt-4 border-dashed border border-white/10">
                        <Wallet className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                        <h3 className="text-lg font-bold mb-1">Nenhuma conta encontrada</h3>
                        <p className="text-sm text-muted-foreground mb-4">Que tal registrar sua conta corrente ou cartão de crédito para acompanhar seus gastos?</p>
                        <Link href="/accounts/new">
                            <button className="btn-neural">Adicionar Minha Primeira Conta</button>
                        </Link>
                    </div>
                )}
            </div>
        </div>
    )
}
