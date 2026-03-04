'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { CreditCard, Plus, Eye, EyeOff, Calendar, AlertTriangle, X, Trash2, Loader2, Edit3 } from 'lucide-react'
import { useState, useCallback, useMemo } from 'react'
import { C, cardStyle, cardHlStyle, btnGoldStyle, btnOutlineStyle, inputStyle, fmt } from '@/lib/theme'
import { toast } from 'sonner'
import { useCards } from '@/hooks/useCards'
import type { CardData } from '@/hooks/useCards'
import { CATEGORIES } from '@/lib/constants'

const CAT_MAP = Object.fromEntries(CATEGORIES.map(c => [c.id, c]))

// Gradientes premium por cor
const GRADIENTS: Record<string, string> = {
    '#7c3aed': 'linear-gradient(135deg, #7c3aed, #581c87)',
    '#f97316': 'linear-gradient(135deg, #f97316, #c2410c)',
    '#1d4ed8': 'linear-gradient(135deg, #1d4ed8, #1e3a5f)',
    '#10b981': 'linear-gradient(135deg, #10b981, #065f46)',
    '#ec4899': 'linear-gradient(135deg, #ec4899, #9d174d)',
    '#ef4444': 'linear-gradient(135deg, #ef4444, #991b1b)',
    '#f59e0b': 'linear-gradient(135deg, #f59e0b, #92400e)',
    '#06b6d4': 'linear-gradient(135deg, #06b6d4, #155e75)',
    '#8b5cf6': 'linear-gradient(135deg, #8b5cf6, #4c1d95)',
    '#000000': 'linear-gradient(135deg, #1a1a2e, #0f0f1a)',
}

const COLOR_OPTIONS = [
    { value: '#7c3aed', label: 'Roxo' },
    { value: '#1d4ed8', label: 'Azul' },
    { value: '#10b981', label: 'Verde' },
    { value: '#f97316', label: 'Laranja' },
    { value: '#ec4899', label: 'Rosa' },
    { value: '#ef4444', label: 'Vermelho' },
    { value: '#f59e0b', label: 'Amarelo' },
    { value: '#06b6d4', label: 'Ciano' },
    { value: '#8b5cf6', label: 'Violeta' },
    { value: '#000000', label: 'Dark' },
]

function getGradient(color: string): string {
    return GRADIENTS[color] ?? `linear-gradient(135deg, ${color}, ${color}dd)`
}

