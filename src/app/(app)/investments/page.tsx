'use client'

import { motion } from 'framer-motion'
import { TrendingUp, Plus, Eye, EyeOff, ArrowUpRight, ArrowDownRight, DollarSign, Percent, BarChart3, PieChart } from 'lucide-react'
import { useState } from 'react'
import { C, cardStyle, btnGoldStyle, btnOutlineStyle, fmt, fmtPct } from '@/lib/theme'

const TYPE_MAP: Record<string, { label: string; icon: string }> = {
    renda_fixa: { label: 'Renda Fixa', icon: '🏦' },
    acao: { label: 'Ações', icon: '📊' },
    fii: { label: 'FIIs', icon: '🏢' },
    cripto: { label: 'Cripto', icon: '₿' },
    fundo: { label: 'Fundos', icon: '📁' },
}

const COLORS: Record<string, string> = { renda_fixa: C.emerald, acao: C.blue, fii: C.violet, cripto: C.yellow, fundo: '#6B7280' }

const INVESTMENTS = [
    { ticker: 'IPCA35', name: 'Tesouro IPCA+ 2035', type: 'renda_fixa', invested: 45000, current: 52300, monthlyReturn: 1.2 },
    { ticker: 'SELIC29', name: 'Tesouro Selic 2029', type: 'renda_fixa', invested: 30000, current: 31800, monthlyReturn: 0.9 },
    { ticker: 'VALE3', name: 'Vale S.A.', type: 'acao', invested: 12000, current: 14800, monthlyReturn: 2.8 },
    { ticker: 'PETR4', name: 'Petrobras', type: 'acao', invested: 8000, current: 9200, monthlyReturn: -1.5 },
    { ticker: 'MGLU3', name: 'Magazine Luiza', type: 'acao', invested: 5000, current: 3100, monthlyReturn: -8.2 },
    { ticker: 'MXRF11', name: 'MXRF11', type: 'fii', invested: 10000, current: 10800, monthlyReturn: 0.85 },
    { ticker: 'HGLG11', name: 'HGLG11', type: 'fii', invested: 15000, current: 16500, monthlyReturn: 0.72 },
    { ticker: 'BTC', name: 'Bitcoin', type: 'cripto', invested: 10000, current: 18500, monthlyReturn: 12.5 },
    { ticker: 'ETH', name: 'Ethereum', type: 'cripto', invested: 5000, current: 7200, monthlyReturn: 8.3 },
]

