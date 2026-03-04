'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { TrendingUp, Plus, Eye, EyeOff, ArrowUpRight, ArrowDownRight, DollarSign, Percent, X, Trash2, Loader2, ChevronDown } from 'lucide-react'
import { useState, useMemo, useCallback } from 'react'
import { C, cardStyle, cardHlStyle, inputStyle, btnGoldStyle, btnOutlineStyle, fmt, fmtPct } from '@/lib/theme'
import { toast } from 'sonner'
import { useInvestments } from '@/hooks/useInvestments'
import type { Investment } from '@/types/database'

const TYPE_MAP: Record<string, { label: string; icon: string }> = {
    renda_fixa: { label: 'Renda Fixa', icon: '🏦' },
    acao: { label: 'Ações', icon: '📊' },
    fii: { label: 'FIIs', icon: '🏢' },
    cripto: { label: 'Cripto', icon: '₿' },
    fundo: { label: 'Fundos', icon: '📁' },
    etf: { label: 'ETFs', icon: '📈' },
    coe: { label: 'COE', icon: '🔗' },
    previdencia: { label: 'Previdência', icon: '🛡️' },
    outros: { label: 'Outros', icon: '📦' },
}

const COLORS: Record<string, string> = {
    renda_fixa: C.emerald,
    acao: C.blue,
    fii: C.violet,
    cripto: C.yellow,
    fundo: '#6B7280',
    etf: C.cyan,
    coe: C.orange,
    previdencia: C.pink,
    outros: '#9ca3af',
}

type UiInvestment = {
    id: string
    ticker: string
    name: string
    type: string
    invested: number
    current: number
    monthlyReturn: number
    raw: Investment
}

function mapToUi(inv: Investment): UiInvestment {
    return {
        id: inv.id,
        ticker: inv.ticker,
        name: inv.name ?? inv.ticker,
        type: inv.type,
        invested: Number(inv.invested_amount),
        current: Number(inv.current_value),
        monthlyReturn: Number(inv.monthly_return ?? 0),
        raw: inv,
    }
}

