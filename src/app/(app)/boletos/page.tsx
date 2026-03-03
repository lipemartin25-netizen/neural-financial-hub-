'use client'

import { motion } from 'framer-motion'
import { FileText, Plus, AlertTriangle, Clock, CheckCircle2, Search, Calendar } from 'lucide-react'
import { useState } from 'react'
import { C, cardStyle, btnGoldStyle, btnOutlineStyle, inputStyle, fmt } from '@/lib/theme'

const STATUS = {
    pending: { label: 'Pendente', color: C.yellow, bg: 'rgba(251,191,36,0.1)', Icon: Clock },
    paid: { label: 'Pago', color: C.emerald, bg: 'rgba(52,211,153,0.1)', Icon: CheckCircle2 },
    overdue: { label: 'Vencido', color: C.red, bg: 'rgba(248,113,113,0.1)', Icon: AlertTriangle },
}

const BOLETOS = [
    { id: '1', name: 'CPFL Energia', desc: 'Conta de luz', amount: 287.45, due: '2026-03-10', status: 'pending' as const, type: '💡' },
    { id: '2', name: 'Sanasa', desc: 'Conta de água', amount: 98.30, due: '2026-03-05', status: 'overdue' as const, type: '💧' },
    { id: '3', name: 'Condomínio', desc: 'Taxa condominial', amount: 850, due: '2026-03-15', status: 'pending' as const, type: '🏢' },
    { id: '4', name: 'IPTU', desc: '3ª parcela', amount: 412.67, due: '2026-03-20', status: 'pending' as const, type: '📋' },
    { id: '5', name: 'Unimed', desc: 'Plano de saúde', amount: 680, due: '2026-02-28', status: 'paid' as const, type: '💊' },
    { id: '6', name: 'Vivo Fibra', desc: 'Internet', amount: 149.90, due: '2026-02-25', status: 'paid' as const, type: '🌐' },
]

export default function BoletosPage() {
    const [filter, setFilter] = useState<'all' | 'pending' | 'overdue' | 'paid'>('all')
    const [search, setSearch] = useState('')

    const filtered = BOLETOS.filter(b => {
        if (filter !== 'all' && b.status !== filter) return false
        if (search && !b.name.toLowerCase().includes(search.toLowerCase())) return false
        return true
    })

    const overdueItems = BOLETOS.filter(b => b.status === 'overdue')

    const daysUntil = (date: string) => {
        const d = Math.ceil((new Date(date).getTime() - Date.now()) / 86400000)
        if (d === 0) return 'Hoje'
        if (d < 0) return `${Math.abs(d)}d atrás`
        return `${d}d`
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 700, color: C.text }}>Contas a Pagar</h1>
                    <p style={{ fontSize: 14, color: C.textMuted, marginTop: 4 }}>Acompanhe e controle seus boletos</p>
                </div>
                <button style={btnGoldStyle}><Plus size={16} /> Novo Boleto</button>
            </div>

            {overdueItems.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 16, borderRadius: 16, border: '1px solid rgba(248,113,113,0.2)', backgroundColor: 'rgba(248,113,113,0.05)', marginBottom: 24 }}>
                    <AlertTriangle size={24} style={{ color: C.red, flexShrink: 0 }} />
                    <div>
                        <p style={{ fontWeight: 600, color: C.red }}>{overdueItems.length} boleto(s) vencido(s)</p>
                        <p style={{ fontSize: 13, color: 'rgba(248,113,113,0.6)' }}>Total: {fmt(overdueItems.reduce((s, b) => s + b.amount, 0))}</p>
                    </div>
                </div>
            )}

            <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
                    <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: C.textMuted }} />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..." style={{ ...inputStyle, paddingLeft: 40 }} />
                </div>
                {(['all', 'pending', 'overdue', 'paid'] as const).map(f => (
                    <button key={f} onClick={() => setFilter(f)} style={filter === f ? btnGoldStyle : btnOutlineStyle}>
                        {f === 'all' ? 'Todos' : f === 'pending' ? 'Pendentes' : f === 'overdue' ? 'Vencidos' : 'Pagos'}
                    </button>
                ))}
            </div>

            {filtered.map((b, i) => {
                const st = STATUS[b.status]
                return (
                    <motion.div key={b.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                        style={{ ...cardStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 20, marginBottom: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: st.bg }}>
                                <st.Icon size={18} style={{ color: st.color }} />
                            </div>
                            <div>
                                <p style={{ fontSize: 14, fontWeight: 500, color: C.text }}>{b.name}</p>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                                    <span style={{ fontSize: 12, color: C.textMuted }}>{b.type} {b.desc}</span>
                                    <span style={{ fontSize: 12, color: C.textMuted }}>·</span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: C.textMuted }}>
                                        <Calendar size={10} />
                                        {new Date(b.due).toLocaleDateString('pt-BR')}
                                        <span style={{ fontWeight: 500, color: b.status === 'overdue' ? C.red : b.status === 'pending' ? C.yellow : C.textMuted }}>
                                            ({daysUntil(b.due)})
                                        </span>
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                            <p style={{
                                fontSize: 16, fontWeight: 700,
                                color: b.status === 'paid' ? C.textMuted : b.status === 'overdue' ? C.red : C.text,
                                textDecoration: b.status === 'paid' ? 'line-through' : 'none',
                            }}>{fmt(b.amount)}</p>
                            {b.status !== 'paid' && (
                                <button style={{ padding: '6px 12px', borderRadius: 8, border: 'none', backgroundColor: 'rgba(52,211,153,0.1)', color: C.emerald, fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
                                    Paguei ✓
                                </button>
                            )}
                        </div>
                    </motion.div>
                )
            })}

            {filtered.length === 0 && (
                <div style={{ ...cardStyle, padding: 64, textAlign: 'center' }}>
                    <FileText size={40} style={{ color: 'rgba(107,114,128,0.3)', margin: '0 auto 16px' }} />
                    <p style={{ fontSize: 18, fontWeight: 500, color: C.textMuted }}>Nenhum boleto encontrado</p>
                </div>
            )}
        </div>
    )
}