export default function InvestmentsPage() {
    const [showValues, setShowValues] = useState(true)
    const [selectedType, setSelectedType] = useState('all')
    const display = (v: number) => showValues ? fmt(v) : '•••••'

    const filtered = selectedType === 'all' ? INVESTMENTS : INVESTMENTS.filter(i => i.type === selectedType)
    const totalInvested = INVESTMENTS.reduce((s, i) => s + i.invested, 0)
    const totalCurrent = INVESTMENTS.reduce((s, i) => s + i.current, 0)
    const totalReturn = totalCurrent - totalInvested
    const totalReturnPct = (totalReturn / totalInvested) * 100

    // Allocation
    const allocation = Object.entries(TYPE_MAP).map(([type, meta]) => {
        const items = INVESTMENTS.filter(i => i.type === type)
        const total = items.reduce((s, i) => s + i.current, 0)
        return { type, ...meta, total, pct: totalCurrent > 0 ? (total / totalCurrent) * 100 : 0 }
    }).filter(a => a.total > 0)

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 700, color: C.text }}>Investimentos</h1>
                    <p style={{ fontSize: 14, color: C.textMuted, marginTop: 4 }}>Acompanhe sua carteira</p>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <button onClick={() => setShowValues(!showValues)} style={btnOutlineStyle}>
                        {showValues ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    <button style={btnGoldStyle}><Plus size={16} /> Novo Ativo</button>
                </div>
            </div>

            {/* Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
                {[
                    { label: 'Investido', value: display(totalInvested), Icon: DollarSign, color: C.textMuted },
                    { label: 'Valor Atual', value: display(totalCurrent), Icon: TrendingUp, color: C.gold },
                    { label: 'Rendimento', value: display(totalReturn), Icon: totalReturn >= 0 ? ArrowUpRight : ArrowDownRight, color: totalReturn >= 0 ? C.emerald : C.red },
                    { label: 'Rentabilidade', value: fmtPct(totalReturnPct), Icon: Percent, color: totalReturnPct >= 0 ? C.emerald : C.red },
                ].map((s, i) => (
                    <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                        style={{ ...cardStyle, padding: 20 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span style={{ fontSize: 13, color: C.textMuted }}>{s.label}</span>
                            <s.Icon size={16} style={{ color: s.color }} />
                        </div>
                        <p style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.value}</p>
                    </motion.div>
                ))}
            </div>

            {/* Allocation Bar */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                style={{ ...cardStyle, padding: 24, marginBottom: 24 }}>
                <h3 style={{ fontWeight: 600, color: C.text, marginBottom: 16 }}>Alocação da Carteira</h3>
                <div style={{ display: 'flex', height: 16, borderRadius: 999, overflow: 'hidden', marginBottom: 16 }}>
                    {allocation.map(a => (
                        <div key={a.type} style={{ width: `${a.pct}%`, height: '100%', backgroundColor: COLORS[a.type] }} title={`${a.label}: ${a.pct.toFixed(1)}%`} />
                    ))}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                    {allocation.map(a => (
                        <div key={a.type} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 10, height: 10, borderRadius: 999, backgroundColor: COLORS[a.type] }} />
                            <span style={{ fontSize: 12, color: C.textMuted }}>{a.icon} {a.label}</span>
                            <span style={{ fontSize: 12, fontWeight: 500, color: C.text }}>{a.pct.toFixed(1)}%</span>
                        </div>
                    ))}
                </div>
            </motion.div>

            {/* Filter */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
                <button onClick={() => setSelectedType('all')} style={selectedType === 'all' ? { ...btnGoldStyle, borderRadius: 999, padding: '6px 16px', fontSize: 12 } : { ...btnOutlineStyle, borderRadius: 999, padding: '6px 16px', fontSize: 12 }}>Todos</button>
                {Object.entries(TYPE_MAP).map(([type, meta]) => (
                    <button key={type} onClick={() => setSelectedType(type)}
                        style={selectedType === type ? { ...btnGoldStyle, borderRadius: 999, padding: '6px 16px', fontSize: 12 } : { ...btnOutlineStyle, borderRadius: 999, padding: '6px 16px', fontSize: 12 }}>
                        {meta.icon} {meta.label}
                    </button>
                ))}
            </div>

            {/* Investment Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
                {filtered.map((inv, i) => {
                    const ret = inv.current - inv.invested
                    const retPct = (ret / inv.invested) * 100
                    const positive = ret >= 0
                    return (
                        <motion.div key={inv.ticker} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                            style={{ ...cardStyle, padding: 20 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div style={{ width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: `${COLORS[inv.type]}15`, fontSize: 16 }}>
                                        {TYPE_MAP[inv.type]?.icon}
                                    </div>
                                    <div>
                                        <p style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{inv.ticker}</p>
                                        <p style={{ fontSize: 11, color: C.textMuted }}>{inv.name}</p>
                                    </div>
                                </div>
                                <span style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 2, padding: '4px 8px', borderRadius: 8, fontSize: 11, fontWeight: 500,
                                    color: positive ? C.emerald : C.red,
                                    backgroundColor: positive ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)',
                                }}>
                                    {positive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                                    {fmtPct(inv.monthlyReturn)}
                                </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                                <span style={{ color: C.textMuted }}>Investido</span>
                                <span style={{ color: C.text }}>{display(inv.invested)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                                <span style={{ color: C.textMuted }}>Atual</span>
                                <span style={{ fontWeight: 500, color: C.text }}>{display(inv.current)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                                <span style={{ color: C.textMuted }}>Rendimento</span>
                                <span style={{ fontWeight: 600, color: positive ? C.emerald : C.red }}>{display(ret)} ({fmtPct(retPct)})</span>
                            </div>
                        </motion.div>
                    )
                })}
            </div>
        </div>
    )
}