export default function InvestmentsPage() {
    const { investments: rawInv, loading, createInvestment, updateInvestment, deleteInvestment } = useInvestments()

    const investments = useMemo(() => rawInv.map(mapToUi), [rawInv])

    const [showValues, setShowValues] = useState(true)
    const [selectedType, setSelectedType] = useState('all')
    const [showModal, setShowModal] = useState(false)
    const [editingInv, setEditingInv] = useState<UiInvestment | null>(null)
    const [deleting, setDeleting] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)

    // Form State
    const [ticker, setTicker] = useState('')
    const [invName, setInvName] = useState('')
    const [invType, setInvType] = useState('renda_fixa')
    const [invAmount, setInvAmount] = useState('')
    const [invCurrent, setInvCurrent] = useState('')
    const [invMonthly, setInvMonthly] = useState('')
    const [invQty, setInvQty] = useState('')
    const [invNotes, setInvNotes] = useState('')

    const display = (v: number) => showValues ? fmt(v) : '•••••'

    const filtered = selectedType === 'all' ? investments : investments.filter(i => i.type === selectedType)
    const totalInvested = investments.reduce((s, i) => s + i.invested, 0)
    const totalCurrent = investments.reduce((s, i) => s + i.current, 0)
    const totalReturn = totalCurrent - totalInvested
    const totalReturnPct = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0

    // Allocation
    const allocation = useMemo(() => {
        return Object.entries(TYPE_MAP).map(([type, meta]) => {
            const items = investments.filter(i => i.type === type)
            const total = items.reduce((s, i) => s + i.current, 0)
            return { type, ...meta, total, pct: totalCurrent > 0 ? (total / totalCurrent) * 100 : 0 }
        }).filter(a => a.total > 0)
    }, [investments, totalCurrent])

    // Tipos que existem na carteira (pra filtro dinâmico)
    const activeTypes = useMemo(() => {
        const types = new Set(investments.map(i => i.type))
        return Object.entries(TYPE_MAP).filter(([type]) => types.has(type))
    }, [investments])

    const resetForm = useCallback(() => {
        setTicker('')
        setInvName('')
        setInvType('renda_fixa')
        setInvAmount('')
        setInvCurrent('')
        setInvMonthly('')
        setInvQty('')
        setInvNotes('')
        setEditingInv(null)
    }, [])

    const openCreate = useCallback(() => {
        resetForm()
        setShowModal(true)
    }, [resetForm])

    const openEdit = useCallback((inv: UiInvestment) => {
        setEditingInv(inv)
        setTicker(inv.ticker)
        setInvName(inv.name)
        setInvType(inv.type)
        setInvAmount(String(inv.invested))
        setInvCurrent(String(inv.current))
        setInvMonthly(inv.monthlyReturn ? String(inv.monthlyReturn) : '')
        setInvQty(inv.raw.quantity ? String(inv.raw.quantity) : '')
        setInvNotes(inv.raw.notes ?? '')
        setShowModal(true)
    }, [])

    const handleSave = async () => {
        if (!ticker || !invAmount) {
            toast.error('Preencha o ticker e o valor investido')
            return
        }

        setSaving(true)

        if (editingInv) {
            // ========== EDITAR ==========
            const { error } = await updateInvestment(editingInv.id, {
                ticker: ticker.toUpperCase(),
                name: invName || ticker.toUpperCase(),
                type: invType,
                invested_amount: parseFloat(invAmount),
                current_value: invCurrent ? parseFloat(invCurrent) : parseFloat(invAmount),
                monthly_return: invMonthly ? parseFloat(invMonthly) : 0,
                quantity: invQty ? parseFloat(invQty) : 0,
                notes: invNotes || null,
            })

            setSaving(false)
            if (error) {
                toast.error(error, { style: { background: C.card, color: C.red, border: `1px solid rgba(248,113,113,0.3)` } })
            } else {
                setShowModal(false)
                resetForm()
                toast.success('Investimento atualizado!', { style: { background: C.card, color: C.text, border: `1px solid ${C.border}` } })
            }
        } else {
            // ========== CRIAR ==========
            const { error } = await createInvestment({
                ticker: ticker.toUpperCase(),
                name: invName || ticker.toUpperCase(),
                type: invType,
                invested_amount: parseFloat(invAmount),
                current_value: invCurrent ? parseFloat(invCurrent) : parseFloat(invAmount),
                monthly_return: invMonthly ? parseFloat(invMonthly) : null,
            })

            setSaving(false)
            if (error) {
                toast.error(error, { style: { background: C.card, color: C.red, border: `1px solid rgba(248,113,113,0.3)` } })
            } else {
                setShowModal(false)
                resetForm()
                toast.success('Ativo adicionado com sucesso!', { style: { background: C.card, color: C.text, border: `1px solid ${C.border}` } })
            }
        }
    }

    const handleDelete = async (id: string) => {
        setDeleting(id)
        const { error } = await deleteInvestment(id)
        setDeleting(null)

        if (error) {
            toast.error(error, { style: { background: C.card, color: C.red, border: `1px solid rgba(248,113,113,0.3)` } })
        } else {
            toast.success('Ativo removido', { style: { background: C.card, color: C.text, border: `1px solid ${C.border}` } })
        }
    }

    const selectStyle: React.CSSProperties = {
        ...inputStyle,
        appearance: 'none',
        WebkitAppearance: 'none',
        backgroundImage: 'none',
        cursor: 'pointer',
    }

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 700, color: C.text }}>Investimentos</h1>
                    <p style={{ fontSize: 14, color: C.textMuted, marginTop: 4 }}>
                        {loading ? 'Carregando...' : `${investments.length} ativos · Acompanhe sua carteira`}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <button onClick={() => setShowValues(!showValues)} style={btnOutlineStyle}>
                        {showValues ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    <button onClick={openCreate} style={btnGoldStyle}><Plus size={16} /> Novo Ativo</button>
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
            {!loading && allocation.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                    style={{ ...cardStyle, padding: 24, marginBottom: 24 }}>
                    <h3 style={{ fontWeight: 600, color: C.text, marginBottom: 16 }}>Alocação da Carteira</h3>
                    <div style={{ display: 'flex', height: 16, borderRadius: 999, overflow: 'hidden', marginBottom: 16 }}>
                        {allocation.map(a => (
                            <div key={a.type} style={{ width: `${a.pct}%`, height: '100%', backgroundColor: COLORS[a.type] ?? '#6b7280' }} title={`${a.label}: ${a.pct.toFixed(1)}%`} />
                        ))}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                        {allocation.map(a => (
                            <div key={a.type} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <div style={{ width: 10, height: 10, borderRadius: 999, backgroundColor: COLORS[a.type] ?? '#6b7280' }} />
                                <span style={{ fontSize: 12, color: C.textMuted }}>{a.icon} {a.label}</span>
                                <span style={{ fontSize: 12, fontWeight: 500, color: C.text }}>{a.pct.toFixed(1)}%</span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Filter */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
                <button onClick={() => setSelectedType('all')}
                    style={selectedType === 'all'
                        ? { ...btnGoldStyle, borderRadius: 999, padding: '6px 16px', fontSize: 12 }
                        : { ...btnOutlineStyle, borderRadius: 999, padding: '6px 16px', fontSize: 12 }
                    }>Todos</button>
                {activeTypes.map(([type, meta]) => (
                    <button key={type} onClick={() => setSelectedType(type)}
                        style={selectedType === type
                            ? { ...btnGoldStyle, borderRadius: 999, padding: '6px 16px', fontSize: 12 }
                            : { ...btnOutlineStyle, borderRadius: 999, padding: '6px 16px', fontSize: 12 }
                        }>
                        {meta.icon} {meta.label}
                    </button>
                ))}
            </div>

            {/* Loading */}
            {loading && (
                <div style={{ ...cardStyle, padding: 64, textAlign: 'center' }}>
                    <Loader2 size={32} style={{ color: C.gold, margin: '0 auto 16px', animation: 'spin 1s linear infinite' }} />
                    <p style={{ fontSize: 14, color: C.textMuted }}>Carregando investimentos...</p>
                </div>
            )}

            {/* Empty */}
            {!loading && investments.length === 0 && (
                <div style={{ ...cardStyle, padding: 64, textAlign: 'center' }}>
                    <TrendingUp size={40} style={{ color: 'rgba(107,114,128,0.3)', margin: '0 auto 16px' }} />
                    <p style={{ fontSize: 18, fontWeight: 500, color: C.textMuted }}>Nenhum investimento cadastrado</p>
                    <p style={{ fontSize: 13, color: 'rgba(107,114,128,0.5)', marginTop: 8 }}>
                        Clique em &quot;Novo Ativo&quot; para adicionar seu primeiro investimento
                    </p>
                </div>
            )}

            {/* Investment Cards */}
            {!loading && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
                    <AnimatePresence>
                        {filtered.map((inv, i) => {
                            const ret = inv.current - inv.invested
                            const retPct = inv.invested > 0 ? (ret / inv.invested) * 100 : 0
                            const positive = ret >= 0
                            return (
                                <motion.div key={inv.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: i * 0.04 }}
                                    style={{ ...cardStyle, padding: 20, cursor: 'pointer', position: 'relative' }}
                                    onClick={() => openEdit(inv)}>

                                    {/* Delete */}
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDelete(inv.id) }}
                                        disabled={deleting === inv.id}
                                        style={{
                                            position: 'absolute', top: 12, right: 12,
                                            background: 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 8,
                                            color: 'rgba(248,113,113,0.4)', transition: 'color 0.2s',
                                        }}
                                        onMouseEnter={e => (e.currentTarget.style.color = C.red)}
                                        onMouseLeave={e => (e.currentTarget.style.color = 'rgba(248,113,113,0.4)')}
                                        title="Remover ativo"
                                    >
                                        {deleting === inv.id ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Trash2 size={14} />}
                                    </button>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingRight: 24 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <div style={{ width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: `${COLORS[inv.type] ?? '#6b7280'}15`, fontSize: 16 }}>
                                                {TYPE_MAP[inv.type]?.icon ?? '📦'}
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
                                            {inv.monthlyReturn !== 0 ? fmtPct(inv.monthlyReturn) : fmtPct(retPct)}
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
                                        <span style={{ fontWeight: 600, color: positive ? C.emerald : C.red }}>
                                            {positive ? '+' : ''}{display(ret)} ({fmtPct(retPct)})
                                        </span>
                                    </div>
                                </motion.div>
                            )
                        })}
                    </AnimatePresence>
                </div>
            )}

            {/* ========== MODAL ========== */}
            <AnimatePresence>
                {showModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.6)', padding: 16 }}
                        onClick={() => { setShowModal(false); resetForm() }}>
                        <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                            onClick={e => e.stopPropagation()} style={{ ...cardHlStyle, width: '100%', maxWidth: 480, padding: 24, maxHeight: '90vh', overflowY: 'auto' }}>

                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
                                <h2 style={{ fontSize: 18, fontWeight: 700, color: C.text }}>
                                    {editingInv ? 'Editar Investimento' : 'Novo Ativo'}
                                </h2>
                                <button onClick={() => { setShowModal(false); resetForm() }} style={{ background: 'none', border: 'none', color: C.textMuted, cursor: 'pointer' }}><X size={20} /></button>
                            </div>

                            {/* Classe do Ativo */}
                            <div style={{ marginBottom: 16 }}>
                                <label style={{ display: 'block', fontSize: 13, color: C.textMuted, marginBottom: 6 }}>Classe do Ativo</label>
                                <div style={{ position: 'relative' }}>
                                    <select value={invType} onChange={e => setInvType(e.target.value)} style={selectStyle}>
                                        {Object.entries(TYPE_MAP).map(([key, meta]) => (
                                            <option key={key} value={key}>{meta.icon} {meta.label}</option>
                                        ))}
                                    </select>
                                    <ChevronDown size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: C.textMuted, pointerEvents: 'none' }} />
                                </div>
                            </div>

                            {/* Ticker + Nome */}
                            <div style={{ marginBottom: 16, display: 'flex', gap: 12 }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: 13, color: C.textMuted, marginBottom: 6 }}>Ticker</label>
                                    <input value={ticker} onChange={e => setTicker(e.target.value.toUpperCase())} placeholder="Ex: PETR4" style={inputStyle} />
                                </div>
                                <div style={{ flex: 2 }}>
                                    <label style={{ display: 'block', fontSize: 13, color: C.textMuted, marginBottom: 6 }}>Nome (opcional)</label>
                                    <input value={invName} onChange={e => setInvName(e.target.value)} placeholder="Ex: Petrobras" style={inputStyle} />
                                </div>
                            </div>

                            {/* Valor Investido */}
                            <div style={{ marginBottom: 16 }}>
                                <label style={{ display: 'block', fontSize: 13, color: C.textMuted, marginBottom: 6 }}>Valor Investido (R$)</label>
                                <input type="number" value={invAmount} onChange={e => setInvAmount(e.target.value)} placeholder="0,00" step="0.01" min="0" style={{ ...inputStyle, fontSize: 24, fontWeight: 700 }} />
                            </div>

                            {/* Valor Atual */}
                            <div style={{ marginBottom: 16 }}>
                                <label style={{ display: 'block', fontSize: 13, color: C.textMuted, marginBottom: 6 }}>Valor Atual (R$) — opcional</label>
                                <input type="number" value={invCurrent} onChange={e => setInvCurrent(e.target.value)} placeholder="Igual ao investido se vazio" step="0.01" min="0" style={inputStyle} />
                            </div>

                            {/* Retorno Mensal + Quantidade */}
                            <div style={{ marginBottom: 16, display: 'flex', gap: 12 }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: 13, color: C.textMuted, marginBottom: 6 }}>Retorno Mensal (%)</label>
                                    <input type="number" value={invMonthly} onChange={e => setInvMonthly(e.target.value)} placeholder="0,00" step="0.01" style={inputStyle} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: 13, color: C.textMuted, marginBottom: 6 }}>Quantidade (cotas)</label>
                                    <input type="number" value={invQty} onChange={e => setInvQty(e.target.value)} placeholder="0" step="0.01" style={inputStyle} />
                                </div>
                            </div>

                            {/* Notas */}
                            <div style={{ marginBottom: 24 }}>
                                <label style={{ display: 'block', fontSize: 13, color: C.textMuted, marginBottom: 6 }}>Notas (opcional)</label>
                                <input value={invNotes} onChange={e => setInvNotes(e.target.value)} placeholder="Observações sobre o ativo..." style={inputStyle} />
                            </div>

                            {/* Botões */}
                            <div style={{ display: 'flex', gap: 12 }}>
                                <button onClick={() => { setShowModal(false); resetForm() }} style={{ ...btnOutlineStyle, flex: 1, padding: '12px 0' }}>Cancelar</button>
                                <button onClick={handleSave} disabled={saving} style={{ ...btnGoldStyle, flex: 1, padding: '12px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: saving ? 0.7 : 1 }}>
                                    {saving && <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />}
                                    {saving ? 'Salvando...' : editingInv ? 'Atualizar' : 'Salvar Ativo'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    )
}
