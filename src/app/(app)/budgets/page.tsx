'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, Loader2, ChevronDown, AlertTriangle, TrendingUp, Wallet } from 'lucide-react'
import { useState, useMemo, useEffect } from 'react'
import { C, cardStyle, cardHlStyle, inputStyle, btnGoldStyle, btnOutlineStyle, fmt, NAV_SAFE_AREA } from '@/lib/theme'
import { toast } from 'sonner'
import { useFinanceStore } from '@/hooks/useFinanceStore'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import type { Budget } from '@/types/database'

function BudgetsContent() {
    const {
        budgets, categories, transactions, loading,
        fetchBudgets, fetchCategories, fetchTransactions,
        upsertBudget, deleteBudget
    } = useFinanceStore()

    const [currentMonth, setCurrentMonth] = useState(() => {
        const now = new Date()
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    })

    const [showModal, setShowModal] = useState(false)
    const [saving, setSaving] = useState(false)
    const [fCategory, setFCategory] = useState('')
    const [fAmount, setFAmount] = useState('')

    useEffect(() => {
        fetchBudgets()
        fetchCategories()
        fetchTransactions()
    }, [fetchBudgets, fetchCategories, fetchTransactions])

    // Gastos reais por categoria no mês
    const actualSpending = useMemo(() => {
        const map: Record<string, number> = {}
        transactions
            .filter(tx => tx.type === 'expense' && tx.date.startsWith(currentMonth))
            .forEach(tx => {
                const catId = tx.category_id || 'uncategorized'
                map[catId] = (map[catId] || 0) + Number(tx.amount)
            })
        return map
    }, [transactions, currentMonth])

    const monthBudgets = useMemo(() => {
        return budgets.filter(b => b.month.startsWith(currentMonth))
    }, [budgets, currentMonth])

    const totalPlanned = useMemo(() => monthBudgets.reduce((s, b) => s + Number(b.planned_amount), 0), [monthBudgets])
    const totalSpent = useMemo(() => {
        return monthBudgets.reduce((s, b) => s + (actualSpending[b.category_id] || 0), 0)
    }, [monthBudgets, actualSpending])

    const handleSave = async () => {
        if (!fCategory || !fAmount) { toast.error('Preencha todos os campos'); return }
        setSaving(true)
        const { error } = await upsertBudget({
            category_id: fCategory,
            month: `${currentMonth}-01`,
            planned_amount: parseFloat(fAmount),
        })
        setSaving(false)
        if (error) toast.error(error)
        else { setShowModal(false); setFCategory(''); setFAmount(''); toast.success('Orçamento salvo!') }
    }

    const handleDelete = async (id: string) => {
        const { error } = await deleteBudget(id)
        if (error) toast.error(error)
        else toast.success('Removido!')
    }

    const changeMonth = (delta: number) => {
        const [y, m] = currentMonth.split('-').map(Number)
        const d = new Date(y, m - 1 + delta, 1)
        setCurrentMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
    }

    const monthLabel = new Date(currentMonth + '-15').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

    const compactCard: React.CSSProperties = { ...cardStyle, borderRadius: 12 }
    const compactBtn: React.CSSProperties = { ...btnGoldStyle, padding: '8px 16px', fontSize: 13 }
    const compactBtnOut: React.CSSProperties = { ...btnOutlineStyle, padding: '8px 16px', fontSize: 13 }
    const compactInput: React.CSSProperties = { ...inputStyle, padding: '10px 14px', fontSize: 13 }
    const selectStyle: React.CSSProperties = { ...compactInput, appearance: 'none', WebkitAppearance: 'none', cursor: 'pointer' }

    return (
        <div style={{ paddingBottom: NAV_SAFE_AREA }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <h1 style={{ fontSize: 20, fontWeight: 700, color: C.text }}>Orçamento</h1>
                    <p style={{ color: C.textMuted, fontSize: 13 }}>Controle seus limites por categoria</p>
                </div>
                <button onClick={() => setShowModal(true)} style={compactBtn}><Plus size={14} /> Definir Limite</button>
            </div>

            {/* Month selector */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 16 }}>
                <button onClick={() => changeMonth(-1)} style={{ ...compactBtnOut, padding: '6px 12px' }}>←</button>
                <span style={{ fontSize: 15, fontWeight: 600, color: C.text, textTransform: 'capitalize', minWidth: 160, textAlign: 'center' }}>{monthLabel}</span>
                <button onClick={() => changeMonth(1)} style={{ ...compactBtnOut, padding: '6px 12px' }}>→</button>
            </div>

            {/* Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
                <div style={{ ...compactCard, padding: '12px 14px' }}>
                    <p style={{ fontSize: 11, color: C.textMuted, marginBottom: 2 }}>Planejado</p>
                    <p style={{ fontSize: 18, fontWeight: 700, color: C.gold, lineHeight: 1.2 }}>{fmt(totalPlanned)}</p>
                </div>
                <div style={{ ...compactCard, padding: '12px 14px' }}>
                    <p style={{ fontSize: 11, color: C.textMuted, marginBottom: 2 }}>Gasto</p>
                    <p style={{ fontSize: 18, fontWeight: 700, color: totalSpent > totalPlanned ? C.red : C.emerald, lineHeight: 1.2 }}>{fmt(totalSpent)}</p>
                </div>
                <div style={{ ...compactCard, padding: '12px 14px' }}>
                    <p style={{ fontSize: 11, color: C.textMuted, marginBottom: 2 }}>Disponível</p>
                    <p style={{ fontSize: 18, fontWeight: 700, color: totalPlanned - totalSpent >= 0 ? C.emerald : C.red, lineHeight: 1.2 }}>{fmt(totalPlanned - totalSpent)}</p>
                </div>
            </div>

            {/* Budget list */}
            {monthBudgets.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 16px' }} aria-live="polite">
                    <p style={{ fontSize: 40, marginBottom: 12 }}>📊</p>
                    <p style={{ color: C.textMuted, fontSize: 14, marginBottom: 16 }}>Nenhum orçamento definido para este mês</p>
                    <button onClick={() => setShowModal(true)} style={compactBtn}><Plus size={14} /> Definir primeiro</button>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {monthBudgets.map(budget => {
                        const spent = actualSpending[budget.category_id] || 0
                        const planned = Number(budget.planned_amount)
                        const pct = planned > 0 ? Math.min((spent / planned) * 100, 100) : 0
                        const over = spent > planned
                        const catName = budget.category?.name || 'Categoria'
                        const catIcon = budget.category?.icon || '💰'

                        return (
                            <motion.div key={budget.id} layout style={{ ...compactCard, padding: '12px 14px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <div style={{ width: 32, height: 32, borderRadius: 8, background: C.secondary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                                            {catIcon}
                                        </div>
                                        <div>
                                            <p style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{catName}</p>
                                            <p style={{ fontSize: 11, color: C.textMuted }}>{fmt(spent)} de {fmt(planned)}</p>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        {over && <AlertTriangle size={14} style={{ color: C.red }} />}
                                        <span style={{ fontSize: 13, fontWeight: 700, color: over ? C.red : C.emerald }}>{pct.toFixed(0)}%</span>
                                        <button onClick={() => handleDelete(budget.id)} style={{ background: 'none', border: 'none', color: C.textMuted, cursor: 'pointer', padding: 4, opacity: 0.5 }}>
                                            <X size={12} />
                                        </button>
                                    </div>
                                </div>
                                {/* Progress bar */}
                                <div style={{ height: 6, borderRadius: 3, background: C.secondary, overflow: 'hidden' }}>
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${pct}%` }}
                                        transition={{ duration: 0.6, ease: 'easeOut' }}
                                        style={{
                                            height: '100%', borderRadius: 3,
                                            background: over ? C.red : pct > 80 ? C.yellow : C.emerald,
                                        }}
                                    />
                                </div>
                            </motion.div>
                        )
                    })}
                </div>
            )}

            {/* Modal */}
            <AnimatePresence>
                {showModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', padding: 16 }}
                        onClick={() => setShowModal(false)}>
                        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
                            onClick={e => e.stopPropagation()}
                            style={{ ...cardHlStyle, width: '100%', maxWidth: 380, padding: 20 }} role="dialog">
                            <h2 style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 16 }}>Definir Limite</h2>

                            <div style={{ marginBottom: 12 }}>
                                <label style={{ fontSize: 11, color: C.textMuted, display: 'block', marginBottom: 4 }}>Categoria</label>
                                <div style={{ position: 'relative' }}>
                                    <select value={fCategory} onChange={e => setFCategory(e.target.value)} style={selectStyle}>
                                        <option value="">Selecione...</option>
                                        {categories?.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                                    </select>
                                    <ChevronDown size={12} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: C.textMuted }} />
                                </div>
                            </div>

                            <div style={{ marginBottom: 20 }}>
                                <label style={{ fontSize: 11, color: C.textMuted, display: 'block', marginBottom: 4 }}>Valor Limite (R$)</label>
                                <input type="number" step="0.01" min="0" value={fAmount} onChange={e => setFAmount(e.target.value)} style={compactInput} placeholder="0,00" />
                            </div>

                            <div style={{ display: 'flex', gap: 10 }}>
                                <button onClick={() => setShowModal(false)} style={{ ...compactBtnOut, flex: 1 }}>Cancelar</button>
                                <button onClick={handleSave} disabled={saving} style={{ ...compactBtn, flex: 1, opacity: saving ? 0.6 : 1 }}>
                                    {saving ? <Loader2 size={14} className="animate-spin" /> : 'Salvar'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

export default function BudgetsPage() {
    return (
        <ErrorBoundary fallbackTitle="Erro no Orçamento">
            <BudgetsContent />
        </ErrorBoundary>
    )
}