function formatInvoiceDate(dateStr: string): string {
    const date = new Date(dateStr + 'T12:00:00')
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

export default function CardsPage() {
    const { cards, loading, createCard, updateCard, deleteCard } = useCards()

    const [showValues, setShowValues] = useState(true)
    const [selected, setSelected] = useState<string | null>(null)
    const [showModal, setShowModal] = useState(false)
    const [editingCard, setEditingCard] = useState<CardData | null>(null)
    const [saving, setSaving] = useState(false)
    const [deleting, setDeleting] = useState<string | null>(null)

    // Form
    const [cName, setCName] = useState('')
    const [cBank, setCBank] = useState('')
    const [cLast4, setCLast4] = useState('')
    const [cLimit, setCLimit] = useState('')
    const [cClosing, setCClosing] = useState('')
    const [cDue, setCDue] = useState('')
    const [cColor, setCColor] = useState('#7c3aed')

    // Auto-selecionar o primeiro cartão
    const selectedId = selected ?? (cards.length > 0 ? cards[0].id : null)
    const card = useMemo(() => cards.find(c => c.id === selectedId) ?? null, [cards, selectedId])
    const utilization = card && card.limit > 0 ? (card.used / card.limit) * 100 : 0

    const display = (v: number) => showValues ? fmt(v) : '•••••'

    const resetForm = useCallback(() => {
        setCName('')
        setCBank('')
        setCLast4('')
        setCLimit('')
        setCClosing('')
        setCDue('')
        setCColor('#7c3aed')
        setEditingCard(null)
    }, [])

    const openCreate = useCallback(() => {
        resetForm()
        setShowModal(true)
    }, [resetForm])

    const openEdit = useCallback((c: CardData) => {
        setEditingCard(c)
        setCName(c.name)
        setCBank(c.bank_name ?? '')
        setCLast4(c.last4 !== '••••' ? c.last4 : '')
        setCLimit(String(c.limit))
        setCClosing(String(c.closing_day))
        setCDue(String(c.due_day))
        setCColor(c.color || '#7c3aed')
        setShowModal(true)
    }, [])

    const handleSave = async () => {
        if (!cName || !cLimit) {
            toast.error('Preencha o nome e limite do cartão')
            return
        }

        setSaving(true)

        if (editingCard) {
            const { error } = await updateCard(editingCard.id, {
                name: cName,
                bank_name: cBank || undefined,
                last4: cLast4 || undefined,
                credit_limit: cLimit,
                closing_day: cClosing || undefined,
                due_day: cDue || undefined,
                color: cColor,
            })

            setSaving(false)
            if (error) {
                toast.error(error, { style: { background: C.card, color: C.red, border: `1px solid rgba(248,113,113,0.3)` } })
            } else {
                setShowModal(false)
                resetForm()
                toast.success('Cartão atualizado!', { style: { background: C.card, color: C.text, border: `1px solid ${C.border}` } })
            }
        } else {
            const { error } = await createCard({
                name: cName,
                bank_name: cBank || undefined,
                last4: cLast4 || undefined,
                credit_limit: cLimit,
                closing_day: cClosing || undefined,
                due_day: cDue || undefined,
                color: cColor,
            })

            setSaving(false)
            if (error) {
                toast.error(error, { style: { background: C.card, color: C.red, border: `1px solid rgba(248,113,113,0.3)` } })
            } else {
                setShowModal(false)
                resetForm()
                toast.success('Cartão adicionado!', { style: { background: C.card, color: C.text, border: `1px solid ${C.border}` } })
            }
        }
    }

    const handleDelete = async (id: string) => {
        setDeleting(id)
        const { error } = await deleteCard(id)
        setDeleting(null)

        if (error) {
            toast.error(error)
        } else {
            if (selectedId === id) setSelected(null)
            toast.success('Cartão removido', { style: { background: C.card, color: C.text, border: `1px solid ${C.border}` } })
        }
    }

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 700, color: C.text }}>Cartões</h1>
                    <p style={{ fontSize: 14, color: C.textMuted, marginTop: 4 }}>
                        {loading ? 'Carregando...' : `${cards.length} cartão(ões) · Gerencie seus cartões de crédito`}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <button onClick={() => setShowValues(!showValues)} style={btnOutlineStyle}>
                        {showValues ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    <button onClick={openCreate} style={btnGoldStyle}><Plus size={16} /> Novo Cartão</button>
                </div>
            </div>

            {/* Loading */}
            {loading && (
                <div style={{ ...cardStyle, padding: 64, textAlign: 'center' }}>
                    <Loader2 size={32} style={{ color: C.gold, margin: '0 auto 16px', animation: 'spin 1s linear infinite' }} />
                    <p style={{ fontSize: 14, color: C.textMuted }}>Carregando cartões...</p>
                </div>
            )}

            {/* Empty */}
            {!loading && cards.length === 0 && (
                <div style={{ ...cardStyle, padding: 64, textAlign: 'center' }}>
                    <CreditCard size={40} style={{ color: 'rgba(107,114,128,0.3)', margin: '0 auto 16px' }} />
                    <p style={{ fontSize: 18, fontWeight: 500, color: C.textMuted }}>Nenhum cartão cadastrado</p>
                    <p style={{ fontSize: 13, color: 'rgba(107,114,128,0.5)', marginTop: 8 }}>
                        Clique em &quot;Novo Cartão&quot; para adicionar seu primeiro cartão de crédito
                    </p>
                </div>
            )}

            {/* Main Grid */}
            {!loading && cards.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(250px, 350px) 1fr', gap: 24 }}>
                    {/* Card Visuals */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <AnimatePresence>
                            {cards.map((c, i) => (
                                <motion.div key={c.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                                    onClick={() => setSelected(c.id)}
                                    style={{
                                        background: getGradient(c.color), borderRadius: 16, padding: 24, cursor: 'pointer',
                                        position: 'relative',
                                        opacity: selectedId === c.id ? 1 : 0.6,
                                        outline: selectedId === c.id ? `2px solid ${C.gold}` : 'none',
                                        outlineOffset: 3, transition: 'all 0.3s ease',
                                    }}>

                                    {/* Actions */}
                                    <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 6 }}>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); openEdit(c) }}
                                            style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 6, padding: 6, cursor: 'pointer', color: 'rgba(255,255,255,0.5)', transition: 'color 0.2s' }}
                                            onMouseEnter={e => (e.currentTarget.style.color = 'white')}
                                            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.5)')}
                                            title="Editar"
                                        >
                                            <Edit3 size={12} />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDelete(c.id) }}
                                            disabled={deleting === c.id}
                                            style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 6, padding: 6, cursor: 'pointer', color: 'rgba(248,113,113,0.5)', transition: 'color 0.2s' }}
                                            onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
                                            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(248,113,113,0.5)')}
                                            title="Remover"
                                        >
                                            {deleting === c.id ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Trash2 size={12} />}
                                        </button>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 32 }}>
                                        <CreditCard size={28} style={{ color: 'rgba(255,255,255,0.5)' }} />
                                    </div>
                                    <p style={{ fontFamily: 'monospace', fontSize: 18, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.8)', marginBottom: 16 }}>
                                        •••• •••• •••• {c.last4 || '••••'}
                                    </p>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                        <div>
                                            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Fatura atual</p>
                                            <p style={{ fontSize: 18, fontWeight: 700, color: 'white' }}>{display(c.used)}</p>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{c.name}</p>
                                            {c.bank_name && <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>{c.bank_name}</p>}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>

                    {/* Invoice Detail */}
                    {card && (
                        <motion.div key={selectedId} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                            style={{ ...cardStyle, padding: 24 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
                                <div>
                                    <h3 style={{ fontWeight: 600, color: C.text }}>{card.name}</h3>
                                    <p style={{ fontSize: 12, color: C.textMuted }}>
                                        {card.bank_name ? `${card.bank_name} · ` : ''}Fatura atual
                                    </p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <p style={{ fontSize: 12, color: C.textMuted }}>Vencimento</p>
                                    <p style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 14, fontWeight: 500, color: C.gold }}>
                                        <Calendar size={14} /> Dia {card.due_day}
                                    </p>
                                </div>
                            </div>

                            {/* Utilization */}
                            <div style={{ marginBottom: 24 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 8 }}>
                                    <span style={{ color: C.textMuted }}>
                                        {card.limit > 0 ? `${utilization.toFixed(0)}% utilizado` : 'Sem limite definido'}
                                    </span>
                                    <span style={{ color: C.textMuted }}>Limite: {display(card.limit)}</span>
                                </div>
                                <div style={{ height: 10, borderRadius: 999, backgroundColor: C.secondary }}>
                                    <div style={{
                                        height: '100%', width: `${Math.min(100, utilization)}%`, borderRadius: 999, transition: 'width 0.8s ease',
                                        background: utilization > 80 ? C.red : utilization > 60 ? C.yellow : C.goldGrad,
                                    }} />
                                </div>
                                {utilization > 80 && (
                                    <p style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 8, fontSize: 12, color: C.red }}>
                                        <AlertTriangle size={12} /> Utilização alta!
                                    </p>
                                )}
                            </div>

                            {/* Summary row */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 24 }}>
                                <div style={{ padding: 12, borderRadius: 10, backgroundColor: C.secondary, textAlign: 'center' }}>
                                    <p style={{ fontSize: 11, color: C.textMuted, marginBottom: 4 }}>Fatura</p>
                                    <p style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{display(card.used)}</p>
                                </div>
                                <div style={{ padding: 12, borderRadius: 10, backgroundColor: C.secondary, textAlign: 'center' }}>
                                    <p style={{ fontSize: 11, color: C.textMuted, marginBottom: 4 }}>Disponível</p>
                                    <p style={{ fontSize: 16, fontWeight: 700, color: C.emerald }}>{display(Math.max(0, card.limit - card.used))}</p>
                                </div>
                                <div style={{ padding: 12, borderRadius: 10, backgroundColor: C.secondary, textAlign: 'center' }}>
                                    <p style={{ fontSize: 11, color: C.textMuted, marginBottom: 4 }}>Fecha dia</p>
                                    <p style={{ fontSize: 16, fontWeight: 700, color: C.gold }}>{card.closing_day}</p>
                                </div>
                            </div>

                            {/* Items */}
                            <h4 style={{ fontSize: 13, color: C.textMuted, marginBottom: 12 }}>Lançamentos</h4>
                            {card.invoice.length === 0 ? (
                                <div style={{ padding: 24, textAlign: 'center', color: C.textMuted, backgroundColor: C.secondary, borderRadius: 12 }}>
                                    Nenhum lançamento nesta fatura
                                </div>
                            ) : (
                                card.invoice.map((item, i) => {
                                    const cat = item.category_id ? CAT_MAP[item.category_id] : null
                                    return (
                                        <div key={item.id ?? i} style={{
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                            padding: 12, borderRadius: 8, backgroundColor: C.secondary, marginBottom: 8,
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <span style={{ fontSize: 16 }}>{cat?.icon ?? '💳'}</span>
                                                <div>
                                                    <p style={{ fontSize: 14, fontWeight: 500, color: C.text }}>{item.description}</p>
                                                    <p style={{ fontSize: 11, color: C.textMuted }}>
                                                        {cat?.name ?? 'Despesa'} · {formatInvoiceDate(item.date)}
                                                    </p>
                                                </div>
                                            </div>
                                            <p style={{ fontSize: 14, fontWeight: 500, color: C.text, whiteSpace: 'nowrap' }}>
                                                {display(item.amount)}
                                            </p>
                                        </div>
                                    )
                                })
                            )}

                            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: `1px solid ${C.border}`, paddingTop: 16, marginTop: 16 }}>
                                <span style={{ fontWeight: 500, color: C.textMuted }}>Total da fatura</span>
                                <span style={{ fontSize: 20, fontWeight: 700, color: C.text }}>{display(card.used)}</span>
                            </div>
                        </motion.div>
                    )}
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
                                    {editingCard ? 'Editar Cartão' : 'Novo Cartão'}
                                </h2>
                                <button onClick={() => { setShowModal(false); resetForm() }} style={{ background: 'none', border: 'none', color: C.textMuted, cursor: 'pointer' }}><X size={20} /></button>
                            </div>

                            {/* Preview do cartão */}
                            <div style={{
                                background: getGradient(cColor), borderRadius: 14, padding: 20, marginBottom: 24,
                            }}>
                                <CreditCard size={22} style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 20 }} />
                                <p style={{ fontFamily: 'monospace', fontSize: 16, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.7)', marginBottom: 12 }}>
                                    •••• •••• •••• {cLast4 || '••••'}
                                </p>
                                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{cName || 'Nome do Cartão'}</p>
                            </div>

                            {/* Nome */}
                            <div style={{ marginBottom: 16 }}>
                                <label style={{ display: 'block', fontSize: 13, color: C.textMuted, marginBottom: 6 }}>Nome do Cartão</label>
                                <input value={cName} onChange={e => setCName(e.target.value)} placeholder="Ex: Nubank Mastercard" style={inputStyle} />
                            </div>

                            {/* Banco */}
                            <div style={{ marginBottom: 16 }}>
                                <label style={{ display: 'block', fontSize: 13, color: C.textMuted, marginBottom: 6 }}>Banco (opcional)</label>
                                <input value={cBank} onChange={e => setCBank(e.target.value)} placeholder="Ex: Nubank, Itaú, Inter..." style={inputStyle} />
                            </div>

                            {/* Limite + Final */}
                            <div style={{ marginBottom: 16, display: 'flex', gap: 12 }}>
                                <div style={{ flex: 2 }}>
                                    <label style={{ display: 'block', fontSize: 13, color: C.textMuted, marginBottom: 6 }}>Limite (R$)</label>
                                    <input type="number" value={cLimit} onChange={e => setCLimit(e.target.value)} placeholder="0,00" step="0.01" min="0" style={inputStyle} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: 13, color: C.textMuted, marginBottom: 6 }}>Final</label>
                                    <input value={cLast4} onChange={e => setCLast4(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="1234" maxLength={4} style={inputStyle} />
                                </div>
                            </div>

                            {/* Fechamento + Vencimento */}
                            <div style={{ marginBottom: 16, display: 'flex', gap: 12 }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: 13, color: C.textMuted, marginBottom: 6 }}>Dia Fechamento</label>
                                    <input type="number" value={cClosing} onChange={e => setCClosing(e.target.value)} placeholder="1" min="1" max="31" style={inputStyle} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontSize: 13, color: C.textMuted, marginBottom: 6 }}>Dia Vencimento</label>
                                    <input type="number" value={cDue} onChange={e => setCDue(e.target.value)} placeholder="10" min="1" max="31" style={inputStyle} />
                                </div>
                            </div>

                            {/* Cor */}
                            <div style={{ marginBottom: 24 }}>
                                <label style={{ display: 'block', fontSize: 13, color: C.textMuted, marginBottom: 8 }}>Cor do Cartão</label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                    {COLOR_OPTIONS.map(opt => (
                                        <button key={opt.value}
                                            onClick={() => setCColor(opt.value)}
                                            style={{
                                                width: 36, height: 36, borderRadius: 10, border: 'none', cursor: 'pointer',
                                                background: getGradient(opt.value),
                                                outline: cColor === opt.value ? `2px solid ${C.gold}` : '2px solid transparent',
                                                outlineOffset: 2, transition: 'outline 0.2s',
                                            }}
                                            title={opt.label}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Botões */}
                            <div style={{ display: 'flex', gap: 12 }}>
                                <button onClick={() => { setShowModal(false); resetForm() }} style={{ ...btnOutlineStyle, flex: 1, padding: '12px 0' }}>Cancelar</button>
                                <button onClick={handleSave} disabled={saving} style={{
                                    ...btnGoldStyle, flex: 1, padding: '12px 0',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                    opacity: saving ? 0.7 : 1,
                                }}>
                                    {saving && <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />}
                                    {saving ? 'Salvando...' : editingCard ? 'Atualizar' : 'Salvar Cartão'}
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
