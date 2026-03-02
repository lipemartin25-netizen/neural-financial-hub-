'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PiggyBank, Loader2, BellRing } from 'lucide-react'
import { toast } from 'sonner'

export default function BudgetForm({ categories }) {
    const router = useRouter()
    const [categoryId, setCategoryId] = useState(categories[0]?.id ?? '')
    const [amount, setAmount] = useState('')
    const [alertThreshold, setAlertThreshold] = useState(80) // 80% default
    const [loading, setLoading] = useState(false)

    async function handleSubmit(e) {
        e.preventDefault()
        setLoading(true)

        try {
            if (!categoryId) throw new Error('Selecione uma categoria')
            if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
                throw new Error('Informe um valor limite válido maior que zero')
            }

            const res = await fetch('/api/budgets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    category_id: categoryId,
                    amount: parseFloat(amount),
                    alert_threshold: alertThreshold,
                    period: 'monthly'
                })
            })

            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || 'Erro ao criar orçamento')
            }

            toast.success('Orçamento salvo com sucesso!')
            router.push('/budgets')
            router.refresh()
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Erro ao salvar')
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Categoria do Gasto</label>
                    <select
                        required
                        value={categoryId}
                        onChange={(e) => setCategoryId(e.target.value)}
                        className="neural-input appearance-none bg-no-repeat bg-[right_1rem_center]"
                        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%236b7280\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundSize: '1.25rem' }}
                    >
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.id} className="bg-background text-foreground">
                                {cat.icon} {cat.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                        Limite Máximo Mensal (R$)
                    </label>
                    <input
                        type="number"
                        step="0.01"
                        required
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full text-4xl bg-transparent border-b-2 border-border focus:border-primary outline-none py-2 text-foreground transition-colors placeholder:text-muted-foreground/30 font-bold"
                        placeholder="0.00"
                    />
                </div>

                <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl space-y-3">
                    <div className="flex justify-between items-center">
                        <label className="text-sm font-medium flex items-center gap-2 text-amber-400">
                            <BellRing className="w-4 h-4" /> Alerta de Consumo
                        </label>
                        <span className="text-amber-400 font-bold">{alertThreshold}%</span>
                    </div>

                    <input
                        type="range"
                        min="50"
                        max="100"
                        value={alertThreshold}
                        onChange={(e) => setAlertThreshold(parseInt(e.target.value))}
                        className="w-full h-2 bg-black/30 rounded-lg appearance-none cursor-pointer accent-amber-400"
                    />
                    <p className="text-xs text-amber-500/80">
                        Você será notificado e o painel piscará em alerta quando seus gastos nesta categoria atingirem {alertThreshold}% do limite estipulado.
                    </p>
                </div>
            </div>

            <button
                type="submit"
                disabled={loading}
                className="btn-neural w-full flex items-center justify-center gap-2 py-3.5"
            >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <PiggyBank className="w-5 h-5" />}
                {loading ? 'Salvando...' : 'Ativar Orçamento Seguro'}
            </button>
        </form>
    )
}
