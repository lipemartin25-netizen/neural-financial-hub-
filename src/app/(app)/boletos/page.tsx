'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { FileText, Plus, AlertTriangle, Clock, CheckCircle2, Search, Calendar, X, Trash2, Loader2, ChevronDown } from 'lucide-react'
import { useState, useMemo, useCallback } from 'react'
import { C, cardStyle, cardHlStyle, btnGoldStyle, btnOutlineStyle, inputStyle, fmt } from '@/lib/theme'
import { toast } from 'sonner'
import { useBoletos } from '@/hooks/useBoletos'
import type { Boleto } from '@/types/database'

const STATUS_CONFIG = {
    pending: { label: 'Pendente', color: C.yellow, bg: 'rgba(251,191,36,0.1)', Icon: Clock },
    paid: { label: 'Pago', color: C.emerald, bg: 'rgba(52,211,153,0.1)', Icon: CheckCircle2 },
    overdue: { label: 'Vencido', color: C.red, bg: 'rgba(248,113,113,0.1)', Icon: AlertTriangle },
    cancelled: { label: 'Cancelado', color: C.textMuted, bg: 'rgba(107,114,128,0.1)', Icon: X },
    scheduled: { label: 'Agendado', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', Icon: Calendar },
}

const TYPE_ICONS: Record<string, string> = {
    utility: '💡',
    water: '💧',
    rent: '🏢',
    tax: '📋',
    health: '💊',
    internet: '🌐',
    education: '📚',
    insurance: '🛡️',
    other: '🧾',
}

type UiBoleto = {
    id: string
    name: string
    desc: string
    amount: number
    due: string
    status: 'pending' | 'paid' | 'overdue' | 'cancelled' | 'scheduled'
    type: string
    typeIcon: string
    raw: Boleto
}

function mapToUi(b: Boleto): UiBoleto {
    return {
        id: b.id,
        name: b.beneficiary_name ?? 'Boleto',
        desc: b.notes ?? b.type ?? '',
        amount: Number(b.amount),
        due: b.due_date,
        status: b.status,
        type: b.type ?? 'other',
        typeIcon: TYPE_ICONS[b.type ?? 'other'] ?? '🧾',
        raw: b,
    }
}

export default function BoletosPage() {
    const { boletos: rawBoletos, loading, createBoleto, updateBoleto, deleteBoleto, markAsPaid } = useBoletos()

    const boletos = useMemo(() => rawBoletos.map(mapToUi), [rawBoletos])

    const [filter, setFilter] = useState<'all' | 'pending' | 'overdue' | 'paid'>('all')
    const [search, setSearch] = useState('')
    const [showModal, setShowModal] = useState(false)
    const [editingBoleto, setEditingBoleto] = useState<UiBoleto | null>(null)
    const [deleting, setDeleting] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)
    const [paying, setPaying] = useState<string | null>(null)

    // Form State
    const [bName, setBName] = useState('')
    const [bDesc, setBDesc] = useState('')
    const [bAmount, setBAmount] = useState('')
    const [bDue, setBDue] = useState(new Date().toISOString().split('T')[0])
    const [bType, setBType] = useState('other')
    const [bBarcode, setBBarcode] = useState('')

    const filtered = useMemo(() => {
        return boletos.filter(b => {
            if (filter !== 'all' && b.status !== filter) return false
            if (search && !b.name.toLowerCase().includes(search.toLowerCase()) && !b.desc.toLowerCase().includes(search.toLowerCase())) return false
            return true
        }).sort((a, b) => new Date(a.due).getTime() - new Date(b.due).getTime())
    }, [boletos, filter, search])

    const overdueItems = useMemo(() => boletos.filter(b => b.status === 'overdue'), [boletos])
    const pendingTotal = useMemo(() => boletos.filter(b => b.status === 'pending').reduce((s, b) => s + b.amount, 0), [boletos])

    const daysUntil = (date: string) => {
        const d = Math.ceil((new Date(date).getTime() - Date.now()) / 86400000)
        if (d === 0) return 'Hoje'
        if (d < 0) return `${Math.abs(d)}d atrás`
        return `${d}d`
    }

    const resetForm = useCallback(() => {
        setBName('')
        setBDesc('')
        setBAmount('')
        setBDue(new Date().toISOString().split('T')[0])
        setBType('other')
        setBBarcode('')
        setEditingBoleto(null)
    }, [])

    const openCreate = useCallback(() => {
        resetForm()
        setShowModal(true)
    }, [resetForm])

    const openEdit = useCallback((b: UiBoleto) => {
        setEditingBoleto(b)
        setBName(b.name)
        setBDesc(b.desc)
        setBAmount(String(b.amount))
        setBDue(b.due)
        setBType(b.type)
        setBBarcode(b.raw.barcode ?? '')
        setShowModal(true)
    }, [])

    const handleMarkAsPaid = async (id: string) => {
        setPaying(id)
        const { error } = await markAsPaid(id)
        setPaying(null)

        if (error) {
            toast.error(error, { style: { background: C.card, color: C.red, border: `1px solid rgba(248,113,113,0.3)` } })
        } else {
            toast.success('Boleto marcado como pago!', {
                style: { background: C.card, color: C.text, border: `1px solid ${C.border}` }
            })
        }
    }

    const handleDelete = async (id: string) => {
        setDeleting(id)
        const { error } = await deleteBoleto(id)
        setDeleting(null)

        if (error) {
            toast.error(error, { style: { background: C.card, color: C.red, border: `1px solid rgba(248,113,113,0.3)` } })
        } else {
            toast.success('Boleto excluído', {
                style: { background: C.card, color: C.text, border: `1px solid ${C.border}` }
            })
        }
    }

    const handleSave = async () => {
        if (!bName || !bAmount) {
            toast.error('Preencha o nome e o valor')
            return
        }

        setSaving(true)

        if (editingBoleto) {
            // ========== EDITAR ==========
            const { error } = await updateBoleto(editingBoleto.id, {
                beneficiary_name: bName,
                amount: parseFloat(bAmount),
                due_date: bDue,
                type: bType,
                notes: bDesc || null,
                barcode: bBarcode || null,
            })

            setSaving(false)
            if (error) {
                toast.error(error, { style: { background: C.card, color: C.red, border: `1px solid rgba(248,113,113,0.3)` } })
            } else {
                setShowModal(false)
                resetForm()
                toast.success('Boleto atualizado!', {
                    style: { background: C.card, color: C.text, border: `1px solid ${C.border}` }
                })
            }
        } else {
            // ========== CRIAR ==========
            const { error } = await createBoleto({
                beneficiary_name: bName,
                amount: parseFloat(bAmount),
                due_date: bDue,
                type: bType,
                notes: bDesc || null,
                barcode: bBarcode || null,
            })

            setSaving(false)
            if (error) {
                toast.error(error, { style: { background: C.card, color: C.red, border: `1px solid rgba(248,113,113,0.3)` } })
            } else {
                setShowModal(false)
                resetForm()
                toast.success('Boleto adicionado com sucesso!', {
                    style: { background: C.card, color: C.text, border: `1px solid ${C.border}` }
                })
            }
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
                    <h1 style={{ fontSize: 24, fontWeight: 700, color: C.text }}>Contas a Pagar</h1>
                    <p style={{ fontSize: 14, color: C.textMuted, marginTop: 4 }}>
                        {loading ? 'Carregando...' : `${boletos.length} boletos · ${fmt(pendingTotal)} pendente`}
                    </p>
                </div>
                <button onClick={openCreate} style={btnGoldStyle}><Plus size={16} /> Novo Boleto</button>
            </div>

            {/* Alerta de Vencidos */}
            <AnimatePresence>
                {!loading && overdueItems.length > 0 && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                        style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 16, borderRadius: 16, border: '1px solid rgba(248,113,113,0.2)', backgroundColor: 'rgba(248,113,113,0.05)', marginBottom: 24, overflow: 'hidden' }}>
                        <AlertTriangle size={24} style={{ color: C.red, flexShrink: 0 }} />
                        <div>
                            <p style={{ fontWeight: 600, color: C.red }}>{overdueItems.length} boleto(s) vencido(s)</p>
                            <p style={{ fontSize: 13, color: 'rgba(248,113,113,0.6)' }}>Total: {fmt(overdueItems.reduce((s, b) => s + b.amount, 0))}</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Search + Filter */}
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

            {/* Loading */}
            {loading && (
                <div style={{ ...cardStyle, padding: 64, textAlign: 'center' }}>
                    <Loader2 size={32} style={{ color: C.gold, margin: '0 auto 16px', animation: 'spin 1s linear infinite' }} />
                    <p style={{ fontSize: 14, color: C.textMuted }}>Carregando boletos...</p>
                </div>
            )}

            {/* List */}
            {!loading && (
                <AnimatePresence>
                    {filtered.map((b, i) => {
                        const st = STATUS_CONFIG[b.status] ?? STATUS_CONFIG.pending
                        return (
                            <motion.div key={b.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: i * 0.05 }}
                                style={{ ...cardStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 20, marginBottom: 8, overflow: 'hidden', cursor: 'pointer' }}>

                                {/* Left: Info */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }} onClick={() => openEdit(b)}>
                                    <div style={{ width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: st.bg }}>
                                        <st.Icon size={18} style={{ color: st.color }} />
                                    </div>
                                    <div>
                                        <p style={{ fontSize: 14, fontWeight: 500, color: b.status === 'paid' ? C.textMuted : C.text, textDecoration: b.status === 'paid' ? 'line-through' : 'none' }}>{b.name}</p>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                                            <span style={{ fontSize: 12, color: C.textMuted }}>{b.typeIcon} {b.desc}</span>
                                            <span style={{ fontSize: 12, color: C.textMuted }}>·</span>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: C.textMuted }}>
                                                <Calendar size={10} />
                                                {new Date(b.due + 'T12:00:00').toLocaleDateString('pt-BR')}
                                                <span style={{ fontWeight: 500, color: b.status === 'overdue' ? C.red : b.status === 'pending' ? C.yellow : C.textMuted }}>
                                                    ({daysUntil(b.due)})
                                                </span>
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Right: Amount + Actions */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <p style={{
                                        fontSize: 16, fontWeight: 700,
                                        color: b.status === 'paid' ? C.textMuted : b.status === 'overdue' ? C.red : C.text,
                                        textDecoration: b.status === 'paid' ? 'line-through' : 'none',
                                    }}>{fmt(b.amount)}</p>

                                    {b.status !== 'paid' && b.status !== 'cancelled' && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleMarkAsPaid(b.id) }}
                                            disabled={paying === b.id}
                                            style={{ padding: '6px 12px', borderRadius: 8, border: 'none', backgroundColor: 'rgba(52,211,153,0.1)', color: C.emerald, fontSize: 12, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                            {paying === b.id ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : 'Paguei ✓'}
                                        </button>
                                    )}

                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleDelete(b.id) }}
                                        disabled={deleting === b.id}
                                        style={{
                                            background: 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 8,
                                            color: 'rgba(248,113,113,0.4)', transition: 'color 0.2s',
                                        }}
                                        onMouseEnter={e => (e.currentTarget.style.color = C.red)}
                                        onMouseLeave={e => (e.currentTarget.style.color = 'rgba(248,113,113,0.4)')}
                                        title="Excluir boleto"
                                    >
                                        {deleting === b.id ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Trash2 size={14} />}
                                    </button>
                                </div>
                            </motion.div>
                        )
                    })}
                </AnimatePresence>
            )}

            {/* Empty */}
            {!loading && filtered.length === 0 && (
                <div style={{ ...cardStyle, padding: 64, textAlign: 'center' }}>
                    <FileText size={40} style={{ color: 'rgba(107,114,128,0.3)', margin: '0 auto 16px' }} />
                    <p style={{ fontSize: 18, fontWeight: 500, color: C.textMuted }}>
                        {boletos.length === 0 ? 'Nenhum boleto cadastrado' : 'Nenhum boleto encontrado'}
                    </p>
                    {boletos.length === 0 && (
                        <p style={{ fontSize: 13, color: 'rgba(107,114,128,0.5)', marginTop: 8 }}>
                            Clique em &quot;Novo Boleto&quot; para começar
                        </p>
                    )}
                </div>
            )}

            {/* ========== MODAL (Create / Edit) ========== */}
            <AnimatePresence>
                {showModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.6)', padding: 16 }}
                        onClick={() => { setShowModal(false); resetForm() }}>
                        <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                            onClick={e => e.stopPropagation()} style={{ ...cardHlStyle, width: '100%', maxWidth: 480, padding: 24, maxHeight: '90vh', overflowY: 'auto' }}>

                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
                                <h2 style={{ fontSize: 18, fontWeight: 700, color: C.text }}>
                                    {editingBoleto ? 'Editar Boleto' : 'Novo Boleto'}
                                </h2>
                                <button onClick={() => { setShowModal(false); resetForm() }} style={{ background: 'none', border: 'none', color: C.textMuted, cursor: 'pointer' }}><X size={20} /></button>
                            </div>

                            {/* Nome */}
                            <div style={{ marginBottom: 16 }}>
                                <label style={{ display: 'block', fontSize: 13, color: C.textMuted, marginBottom: 6 }}>Nome / Empresa</label>
                                <input value={bName} onChange={e => setBName(e.target.value)} placeholder="Ex: CPFL, Sabesp, Escola..." style={inputStyle} />
                            </div>

                            {/* Valor */}
                            <div style={{ marginBottom: 16 }}>
                                <label style={{ display: 'block', fontSize: 13, color: C.textMuted, marginBottom: 6 }}>Valor (R$)</label>
                                <input type="number" value={bAmount} onChange={e => setBAmount(e.target.value)} placeholder="0,00" step="0.01" min="0" style={{ ...inputStyle, fontSize: 24, fontWeight: 700 }} />
                            </div>

                            {/* Vencimento + Tipo */}
                            <div style={{ marginBottom: 16, display: 'flex', gap: 12 }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: 13, color: C.textMuted, marginBottom: 6 }}>Vencimento</label>
                                    <input type="date" value={bDue} onChange={e => setBDue(e.target.value)} style={inputStyle} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: 13, color: C.textMuted, marginBottom: 6 }}>Tipo</label>
                                    <div style={{ position: 'relative' }}>
                                        <select value={bType} onChange={e => setBType(e.target.value)} style={selectStyle}>
                                            <option value="utility">💡 Energia</option>
                                            <option value="water">💧 Água</option>
                                            <option value="rent">🏢 Aluguel/Condomínio</option>
                                            <option value="tax">📋 Imposto/Taxa</option>
                                            <option value="health">💊 Saúde</option>
                                            <option value="internet">🌐 Internet/Telecom</option>
                                            <option value="education">📚 Educação</option>
                                            <option value="insurance">🛡️ Seguro</option>
                                            <option value="other">🧾 Outros</option>
                                        </select>
                                        <ChevronDown size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: C.textMuted, pointerEvents: 'none' }} />
                                    </div>
                                </div>
                            </div>

                            {/* Descrição / Notas */}
                            <div style={{ marginBottom: 16 }}>
                                <label style={{ display: 'block', fontSize: 13, color: C.textMuted, marginBottom: 6 }}>Descrição (opcional)</label>
                                <input value={bDesc} onChange={e => setBDesc(e.target.value)} placeholder="Ex: Conta de luz março, 3ª parcela..." style={inputStyle} />
                            </div>

                            {/* Código de Barras */}
                            <div style={{ marginBottom: 16 }}>
                                <label style={{ display: 'block', fontSize: 13, color: C.textMuted, marginBottom: 6 }}>Código de Barras (opcional)</label>
                                <input value={bBarcode} onChange={e => setBBarcode(e.target.value)} placeholder="Cole o código de barras aqui..." style={{ ...inputStyle, fontSize: 12, fontFamily: 'monospace' }} />
                            </div>

                            {/* Botões */}
                            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                                <button onClick={() => { setShowModal(false); resetForm() }} style={{ ...btnOutlineStyle, flex: 1, padding: '12px 0' }}>Cancelar</button>
                                <button onClick={handleSave} disabled={saving} style={{ ...btnGoldStyle, flex: 1, padding: '12px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: saving ? 0.7 : 1 }}>
                                    {saving && <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />}
                                    {saving ? 'Salvando...' : editingBoleto ? 'Atualizar' : 'Salvar Boleto'}
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
