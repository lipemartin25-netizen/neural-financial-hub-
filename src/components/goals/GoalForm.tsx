'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Target, Loader2, Calendar } from 'lucide-react'
import { toast } from 'sonner'

const EMOJIS = ['🏖️', '🚗', '🏡', '🎓', '🏥', '🎉', '💍', '💼', '💻']
const COLORS = [
    '#f43f5e', // Rose
    '#ec4899', // Pink
    '#d946ef', // Fuchsia
    '#8b5cf6', // Violet
    '#3b82f6', // Blue
    '#06b6d4', // Cyan
    '#10b981', // Emerald
    '#84cc16', // Lime
    '#eab308', // Yellow
    '#f97316'  // Orange
]

export default function GoalForm() {
    const router = useRouter()
    const [name, setName] = useState('')
    const [targetAmount, setTargetAmount] = useState('')
    const [currentAmount, setCurrentAmount] = useState('')
    const [targetDate, setTargetDate] = useState('')
    const [monthlyContribution, setMonthlyContribution] = useState('')

    const [icon, setIcon] = useState(EMOJIS[0])
    const [color, setColor] = useState(COLORS[0])

    const [loading, setLoading] = useState(false)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)

        try {
            if (!name) throw new Error('Dê um nome ao seu sonho')
            if (!targetAmount || parseFloat(targetAmount) <= 0) {
                throw new Error('O valor alvo da meta precisa ser maior que zero')
            }

            const payload = {
                name,
                target_amount: parseFloat(targetAmount),
                current_amount: currentAmount ? parseFloat(currentAmount) : 0,
                target_date: targetDate || null,
                monthly_contribution: monthlyContribution ? parseFloat(monthlyContribution) : null,
                icon,
                color
            }

            const res = await fetch('/api/goals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || 'Erro ao salvar meta')
            }

            toast.success('Meta criada com sucesso! 🚀')
            router.push('/goals')
            router.refresh()
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Erro ao salvar')
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            {/* Icon and Color picker */}
            <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1 w-full overflow-hidden">
                    <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                        Ícone Expresso
                    </label>
                    <div className="flex overflow-x-auto bg-black/20 p-2 rounded-xl border border-white/5 scrollbar-none gap-2">
                        {EMOJIS.map(emoji => (
                            <button
                                key={emoji}
                                type="button"
                                onClick={() => setIcon(emoji)}
                                className={`w-10 h-10 rounded-lg shrink-0 text-xl flex items-center justify-center transition-all ${icon === emoji ? 'bg-primary/20 scale-110 shadow-lg border border-primary/50' : 'hover:bg-white/5 opacity-50 hover:opacity-100'}`}
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex-1 w-full overflow-hidden">
                    <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                        Cor Temática
                    </label>
                    <div className="flex overflow-x-auto bg-black/20 p-2 rounded-xl border border-white/5 scrollbar-none gap-3">
                        {COLORS.map(c => (
                            <button
                                key={c}
                                type="button"
                                onClick={() => setColor(c)}
                                className={`w-8 h-8 rounded-full shrink-0 border-2 transition-all my-1 mx-0.5 ${color === c ? 'scale-125 border-white shadow-[0_0_15px_rgba(255,255,255,0.4)]' : 'border-transparent opacity-60 hover:opacity-100 hover:scale-110'}`}
                                style={{ backgroundColor: c }}
                            />
                        ))}
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5 flex items-center gap-2">
                        O que você quer alcançar?
                    </label>
                    <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="neural-input text-lg font-medium placeholder:font-normal"
                        placeholder="Ex: Viagem para o Japão 🇯🇵, Reserva de Emergência 🧯"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5 flex justify-between">
                            Valor Total (R$) <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            required
                            value={targetAmount}
                            onChange={(e) => setTargetAmount(e.target.value)}
                            className="neural-input text-2xl font-bold font-mono placeholder:font-sans"
                            placeholder="0.00"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5 flex justify-between">
                            Já Tenho Guardado (R$)
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            value={currentAmount}
                            onChange={(e) => setCurrentAmount(e.target.value)}
                            className="neural-input"
                            placeholder="0.00"
                        />
                    </div>
                </div>

                <div className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-4 mt-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-5 h-5 text-primary" />
                        <h3 className="font-semibold text-foreground">Planejamento (Opcional)</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1.5">Data Previsão</label>
                            <input
                                type="date"
                                value={targetDate}
                                onChange={(e) => setTargetDate(e.target.value)}
                                className="neural-input dark:[color-scheme:dark]"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1.5">Aporte Mensal (R$)</label>
                            <input
                                type="number"
                                step="0.01"
                                value={monthlyContribution}
                                onChange={(e) => setMonthlyContribution(e.target.value)}
                                className="neural-input border-emerald-500/20 focus:border-emerald-500 text-emerald-400"
                                placeholder="0.00"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <button
                type="submit"
                disabled={loading}
                className="btn-neural w-full flex items-center justify-center gap-2 py-3.5 text-base"
            >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Target className="w-5 h-5" />}
                {loading ? 'Preparando os motores...' : 'Criar Nova Meta'}
            </button>
        </form>
    )
}
