import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, Target, CheckCircle2, TrendingUp } from 'lucide-react'
import { formatCurrency, formatShortDate } from '@/lib/utils'

export default async function GoalsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: goalsRes } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .order('is_completed', { ascending: true })
        .order('priority', { ascending: true })

    const goals = goalsRes ?? []

    const activeGoals = goals.filter(g => !g.is_completed)
    const completedGoals = goals.filter(g => g.is_completed)

    const totalSaved = activeGoals.reduce((s, g) => s + g.current_amount, 0)
    const totalTarget = activeGoals.reduce((s, g) => s + g.target_amount, 0)
    const globalProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-10">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Metas e Sonhos</h1>
                    <p className="text-muted-foreground text-sm mt-0.5">Acompanhe seu progresso e planeje seu futuro financeiro</p>
                </div>
                <Link href="/goals/new">
                    <button className="btn-neural flex items-center gap-2">
                        <Plus className="w-4 h-4" /> Nova Meta
                    </button>
                </Link>
            </div>

            <div className="glass-card p-6 border-b-4 border-b-primary flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                    <p className="text-xs uppercase tracking-wider font-medium text-muted-foreground flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-primary" /> Guardado para Metas (Total Ativo)
                    </p>
                    <p className="text-3xl font-bold mt-2 text-foreground">{formatCurrency(totalSaved)} <span className="text-lg text-muted-foreground font-normal">/ {formatCurrency(totalTarget)}</span></p>
                </div>
                <div className="w-full md:w-1/3">
                    <div className="flex justify-between text-xs mb-1.5 font-medium">
                        <span className="text-primary">Progresso Global</span>
                        <span className="text-foreground">{globalProgress.toFixed(1)}%</span>
                    </div>
                    <div className="h-2.5 w-full bg-black/40 rounded-full overflow-hidden">
                        <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${globalProgress}%` }} />
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                {activeGoals.length === 0 && completedGoals.length === 0 ? (
                    <div className="text-center py-10 glass-card">
                        <div className="w-16 h-16 rounded-2xl glass-card flex items-center justify-center mx-auto mb-4 border-dashed border border-white/10">
                            <Target className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <p className="text-foreground font-medium mb-1">Nenhuma meta ativa</p>
                        <p className="text-muted-foreground text-sm mb-4">Crie metas para trocar de carro, viajar, ou criar sua reserva de emergência.</p>
                        <Link href="/goals/new">
                            <button className="btn-neural">Criar Nova Meta</button>
                        </Link>
                    </div>
                ) : null}

                {activeGoals.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {activeGoals.map(goal => {
                            const pct = Math.min((goal.current_amount / goal.target_amount) * 100, 100)

                            return (
                                <div key={goal.id} className="glass-card p-5 relative group border border-white/5 hover:border-white/10 transition-colors">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3 w-[80%]">
                                            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0" style={{ backgroundColor: `${goal.color}20` }}>
                                                {goal.icon}
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <p className="text-sm font-semibold text-foreground truncate">{goal.name}</p>
                                                {goal.target_date && (
                                                    <p className="text-[10px] text-muted-foreground">🎯 Para {formatShortDate(goal.target_date)}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mb-3 flex items-end justify-between">
                                        <div>
                                            <p className="text-xl font-bold text-foreground leading-tight">{formatCurrency(goal.current_amount)}</p>
                                            <p className="text-[10px] text-muted-foreground tracking-wider uppercase mt-1">De {formatCurrency(goal.target_amount)}</p>
                                        </div>
                                        <span className="text-xl font-bold" style={{ color: goal.color }}>{pct.toFixed(0)}%</span>
                                    </div>

                                    <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
                                        <div className="h-full transition-all duration-1000 origin-left" style={{ width: `${pct}%`, backgroundColor: goal.color }} />
                                    </div>

                                    {goal.monthly_contribution && (
                                        <p className="text-[10px] text-muted-foreground mt-3 text-center">
                                            Contribuição mensal: <span className="text-foreground font-medium">{formatCurrency(goal.monthly_contribution)}</span>
                                        </p>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}

                {completedGoals.length > 0 && (
                    <div className="mt-8">
                        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Metas Alcançadas
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 opacity-70 hover:opacity-100 transition-opacity">
                            {completedGoals.map(goal => (
                                <div key={goal.id} className="glass-card p-4 flex items-center gap-4 bg-emerald-500/5 border border-emerald-500/10">
                                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-lg shrink-0 grayscale">
                                        {goal.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-emerald-500 truncate line-through decoration-emerald-500/50">{goal.name}</p>
                                        <p className="text-xs font-bold text-foreground">{formatCurrency(goal.target_amount)}</p>
                                    </div>
                                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
