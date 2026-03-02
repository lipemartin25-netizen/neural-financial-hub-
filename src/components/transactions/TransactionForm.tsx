'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowUpRight, ArrowDownRight, ArrowLeftRight, CreditCard, Sparkles, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export default function TransactionForm({ accounts, categories }) {
    const router = useRouter()
    const [type, setType] = useState('expense')
    const [amount, setAmount] = useState('')
    const [description, setDescription] = useState('')
    const [accountId, setAccountId] = useState(accounts[0]?.id ?? '')
    const [categoryId, setCategoryId] = useState('')
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [notes, setNotes] = useState('')

    const [loading, setLoading] = useState(false)
    const [isTyping, setIsTyping] = useState(false)
    const [suggestedCategory, setSuggestedCategory] = useState(null)

    // AI categorization logic with debounce
    useEffect(() => {
        if (description.length < 5) {
            setSuggestedCategory(null)
            return
        }

        const timer = setTimeout(async () => {
            setIsTyping(true)
            try {
                const availableCategories = categories.filter(c => c.type === type).map(c => c.name)
                const res = await fetch('/api/ai/categorize', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ transactions: [{ description, amount: parseFloat(amount) || 0 }], availableCategories })
                })
                const text = await res.text()
                const data = JSON.parse(text)
                if (data && data[0]?.category) {
                    const match = categories.find(c => c.name === data[0].category)
                    if (match) {
                        setSuggestedCategory(match)
                        if (!categoryId) setCategoryId(match.id) // Auto select only if user hasn't picked one
                    }
                }
            } catch (e) {
                console.error('Categorization error', e)
            } finally {
                setIsTyping(false)
            }
        }, 1500)

        return () => clearTimeout(timer)
    }, [description, type, amount, categories, categoryId])

    async function handleSubmit(e) {
        e.preventDefault()
        setLoading(true)
        try {
            if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
                throw new Error('Informe um valor válido maior que zero')
            }

            const res = await fetch('/api/transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type,
                    amount,
                    description,
                    account_id: accountId,
                    category_id: categoryId || (suggestedCategory?.id) || null,
                    date,
                    notes: notes || null
                })
            })

            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || 'Erro ao salvar transação')
            }

            toast.success('Transação registrada com sucesso!')
            router.push('/dashboard')
        } catch (err) {
            toast.error(err.message)
        } finally {
            setLoading(false)
        }
    }

    const selectedTypeColors = {
        expense: 'border-red-500/50 bg-red-500/10 text-red-400',
        income: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400',
        transfer: 'border-blue-500/50 bg-blue-500/10 text-blue-400'
    }

    const filteredCategories = categories.filter(c => c.type === type)

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Transaction Type Tabs */}
            <div className="grid grid-cols-3 gap-2 bg-black/20 p-1.5 rounded-xl border border-white/5">
                {[
                    { id: 'expense', label: 'Despesa', icon: ArrowDownRight },
                    { id: 'income', label: 'Receita', icon: ArrowUpRight },
                    { id: 'transfer', label: 'Transferência', icon: ArrowLeftRight }
                ].map((t) => (
                    <button
                        key={t.id}
                        type="button"
                        onClick={() => { setType(t.id); setCategoryId(''); }}
                        className={cn(
                            'flex flex-col items-center gap-1.5 py-3 rounded-lg text-sm font-medium transition-all',
                            type === t.id ? selectedTypeColors[t.id] : 'text-muted-foreground hover:bg-white/5'
                        )}
                    >
                        <t.icon className="w-5 h-5" />
                        {t.label}
                    </button>
                ))}
            </div>

            <div className="space-y-4">
                {/* Amount */}
                <div>
                    <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Valor (R$)</label>
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

                {/* Description & Date Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">Descrição</label>
                        <input
                            type="text"
                            required
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Ex: Mercado Livre"
                            className="neural-input"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">Data</label>
                        <input
                            type="date"
                            required
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="neural-input dark:[color-scheme:dark]"
                        />
                    </div>
                </div>

                {/* Account and Category */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Account */}
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">Conta</label>
                        <select
                            required
                            value={accountId}
                            onChange={(e) => setAccountId(e.target.value)}
                            className="neural-input appearance-none bg-no-repeat bg-[right_1rem_center]"
                            style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%236b7280\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundSize: '1.25rem' }}
                        >
                            {accounts.map(acc => (
                                <option key={acc.id} value={acc.id} className="bg-background text-foreground">
                                    {acc.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Category */}
                    {type !== 'transfer' && (
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="block text-sm font-medium text-foreground">Categoria</label>
                                {isTyping ? (
                                    <span className="text-[10px] text-primary flex items-center gap-1">
                                        <Loader2 className="w-3 h-3 animate-spin" /> IA pensando
                                    </span>
                                ) : suggestedCategory ? (
                                    <span className="text-[10px] text-violet-400 flex items-center gap-1 animate-fade-in" title="Categoria sugerida pela NeuraFin IA baseada na descrição">
                                        <Sparkles className="w-3 h-3" /> Sugestão IA aplicável
                                    </span>
                                ) : null}
                            </div>
                            <select
                                required
                                value={categoryId || (suggestedCategory?.id ?? '')}
                                onChange={(e) => setCategoryId(e.target.value)}
                                className="neural-input appearance-none bg-no-repeat bg-[right_1rem_center]"
                                style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%236b7280\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundSize: '1.25rem' }}
                            >
                                <option value="" disabled className="bg-background text-muted-foreground">Selecione uma categoria...</option>
                                {filteredCategories.map(cat => (
                                    <option key={cat.id} value={cat.id} className="bg-background text-foreground">
                                        {cat.icon} {cat.name} {suggestedCategory?.id === cat.id ? '✨ (Sugerido)' : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                {/* Notes */}
                <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5 flex justify-between items-center">
                        Observações <span className="text-xs text-muted-foreground font-normal">Opcional</span>
                    </label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={2}
                        className="neural-input resize-none"
                        placeholder="Alguma nota sobre esta transação..."
                    />
                </div>
            </div>

            <button
                type="submit"
                disabled={loading}
                className="btn-neural w-full flex items-center justify-center gap-2 py-3.5 text-base"
            >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CreditCard className="w-5 h-5" />}
                {loading ? 'Salvando...' : 'Registrar Transação'}
            </button>
            <p className="text-[10px] text-center text-muted-foreground flex items-center justify-center gap-1.5 mt-2">
                <Sparkles className="w-3 h-3 text-violet-400" /> A auto-categorização do Gemini funciona instantaneamente.
            </p>
        </form>
    )
}
