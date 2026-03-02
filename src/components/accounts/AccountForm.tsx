'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Wallet, CreditCard, Landmark, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const ACCOUNT_TYPES = [
    { id: 'checking', label: 'Conta Corrente', icon: Wallet },
    { id: 'credit_card', label: 'Cartão de Crédito', icon: CreditCard },
    { id: 'savings', label: 'Conta Poupança', icon: Landmark },
    { id: 'investment', label: 'Investimento', icon: Landmark },
    { id: 'cash', label: 'Dinheiro', icon: Wallet }
]

const BRAND_COLORS = [
    { id: 'roxo', value: '#6366f1' }, // Nubank/Neon
    { id: 'laranja', value: '#f97316' }, // Inter
    { id: 'amarelo', value: '#eab308' }, // Will/BB
    { id: 'verde', value: '#10b981' }, // Sicredi/PicPay
    { id: 'azul', value: '#3b82f6' }, // Caixa/BB
    { id: 'vermelho', value: '#ef4444' }, // Bradesco/Santander
    { id: 'grafite', value: '#4b5563' } // C6/Platinum
]

export default function AccountForm() {
    const router = useRouter()
    const [type, setType] = useState('checking')
    const [name, setName] = useState('')
    const [balance, setBalance] = useState('')
    const [color, setColor] = useState(BRAND_COLORS[0].value)
    const [creditLimit, setCreditLimit] = useState('')
    const [closingDay, setClosingDay] = useState('')
    const [dueDay, setDueDay] = useState('')
    const [includeInTotal, setIncludeInTotal] = useState(true)

    const [loading, setLoading] = useState(false)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)

        try {
            if (!name) throw new Error('O nome da conta é obrigatório')
            if (type === 'credit_card' && (!creditLimit || !closingDay || !dueDay)) {
                throw new Error('Preencha os dados do cartão de crédito (limite, fechamento e vencimento)')
            }

            const payload = {
                name,
                type,
                color,
                balance: parseFloat(balance) || 0,
                include_in_total: includeInTotal,
                ...(type === 'credit_card' ? {
                    credit_limit: parseFloat(creditLimit),
                    closing_day: parseInt(closingDay),
                    due_day: parseInt(dueDay)
                } : {})
            }

            const res = await fetch('/api/accounts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || 'Erro ao criar conta')
            }

            toast.success('Conta criada com sucesso!')
            router.push('/accounts')
            router.refresh()
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Erro ao salvar')
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Type Selection */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {ACCOUNT_TYPES.map(t => (
                    <button
                        key={t.id}
                        type="button"
                        onClick={() => setType(t.id)}
                        className={cn(
                            'flex flex-col items-center justify-center p-3 rounded-xl border transition-all',
                            type === t.id
                                ? 'bg-primary/10 border-primary text-primary shadow-[0_0_15px_rgba(99,102,241,0.2)]'
                                : 'bg-white/5 border-white/5 text-muted-foreground hover:bg-white/10'
                        )}
                    >
                        <t.icon className="w-5 h-5 mb-1.5" />
                        <span className="text-[10px] uppercase font-bold tracking-wider">{t.label}</span>
                    </button>
                ))}
            </div>

            <div className="space-y-4">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">Cor / Instituição</label>
                        <div className="flex bg-black/20 p-2 rounded-xl justify-between border border-white/5">
                            {BRAND_COLORS.map(c => (
                                <button
                                    key={c.id}
                                    type="button"
                                    onClick={() => setColor(c.value)}
                                    className={cn(
                                        'w-8 h-8 rounded-full border-2 transition-transform',
                                        color === c.value ? 'scale-110 border-white shadow-[0_0_10px_rgba(255,255,255,0.4)]' : 'border-transparent hover:scale-105 opacity-60'
                                    )}
                                    style={{ backgroundColor: c.value }}
                                />
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">Nome da Conta / Cartão</label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder={type === 'credit_card' ? 'Ex: Nubank, Mastercard Black' : 'Ex: Iti, BB Corrente'}
                            className="neural-input"
                        />
                    </div>
                </div>

                {/* Balance / Limit depending on type */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">
                            {type === 'credit_card' ? 'Fatura Atual (R$)' : 'Saldo Atual (R$)'}
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            value={balance}
                            onChange={(e) => setBalance(e.target.value)}
                            placeholder="0.00"
                            className="neural-input font-bold"
                        />
                    </div>

                    {type === 'credit_card' && (
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1.5">Limite Total (R$)</label>
                            <input
                                type="number"
                                step="0.01"
                                required={type === 'credit_card'}
                                value={creditLimit}
                                onChange={(e) => setCreditLimit(e.target.value)}
                                placeholder="0.00"
                                className="neural-input text-amber-400"
                            />
                        </div>
                    )}
                </div>

                {type === 'credit_card' && (
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1.5">Dia de Fechamento</label>
                            <input
                                type="number"
                                min="1" max="31"
                                required
                                value={closingDay}
                                onChange={(e) => setClosingDay(e.target.value)}
                                className="neural-input"
                                placeholder="Ex: 5"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1.5">Dia de Vencimento</label>
                            <input
                                type="number"
                                min="1" max="31"
                                required
                                value={dueDay}
                                onChange={(e) => setDueDay(e.target.value)}
                                className="neural-input"
                                placeholder="Ex: 12"
                            />
                        </div>
                    </div>
                )}

                {/* Options */}
                <div className="flex items-center gap-3 bg-white/5 p-4 rounded-xl border border-white/5">
                    <input
                        type="checkbox"
                        id="includeTotal"
                        checked={includeInTotal}
                        onChange={(e) => setIncludeInTotal(e.target.checked)}
                        className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary accent-primary"
                    />
                    <div className="flex flex-col">
                        <label htmlFor="includeTotal" className="text-sm font-medium text-foreground cursor-pointer">
                            Incluir no Saldo Consolidado
                        </label>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Se desmarcado, não somará ao seu patrimônio líquido total no dashboard</p>
                    </div>
                </div>
            </div>

            <button
                type="submit"
                disabled={loading}
                className="btn-neural w-full flex items-center justify-center gap-2 py-3"
            >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wallet className="w-5 h-5" />}
                {loading ? 'Salvando...' : 'Cadastrar Conta'}
            </button>
        </form>
    )
}
