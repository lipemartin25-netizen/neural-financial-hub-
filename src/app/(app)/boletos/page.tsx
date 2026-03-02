import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, ReceiptText, AlertCircle, CheckCircle } from 'lucide-react'
import { formatCurrency, formatShortDate } from '@/lib/utils'

export default async function BoletosPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: boletosRes } = await supabase
        .from('boletos')
        .select('*, categories(name)')
        .eq('user_id', user.id)
        .order('due_date', { ascending: true })

    const boletos = boletosRes ?? []

    const now = new Date()
    const todayDateStr = now.toISOString().split('T')[0]

    const pending = boletos.filter(b => b.status === 'pending')
    const paid = boletos.filter(b => b.status === 'paid')

    const overdue = pending.filter(b => b.due_date < todayDateStr)
    const dueToday = pending.filter(b => b.due_date === todayDateStr)
    const upcoming = pending.filter(b => b.due_date > todayDateStr)

    const pendingTotal = pending.reduce((s, b) => s + b.amount, 0)

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-10">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">DDA & Boletos</h1>
                    <p className="text-muted-foreground text-sm mt-0.5">Gestão de contas a pagar, faturas e pix</p>
                </div>
                <Link href="/boletos/new">
                    <button className="btn-neural flex items-center gap-2">
                        <Plus className="w-4 h-4" /> Novo Boleto
                    </button>
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="glass-card p-4 col-span-1 md:col-span-2 border-b-2 border-b-primary flex flex-col justify-center">
                    <p className="text-xs text-muted-foreground uppercase font-medium">Total em Aberto</p>
                    <p className="text-3xl font-bold mt-1 text-foreground">{formatCurrency(pendingTotal)}</p>
                </div>
                <div className="glass-card p-4 bg-red-500/5 border border-red-500/10">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-red-400 uppercase font-medium">Vencidos</p>
                        <AlertCircle className="w-4 h-4 text-red-400" />
                    </div>
                    <p className="text-2xl font-bold text-red-500">{overdue.length}</p>
                </div>
                <div className="glass-card p-4">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-xs text-muted-foreground uppercase font-medium">Vence Hoje</p>
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    </div>
                    <p className="text-2xl font-bold text-amber-400">{dueToday.length}</p>
                </div>
            </div>

            {pending.length === 0 && paid.length === 0 ? (
                <div className="text-center py-10 glass-card">
                    <div className="w-16 h-16 rounded-2xl glass-card flex items-center justify-center mx-auto mb-4 border-dashed border border-white/10">
                        <ReceiptText className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <p className="text-foreground font-medium mb-1">Nenhum boleto encontrado</p>
                    <p className="text-muted-foreground text-sm mb-4">Adicione suas contas mensais (Luz, Água, Internet) para não esquecer de pagar.</p>
                    <Link href="/boletos/new">
                        <button className="btn-neural">Cadastrar Boleto</button>
                    </Link>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Overdue */}
                    {overdue.length > 0 && (
                        <section>
                            <h2 className="text-sm font-semibold text-red-400 mb-3 flex items-center gap-2 uppercase tracking-wide">
                                <AlertCircle className="w-4 h-4" /> Vencidos
                            </h2>
                            <div className="space-y-3">
                                {overdue.map(b => <BoletoCard key={b.id} boleto={b} variant="danger" />)}
                            </div>
                        </section>
                    )}

                    {/* Due Today */}
                    {dueToday.length > 0 && (
                        <section>
                            <h2 className="text-sm font-semibold text-amber-400 mb-3 flex items-center gap-2 uppercase tracking-wide">
                                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" /> Vence Hoje
                            </h2>
                            <div className="space-y-3">
                                {dueToday.map(b => <BoletoCard key={b.id} boleto={b} variant="warning" />)}
                            </div>
                        </section>
                    )}

                    {/* Upcoming */}
                    {upcoming.length > 0 && (
                        <section>
                            <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">A Vencer</h2>
                            <div className="space-y-3">
                                {upcoming.map(b => <BoletoCard key={b.id} boleto={b} variant="neutral" />)}
                            </div>
                        </section>
                    )}

                    {/* Paid */}
                    {paid.length > 0 && (
                        <section className="pt-6 border-t border-border">
                            <h2 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Pagos Recentemente</h2>
                            <div className="space-y-3 opacity-60">
                                {paid.map(b => <BoletoCard key={b.id} boleto={b} variant="paid" />)}
                            </div>
                        </section>
                    )}
                </div>
            )}
        </div>
    )
}

function BoletoCard({ boleto, variant }: { boleto: any, variant: 'danger' | 'warning' | 'neutral' | 'paid' }) {
    const isPaid = variant === 'paid'
    const colors = {
        danger: 'border-red-500/20 bg-red-500/5',
        warning: 'border-amber-500/20 bg-amber-500/5',
        neutral: 'border-white/5 bg-white/[0.02] hover:bg-white/[0.04]',
        paid: 'border-emerald-500/20 bg-emerald-500/5',
    }

    return (
        <div className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${colors[variant]}`}>
            <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isPaid ? 'bg-emerald-500/20 text-emerald-400' : 'bg-secondary text-foreground'}`}>
                    {isPaid ? <CheckCircle className="w-5 h-5" /> : <ReceiptText className="w-5 h-5" />}
                </div>
                <div>
                    <p className={`font-semibold ${isPaid ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                        {boleto.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        {boleto.recipient} • {boleto.categories?.name ?? 'Geral'}
                    </p>
                </div>
            </div>

            <div className="flex items-center justify-between md:flex-col md:items-end md:gap-1">
                <p className={`text-lg font-bold ${variant === 'danger' ? 'text-red-400' : isPaid ? 'text-emerald-500' : 'text-foreground'}`}>
                    {formatCurrency(boleto.amount)}
                </p>
                <p className="text-xs text-muted-foreground bg-black/20 px-2 py-1 rounded-md">
                    {isPaid ? 'Pago' : `Vence ${formatShortDate(boleto.due_date)}`}
                </p>
            </div>
        </div>
    )
}
