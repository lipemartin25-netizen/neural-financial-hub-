'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { ArrowUpRight, ArrowDownRight, Search, Filter, Plus, Calendar, Download, X, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { C, cardStyle, cardHlStyle, inputStyle, btnGoldStyle, btnOutlineStyle, fmt } from '@/lib/theme'

type Transaction = {
    id: string; name: string; desc: string; amount: number; type: 'in' | 'out'
    category: string; categoryIcon: string; date: string; account: string
}

const MOCK: Transaction[] = [
    { id: '1', name: 'Salário', desc: 'Empresa XYZ Ltda', amount: 12500, type: 'in', category: 'Salário', categoryIcon: '💰', date: '2026-03-01', account: 'Nubank' },
    { id: '2', name: 'Aluguel', desc: 'Apartamento Campinas', amount: 2800, type: 'out', category: 'Moradia', categoryIcon: '🏠', date: '2026-03-01', account: 'Itaú' },
    { id: '3', name: 'Supermercado', desc: 'Carrefour Express', amount: 487.32, type: 'out', category: 'Alimentação', categoryIcon: '🍔', date: '2026-02-28', account: 'Nubank' },
    { id: '4', name: 'Freelance', desc: 'Projeto App Mobile', amount: 4500, type: 'in', category: 'Freelance', categoryIcon: '💻', date: '2026-02-28', account: 'Inter' },
    { id: '5', name: 'Netflix', desc: 'Assinatura mensal', amount: 55.90, type: 'out', category: 'Assinaturas', categoryIcon: '📱', date: '2026-02-27', account: 'Nubank' },
    { id: '6', name: 'Uber', desc: 'Corrida trabalho', amount: 28.50, type: 'out', category: 'Transporte', categoryIcon: '🚗', date: '2026-02-27', account: 'Nubank' },
    { id: '7', name: 'Tesouro Selic', desc: 'Rendimento', amount: 312.45, type: 'in', category: 'Investimentos', categoryIcon: '📈', date: '2026-02-26', account: 'XP' },
    { id: '8', name: 'Farmácia', desc: 'Drogaria SP', amount: 156.80, type: 'out', category: 'Saúde', categoryIcon: '💊', date: '2026-02-26', account: 'Nubank' },
]

