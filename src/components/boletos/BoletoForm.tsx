'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ReceiptText, Loader2, Calendar, FileText } from 'lucide-react'
import { toast } from 'sonner'

export default function BoletoForm({ categories }) {
    const router = useRouter()
    const [title, setTitle] = useState('')
    const [recipient, setRecipient] = useState('')
    const [amount, setAmount] = useState('')
    const [dueDate, setDueDate] = useState('')
    const [barcode, setBarcode] = useState('')
    const [categoryId, setCategoryId] = useState(categories[0]?.id ?? '')
    const [loading, setLoading] = useState(false)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)

        try {
            if (!title || !recipient) throw new Error('Título e Beneficiário são obrigatórios')
            if (!amount || parseFloat(amount) <= 0) throw new Error('Valor inválido')
            if (!dueDate) throw new Error('Data de vencimento é obrigatória')

            const payload = {
                title,
                recipient,
                amount: parseFloat(amount),
                due_date: dueDate,
                barcode: barcode || null,
                category_id: categoryId || null,
                status: 'pending'
            }

            const res = await fetch('/api/boletos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || 'Erro ao registrar boleto')
            }

            toast.success('Boleto cadastrado! Avisaremos perto do vencimento. 📨')
            router.push('/boletos')
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
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5 align-middle items-center gap-1.5">
                            <FileText className="w-4 h-4 inline" /> Nome / Título da Conta <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="neural-input font-medium"
                            placeholder="Ex: Conta de Luz (Abril), Condomínio"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5 align-middle items-center">
                            Emissor / Beneficiário <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            value={recipient}
                            onChange={(e) => setRecipient(e.target.value)}
                            className="neural-input"
                            placeholder="Ex: Enel S/A, Banco Inter"
                        />
                    </div>
                </div>

                {/* Due Date & Amount */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-y border-white/5 py-4 my-2">
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5 align-middle items-center gap-1.5 text-amber-500">
                            <Calendar className="w-4 h-4 inline" /> Vencimento <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="date"
                            required
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            className="neural-input dark:[color-scheme:dark] border-amber-500/20 focus:border-amber-500 text-amber-500 font-medium"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">
                            Valor do Boleto (R$) <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            required
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="neural-input font-bold"
                            placeholder="0.00"
                        />
                    </div>
                </div>

                {/* Category & Barcode */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">Categoria (Para relatórios)</label>
                        <select
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
                        <label className="block text-sm font-medium text-foreground mb-1.5">Código de Barras ou PIX Copia e Cola</label>
                        <input
                            type="text"
                            value={barcode}
                            onChange={(e) => setBarcode(e.target.value)}
                            className="neural-input text-xs font-mono tracking-wider placeholder:font-sans placeholder:tracking-normal"
                            placeholder="00000.00000 00000.00000..."
                        />
                    </div>
                </div>
            </div>

            <button
                type="submit"
                disabled={loading}
                className="btn-neural w-full flex items-center justify-center gap-2 py-3.5 text-base"
            >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ReceiptText className="w-5 h-5" />}
                {loading ? 'Processando fatura...' : 'Salvar Boleto / Conta'}
            </button>
        </form>
    )
}
