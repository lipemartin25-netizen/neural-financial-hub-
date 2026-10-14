'use client'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Search, Plus, AlertTriangle, Clock, CheckCircle2, Calendar, X,
    Trash2, Loader2, ChevronDown, Download
} from 'lucide-react'
import { useState, useMemo, useCallback, useEffect } from 'react'
import { C, cardStyle, cardHlStyle, btnGoldStyle, btnOutlineStyle, inputStyle, fmt, NAV_SAFE_AREA } from '@/lib/theme'
import { toast } from 'sonner'
import { useFinanceStore } from '@/hooks/useFinanceStore'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { SkeletonBoletoGrid } from '@/components/SkeletonCard'
import { daysUntil } from '@/lib/utils'
import type { Boleto } from '@/types/database'
import { downloadCSV } from '@/lib/export'

/* ── Config ── */
const STATUS_CONFIG = {
    pending: { label: 'Pendente', color: C.yellow, bg: 'rgba(251,191,36,0.1)', Icon: Clock },
    paid: { label: 'Pago', color: C.emerald, bg: 'rgba(52,211,153,0.1)', Icon: CheckCircle2 },
    overdue: { label: 'Vencido', color: C.red, bg: 'rgba(248,113,113,0.1)', Icon: AlertTriangle },
    cancelled: { label: 'Cancelado', color: C.textMuted, bg: 'rgba(107,114,128,0.1)', Icon: X },
    scheduled: { label: 'Agendado', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', Icon: Calendar },
}

const TYPE_OPTIONS = [
    { value: 'utility', icon: '💡', label: 'Energia' },
    { value: 'water', icon: '💧', label: 'Água' },
    { value: 'rent', icon: '🏢', label: 'Aluguel' },
    { value: 'tax', icon: '📋', label: 'Impostos' },
    { value: 'health', icon: '💊', label: 'Saúde' },
    { value: 'internet', icon: '🌐', label: 'Internet' },
    { value: 'education', icon: '📚', label: 'Educação' },
    { value: 'insurance', icon: '🛡️', label: 'Seguro' },
    { value: 'other', icon: '🧾', label: 'Outros' },
]

const TYPE_ICONS: Record<string, string> = Object.fromEntries(
    TYPE_OPTIONS.map(t => [t.value, t.icon])
)

/* ── Types ── */
type UiBoleto = {
    id: string; name: string; desc: string; amount: number; due: string
    status: 'pending' | 'paid' | 'overdue' | 'cancelled' | 'scheduled'
    type: string; typeIcon: string; raw: Boleto
}

function mapToUi(b: Boleto): UiBoleto {
    return {
        id: b.id,
        name: b.beneficiary_name ?? 'Boleto',
        desc: b.notes ?? b.type ?? '',
        amount: Number(b.amount),
        due: b.due_date,
        status: b.status as UiBoleto['status'],
        type: b.type ?? 'other',
        typeIcon: TYPE_ICONS[b.type ?? 'other'] ?? '🧾',
        raw: b,
    }
}

function BoletosContent() {
    const {
        boletos: rawBoletos, accounts, loading,
        fetchBoletos, fetchAccounts,
        addBoleto, updateBoleto, deleteBoleto, markAsPaid
    } = useFinanceStore()

    useEffect(() => {
        fetchBoletos()
        fetchAccounts()
    }, [fetchBoletos, fetchAccounts])

    const boletos = useMemo(() => rawBoletos.map(mapToUi), [rawBoletos])
    const [filter, setFilter] = useState<'all' | 'pending' | 'overdue' | 'paid'>('all')
    const [search, setSearch] = useState('')
    const [showModal, setShowModal] = useState(false)
    const [showPayModal, setShowPayModal] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
    const [payBoleto, setPayBoleto] = useState<UiBoleto | null>(null)
    const [selectedPayAccount, setSelectedPayAccount] = useState('')
    const [editingBoleto, setEditingBoleto] = useState<UiBoleto | null>(null)
    const [deleting, setDeleting] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)
    const [paying, setPaying] = useState<string | null>(null)

    /* ── Form ── */
    const [bName, setBName] = useState('')
    const [bDesc, setBDesc] = useState('')
    const [bAmount, setBAmount] = useState('')
    const [bDue, setBDue] = useState(new Date().toISOString().split('T')[0])
    const [bType, setBType] = useState('other')
    const [bBarcode, setBBarcode] = useState('')

    /* ── Derived data ── */
    const filtered = useMemo(() => {
        return boletos.filter(b => {
            if (filter !== 'all' && b.status !== filter) return false
            if (search && !b.name.toLowerCase().includes(search.toLowerCase()) && !b.desc.toLowerCase().includes(search.toLowerCase())) return false
            return true
        }).sort((a, b) => new Date(a.due + 'T12:00:00').getTime() - new Date(b.due + 'T12:00:00').getTime())
    }, [boletos, filter, search])

    const overdueItems = useMemo(() => boletos.filter(b => b.status === 'overdue'), [boletos])
    const pendingTotal = useMemo(() => boletos.filter(b => b.status === 'pending').reduce((s, b) => s + b.amount, 0), [boletos])

    /* ── Handlers ── */
    const resetForm = useCallback(() => {
        setBName(''); setBDesc(''); setBAmount('')
        setBDue(new Date().toISOString().split('T')[0])
        setBType('other'); setBBarcode(''); setEditingBoleto(null)
    }, [])

    const openCreate = () => { resetForm(); setShowModal(true) }

    const openEdit = (b: UiBoleto) => {
        setEditingBoleto(b); setBName(b.name); setBDesc(b.desc)
        setBAmount(String(b.amount)); setBDue(b.due); setBType(b.type)
        setBBarcode(b.raw.barcode || ''); setShowModal(true)
    }

    const handleSave = async () => {
        if (!bName || !bAmount) { toast.error('Preencha o nome e o valor'); return }
        setSaving(true)
        const payload = {
            beneficiary_name: bName,
            amount: parseFloat(bAmount),
            due_date: bDue,
            type: bType,
            notes: bDesc || null,
            barcode: bBarcode || null
        }
        const result = editingBoleto
            ? await updateBoleto(editingBoleto.id, payload)
            : await addBoleto(payload)
        setSaving(false)
        if (result.error) {
            toast.error(result.error)
        } else {
            setShowModal(false)
            resetForm()
            toast.success(editingBoleto ? 'Boleto atualizado!' : 'Boleto cadastrado!')
        }
    }

    const handleDelete = async (id: string) => {
        setDeleting(id)
        const { error } = await deleteBoleto(id)
        setDeleting(null)
        setShowDeleteConfirm(null)
        if (error) toast.error(error)
        else toast.success('Boleto excluído!')
    }

    const handleMarkAsPaidSubmit = async (id: string, accountId: string) => {
        setPaying(id)
        const { error } = await markAsPaid(id, accountId)
        setPaying(null)
        if (error) toast.error(error)
        else { toast.success('Boleto pago e transação gerada!'); setShowPayModal(false) }
    }

    const handleExportCSV = () => {
        const headers = ['Vencimento', 'Beneficiário', 'Valor', 'Status', 'Tipo']
        const rows = filtered.map(b => [
            new Date(b.due + 'T12:00:00').toLocaleDateString('pt-BR'),
            b.name, fmt(b.amount), b.status, b.type
        ])
        downloadCSV('neuralfinance_boletos', headers, rows)
        toast.success('CSV exportado!')
    }

    /* ── Compact tokens ── */
    const compactCard: React.CSSProperties = { ...cardStyle, borderRadius: 12 }
    const compactBtn: React.CSSProperties = { ...btnGoldStyle, padding: '8px 16px', fontSize: 13 }
    const compactBtnOut: React.CSSProperties = { ...btnOutlineStyle, padding: '8px 16px', fontSize: 13 }
    const compactInput: React.CSSProperties = { ...inputStyle, padding: '10px 14px', fontSize: 13 }
    const selectStyle: React.CSSProperties = { ...compactInput, appearance: 'none', WebkitAppearance: 'none', backgroundImage: 'none', cursor: 'pointer' }

    return (
        <div style={{ paddingBottom: NAV_SAFE_AREA }}>
            {/* ── Header ── */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <h1 style={{ fontSize: 20, fontWeight: 700, color: C.text }}>Boletos e Contas</h1>
                    <p style={{ fontSize: 13, color: C.textMuted, marginTop: 2 }}>
                        {loading ? 'Carregando...' : `${boletos.length} boletos · ${fmt(pendingTotal)} pendente`}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={handleExportCSV} style={compactBtnOut} aria-label="Exportar CSV">
                        <Download size={14} /> CSV
                    </button>
                    <button onClick={openCreate} style={compactBtn} aria-label="Novo boleto">
                        <Plus size={14} /> Novo
                    </button>
                </div>
            </div>

            {/* ── Alerta de Vencidos ── */}
            {overdueItems.length > 0 && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                    style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: `1px solid ${C.red}33`, padding: '10px 14px', borderRadius: 10, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}
                    role="alert"
                    aria-live="polite"
                >
                    <AlertTriangle style={{ color: C.red, flexShrink: 0 }} size={16} />
                    <span style={{ color: C.red, fontSize: 13, fontWeight: 500 }}>
                        {overdueItems.length} {overdueItems.length === 1 ? 'boleto está' : 'boletos estão'} vencidos.
                    </span>
                </motion.div>
            )}

            {/* ── Filtros ── */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: 320, minWidth: 0 }}>
                    <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: C.textMuted, zIndex: 1 }} />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Pesquisar..."
                        aria-label="Pesquisar boletos"
                        style={{ ...compactInput, paddingLeft: 36, width: '100%', boxSizing: 'border-box' }}
                    />
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {(['all', 'pending', 'overdue', 'paid'] as const).map(f => (
                        <button key={f} onClick={() => setFilter(f)}
                            style={{ ...(filter === f ? compactBtn : compactBtnOut), whiteSpace: 'nowrap' }}
                            aria-label={`Filtrar: ${f === 'all' ? 'Todos' : f === 'pending' ? 'Pendentes' : f === 'overdue' ? 'Vencidos' : 'Pagos'}`}
                            aria-pressed={filter === f}
                        >
                            {f === 'all' ? 'Todos' : f === 'pending' ? 'Pendentes' : f === 'overdue' ? 'Vencidos' : 'Pagos'}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── List (Skeleton, Empty ou Real) ── */}
            {loading ? (
                <SkeletonBoletoGrid count={4} />
            ) : filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 16px' }} aria-live="polite">
                    <p style={{ fontSize: 40, marginBottom: 12 }}>📭</p>
                    <p style={{ color: C.textMuted, fontSize: 14, marginBottom: 16 }}>Nenhum boleto encontrado</p>
                    <button onClick={openCreate} style={compactBtn}><Plus size={14} /> Cadastrar primeiro</button>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }} aria-live="polite">
                    {filtered.map(b => {
                        const ST = STATUS_CONFIG[b.status] || STATUS_CONFIG.pending
                        return (
                            <motion.div layout key={b.id} style={{ ...compactCard, padding: '12px 14px', cursor: 'pointer' }} onClick={() => openEdit(b)}>
                                {/* Top */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                                    <div style={{ display: 'flex', gap: 10, minWidth: 0, flex: 1 }}>
                                        <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: C.secondary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                                            {b.typeIcon}
                                        </div>
                                        <div style={{ minWidth: 0 }}>
                                            <h3 style={{ fontSize: 13, fontWeight: 600, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.name}</h3>
                                            <p style={{ fontSize: 11, color: C.textMuted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.desc}</p>
                                        </div>
                                    </div>
                                    <div style={{ backgroundColor: ST.bg, color: ST.color, padding: '3px 7px', borderRadius: 6, fontSize: 10, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0, marginLeft: 8 }}>
                                        <ST.Icon size={10} /> {ST.label}
                                    </div>
                                </div>
                                {/* Bottom */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <p style={{ fontSize: 16, fontWeight: 700, color: C.text, lineHeight: 1.2 }}>{fmt(b.amount)}</p>
                                        <p style={{ fontSize: 11, color: b.status === 'overdue' ? C.red : C.textMuted, display: 'flex', alignItems: 'center', gap: 3, marginTop: 2 }}>
                                            <Calendar size={10} /> {daysUntil(b.due)} ({new Date(b.due + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })})
                                        </p>
                                    </div>
                                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                        {/* Delete */}
                                        {b.status !== 'paid' && (
                                            <button
                                                onClick={e => { e.stopPropagation(); setShowDeleteConfirm(b.id) }}
                                                aria-label={`Excluir boleto ${b.name}`}
                                                style={{ padding: '6px 8px', borderRadius: 7, border: 'none', backgroundColor: 'rgba(248,113,113,0.1)', color: C.red, fontSize: 12, cursor: 'pointer', opacity: 0.6, transition: 'opacity 0.2s' }}
                                                onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                                                onMouseLeave={e => (e.currentTarget.style.opacity = '0.6')}
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        )}
                                        {/* Pay */}
                                        {b.status !== 'paid' && b.status !== 'cancelled' && (
                                            <button
                                                onClick={e => {
                                                    e.stopPropagation()
                                                    setPayBoleto(b); setSelectedPayAccount(accounts[0]?.id || ''); setShowPayModal(true)
                                                }}
                                                disabled={paying === b.id}
                                                aria-label={`Pagar boleto ${b.name}`}
                                                style={{ padding: '6px 12px', borderRadius: 7, border: 'none', backgroundColor: 'rgba(52,211,153,0.1)', color: C.emerald, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                                            >
                                                {paying === b.id
                                                    ? <Loader2 size={12} className="animate-spin" />
                                                    : 'Pagar ✔'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )
                    })}
                </div>
            )}

            {/* ── Delete Confirmation Modal ── */}
            <AnimatePresence>
                {showDeleteConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ position: 'fixed', inset: 0, zIndex: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', padding: 16 }}
                        onClick={() => setShowDeleteConfirm(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
                            onClick={e => e.stopPropagation()}
                            style={{ ...cardHlStyle, width: '100%', maxWidth: 340, padding: 20, textAlign: 'center' }}
                            role="alertdialog"
                            aria-labelledby="delete-boleto-title"
                            aria-describedby="delete-boleto-desc"
                        >
                            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(248,113,113,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                                <Trash2 size={22} style={{ color: C.red }} />
                            </div>
                            <h3 id="delete-boleto-title" style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 8 }}>Excluir boleto?</h3>
                            <p id="delete-boleto-desc" style={{ color: C.textMuted, fontSize: 13, marginBottom: 20 }}>Esta ação não pode ser desfeita.</p>
                            <div style={{ display: 'flex', gap: 10 }}>
                                <button onClick={() => setShowDeleteConfirm(null)} style={{ ...compactBtnOut, flex: 1 }}>Cancelar</button>
                                <button
                                    onClick={() => handleDelete(showDeleteConfirm)}
                                    disabled={deleting === showDeleteConfirm}
                                    style={{ ...compactBtn, flex: 1, background: C.red, border: 'none', opacity: deleting ? 0.6 : 1 }}
                                >
                                    {deleting === showDeleteConfirm
                                        ? <Loader2 size={14} className="animate-spin" />
                                        : 'Excluir'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Create/Edit Modal ── */}
            <AnimatePresence>
                {showModal && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.6)', padding: 16 }}
                        onClick={() => { setShowModal(false); resetForm() }}
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                            onClick={e => e.stopPropagation()}
                            style={{ ...cardHlStyle, width: '100%', maxWidth: 420, padding: 20, maxHeight: '90vh', overflowY: 'auto' }}
                            role="dialog"
                            aria-labelledby="boleto-modal-title"
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                                <h2 id="boleto-modal-title" style={{ fontSize: 16, fontWeight: 700, color: C.text }}>
                                    {editingBoleto ? 'Editar Boleto' : 'Novo Boleto'}
                                </h2>
                                <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: C.textMuted, cursor: 'pointer' }} aria-label="Fechar modal">
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Nome */}
                            <div style={{ marginBottom: 12 }}>
                                <label style={{ display: 'block', fontSize: 11, color: C.textMuted, marginBottom: 4 }}>Nome / Empresa *</label>
                                <input value={bName} onChange={e => setBName(e.target.value)} placeholder="Ex: CPFL, Sabesp..." style={compactInput} />
                            </div>

                            {/* Valor */}
                            <div style={{ marginBottom: 12 }}>
                                <label style={{ display: 'block', fontSize: 11, color: C.textMuted, marginBottom: 4 }}>Valor (R$) *</label>
                                <input type="number" step="0.01" min="0" value={bAmount} onChange={e => setBAmount(e.target.value)} placeholder="0,00" style={{ ...compactInput, fontSize: 20, fontWeight: 700 }} />
                            </div>

                            {/* Vencimento + Tipo */}
                            <div style={{ marginBottom: 12, display: 'flex', gap: 10 }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: 11, color: C.textMuted, marginBottom: 4 }}>Vencimento</label>
                                    <input type="date" value={bDue} onChange={e => setBDue(e.target.value)} style={compactInput} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: 11, color: C.textMuted, marginBottom: 4 }}>Tipo</label>
                                    <div style={{ position: 'relative' }}>
                                        <select value={bType} onChange={e => setBType(e.target.value)} style={selectStyle}>
                                            {TYPE_OPTIONS.map(t => (
                                                <option key={t.value} value={t.value}>{t.icon} {t.label}</option>
                                            ))}
                                        </select>
                                        <ChevronDown size={12} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: C.textMuted }} />
                                    </div>
                                </div>
                            </div>

                            {/* Observações */}
                            <div style={{ marginBottom: 12 }}>
                                <label style={{ display: 'block', fontSize: 11, color: C.textMuted, marginBottom: 4 }}>Observações</label>
                                <input value={bDesc} onChange={e => setBDesc(e.target.value)} placeholder="Opcional..." style={compactInput} />
                            </div>

                            {/* Código de Barras */}
                            <div style={{ marginBottom: 12 }}>
                                <label style={{ display: 'block', fontSize: 11, color: C.textMuted, marginBottom: 4 }}>Código de Barras (opcional)</label>
                                <input value={bBarcode} onChange={e => setBBarcode(e.target.value)} style={{ ...compactInput, fontFamily: 'monospace' }} />
                            </div>

                            {/* Actions */}
                            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                                <button onClick={() => setShowModal(false)} style={{ ...compactBtnOut, flex: 1 }}>Cancelar</button>
                                <button onClick={handleSave} disabled={saving} style={{ ...compactBtn, flex: 1, opacity: saving ? 0.6 : 1 }}>
                                    {saving
                                        ? <Loader2 size={14} className="animate-spin" />
                                        : editingBoleto ? 'Atualizar' : 'Salvar'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Pay Modal ── */}
            <AnimatePresence>
                {showPayModal && payBoleto && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ position: 'fixed', inset: 0, zIndex: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.7)', padding: 16 }}
                        onClick={() => setShowPayModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
                            onClick={e => e.stopPropagation()}
                            style={{ ...cardHlStyle, width: '100%', maxWidth: 380, padding: 20 }}
                            role="dialog"
                            aria-labelledby="pay-modal-title"
                        >
                            <h2 id="pay-modal-title" style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 16 }}>Confirmar Pagamento</h2>
                            <p style={{ color: C.textMuted, marginBottom: 12, fontSize: 13 }}>
                                Pagar <b style={{ color: C.text }}>{payBoleto.name}</b> de <b style={{ color: C.text }}>{fmt(payBoleto.amount)}</b> usando:
                            </p>
                            <div style={{ position: 'relative', marginBottom: 20 }}>
                                <select value={selectedPayAccount} onChange={e => setSelectedPayAccount(e.target.value)} style={selectStyle}>
                                    {accounts.map(acc => (
                                        <option key={acc.id} value={acc.id}>{acc.name} ({fmt(acc.balance)})</option>
                                    ))}
                                </select>
                                <ChevronDown size={12} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: C.textMuted }} />
                            </div>
                            <button
                                onClick={() => handleMarkAsPaidSubmit(payBoleto.id, selectedPayAccount)}
                                disabled={paying === payBoleto.id}
                                style={{ ...compactBtn, width: '100%', opacity: paying ? 0.6 : 1 }}
                            >
                                {paying === payBoleto.id
                                    ? <Loader2 size={14} className="animate-spin" />
                                    : 'Confirmar Pagamento ✔'}
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

/* ── Page export with ErrorBoundary ── */
export default function BoletosPage() {
    return (
        <ErrorBoundary fallbackTitle="Erro nos Boletos" fallbackDescription="Não foi possível carregar seus boletos. Tente novamente.">
            <BoletosContent />
        </ErrorBoundary>
    )
}