export default function TransactionsPage() {
    const [search, setSearch] = useState('')
    const [filterType, setFilterType] = useState<'all' | 'in' | 'out'>('all')
    const [showModal, setShowModal] = useState(false)

    const filtered = MOCK.filter((tx) => {
        if (filterType !== 'all' && tx.type !== filterType) return false
        if (search && !tx.name.toLowerCase().includes(search.toLowerCase())) return false
        return true
    })

    const totalIn = filtered.filter(t => t.type === 'in').reduce((s, t) => s + t.amount, 0)
    const totalOut = filtered.filter(t => t.type === 'out').reduce((s, t) => s + t.amount, 0)

    // Group by date
    const grouped: Record<string, Transaction[]> = {}
    filtered.forEach(tx => { if (!grouped[tx.date]) grouped[tx.date] = []; grouped[tx.date].push(tx) })

    const formatDate = (d: string) => {
        const date = new Date(d + 'T12:00:00')
        const today = new Date().toISOString().split('T')[0]
        if (d === today) return 'Hoje'
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
    }

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 700, color: C.text }}>Transações</h1>
                    <p style={{ fontSize: 14, color: C.textMuted, marginTop: 4 }}>Gerencie todas as suas movimentações</p>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <button style={btnOutlineStyle}><Download size={16} /> Exportar</button>
                    <button onClick={() => setShowModal(true)} style={btnGoldStyle}><Plus size={16} /> Nova Transação</button>
                </div>
            </div>

            {/* Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
                {[
                    { label: 'Receitas', value: totalIn, color: C.emerald, Icon: ArrowUpRight },
                    { label: 'Despesas', value: totalOut, color: C.red, Icon: ArrowDownRight },
                    { label: 'Saldo', value: totalIn - totalOut, color: totalIn - totalOut >= 0 ? C.emerald : C.red, Icon: Calendar },
                ].map((s, i) => (
                    <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                        style={{ ...cardStyle, padding: 20 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span style={{ fontSize: 13, color: C.textMuted }}>{s.label}</span>
                            <s.Icon size={16} style={{ color: s.color }} />
                        </div>
                        <p style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{fmt(s.value)}</p>
                    </motion.div>
                ))}
            </div>

            {/* Search + Filter */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
                    <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: C.textMuted }} />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar transação..."
                        style={{ ...inputStyle, paddingLeft: 40 }}
                    />
                </div>
                {(['all', 'in', 'out'] as const).map(t => (
                    <button key={t} onClick={() => setFilterType(t)}
                        style={filterType === t ? btnGoldStyle : btnOutlineStyle}>
                        {t === 'all' ? 'Todos' : t === 'in' ? 'Receitas' : 'Despesas'}
                    </button>
                ))}
            </div>

            {/* Transaction List */}
            {Object.entries(grouped).map(([date, txs], gi) => (
                <div key={date} style={{ marginBottom: 32 }}>
                    <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.textMuted, marginBottom: 12 }}>
                        {formatDate(date)}
                    </p>
                    {txs.map((tx, i) => (
                        <motion.div
                            key={tx.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: gi * 0.05 + i * 0.03 }}
                            style={{
                                ...cardStyle,
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: 16, marginBottom: 8,
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{
                                    width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    backgroundColor: tx.type === 'in' ? 'rgba(201,168,88,0.08)' : C.secondary, fontSize: 18,
                                }}>
                                    {tx.categoryIcon}
                                </div>
                                <div>
                                    <p style={{ fontSize: 14, fontWeight: 500, color: C.text }}>{tx.name}</p>
                                    <p style={{ fontSize: 12, color: C.textMuted }}>{tx.desc} · {tx.account}</p>
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <p style={{ fontSize: 14, fontWeight: 600, color: tx.type === 'in' ? C.emerald : C.text }}>
                                    {tx.type === 'in' ? '+' : '-'}{fmt(tx.amount)}
                                </p>
                                <p style={{ fontSize: 11, color: C.textMuted }}>{tx.category}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            ))}

            {filtered.length === 0 && (
                <div style={{ ...cardStyle, padding: 64, textAlign: 'center' }}>
                    <Search size={40} style={{ color: 'rgba(107,114,128,0.3)', margin: '0 auto 16px' }} />
                    <p style={{ fontSize: 18, fontWeight: 500, color: C.textMuted }}>Nenhuma transação encontrada</p>
                </div>
            )}

            {/* Modal */}
            <AnimatePresence>
                {showModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.6)', padding: 16 }}
                        onClick={() => setShowModal(false)}>
                        <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                            onClick={e => e.stopPropagation()} style={{ ...cardHlStyle, width: '100%', maxWidth: 440, padding: 24 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
                                <h2 style={{ fontSize: 18, fontWeight: 700, color: C.text }}>Nova Transação</h2>
                                <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: C.textMuted, cursor: 'pointer' }}><X size={20} /></button>
                            </div>
                            <div style={{ marginBottom: 16 }}>
                                <label style={{ display: 'block', fontSize: 13, color: C.textMuted, marginBottom: 6 }}>Valor</label>
                                <input type="number" placeholder="0,00" style={{ ...inputStyle, fontSize: 24, fontWeight: 700 }} />
                            </div>
                            <div style={{ marginBottom: 16 }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: C.textMuted, marginBottom: 6 }}>
                                    Descrição <Sparkles size={12} style={{ color: C.gold }} />
                                </label>
                                <input placeholder="Ex: Supermercado, Uber..." style={inputStyle} />
                                <p style={{ marginTop: 4, fontSize: 11, color: 'rgba(201,168,88,0.5)' }}>IA categoriza automaticamente</p>
                            </div>
                            <div style={{ marginBottom: 16 }}>
                                <label style={{ display: 'block', fontSize: 13, color: C.textMuted, marginBottom: 6 }}>Data</label>
                                <input type="date" defaultValue={new Date().toISOString().split('T')[0]} style={inputStyle} />
                            </div>
                            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                                <button onClick={() => setShowModal(false)} style={{ ...btnOutlineStyle, flex: 1, padding: '12px 0' }}>Cancelar</button>
                                <button style={{ ...btnGoldStyle, flex: 1, padding: '12px 0' }}>Salvar</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
