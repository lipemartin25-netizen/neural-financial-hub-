'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, Loader2, Target, CheckCircle2, Trash2 } from 'lucide-react'
import { useState, useMemo, useEffect } from 'react'
import { C, cardStyle, cardHlStyle, inputStyle, btnGoldStyle, btnOutlineStyle, fmt, NAV_SAFE_AREA } from '@/lib/theme'
import { toast } from 'sonner'
import { useFinanceStore } from '@/hooks/useFinanceStore'
import { ErrorBoundary } from '@/components/ErrorBoundary'

const ICONS = ['🎯', '🏠', '🚗', '✈️', '💰', '📚', '💍', '🏖️', '🛡️', '💻', '🎓', '🏋️']

function GoalsContent() {
    const { goals, loading, fetchGoals, addGoal, updateGoal, deleteGoal } = useFinanceStore()
    const [showModal, setShowModal] = useState(false)
    const [editingGoal, setEditingGoal] = useState<any>(null)
    const [saving, setSaving] = useState(false)
    const [showAddAmount, setShowAddAmount] = useState<string | null>(null)
    const [addAmountValue, setAddAmountValue] = useState('')

    const [fName, setFName] = useState('')
    const [fTarget, setFTarget] = useState('')
    const [fDeadline, setFDeadline] = useState('')
    const [fIcon, setFIcon] = useState('🎯')
    const [fColor, setFColor] = useState('#D4AF37')

    useEffect(() => { fetchGoals() }, [fetchGoals])

    const activeGoals = useMemo(() => goals.filter(g => g.status === 'active'), [goals])
    const completedGoals = useMemo(() => goals.filter(g => g.status === 'completed'), [goals])

    const totalTarget = useMemo(() => activeGoals.reduce((s, g) => s + Number(g.target_amount), 0), [activeGoals])
    const totalCurrent = useMemo(() => activeGoals.reduce((s, g) => s + Number(g.current_amount), 0), [activeGoals])

    const resetForm = () => { setFName(''); setFTarget(''); setFDeadline(''); setFIcon('🎯'); setFColor('#D4AF37'); setEditingGoal(null) }
    const openCreate = () => { resetForm(); setShowModal(true) }
    const openEdit = (g: any) => {
        setEditingGoal(g); setFName(g.name); setFTarget(String(g.target_amount))
        setFDeadline(g.deadline || ''); setFIcon(g.icon); setFColor(g.color); setShowModal(true)
    }

    const handleSave = async () => {
        if (!fName || !fTarget) { toast.error('Preencha nome e valor alvo'); return }
        setSaving(true)
        const payload = { name: fName, target_amount: parseFloat(fTarget), deadline: fDeadline || null, icon: fIcon, color: fColor }
        const { error } = editingGoal ? await updateGoal(editingGoal.id, payload) : await addGoal(payload)
        setSaving(false)
        if (error) toast.error(error)
        else { setShowModal(false); resetForm(); toast.success(editingGoal ? 'Atualizado!' : 'Meta criada!') }
    }

    const handleAddAmount = async (goalId: string) => {
        const val = parseFloat(addAmountValue)
        if (!val || val <= 0) { toast.error('Valor inválido'); return }
        const goal = goals.find(g => g.id === goalId)
        if (!goal) return
        const newAmount = Number(goal.current_amount) + val
        const isComplete = newAmount >= Number(goal.target_amount)

        const { error } = await updateGoal(goalId, {
            current_amount: newAmount,
            ...(isComplete ? { status: 'completed' as const } : {}),
        })

        if (error) toast.error(error)
        else {
            setShowAddAmount(null); setAddAmountValue('')
            toast.success(isComplete ? '🎉 Meta alcançada!' : 'Valor adicionado!')
        }
    }

    const handleDelete = async (id: string) => {
        const { error } = await deleteGoal(id)
        if (error) toast.error(error)
        else toast.success('Meta removida!')
    }

    const daysUntil = (date: string | null) => {
        if (!date) return null
        const d = Math.ceil((new Date(date + 'T12:00:00').getTime() - Date.now()) / 86400000)
        if (d <= 0) return 'Vencido'
        if (d === 1) return '1 dia'
        return `${d} dias`
    }

    const compactCard: React.CSSProperties = { ...cardStyle, borderRadius: 12 }
    const compactBtn: React.CSSProperties = { ...btnGoldStyle, padding: '8px 16px', fontSize: 13 }
    const compactBtnOut: React.CSSProperties = { ...btnOutlineStyle, padding: '8px 16px', fontSize: 13 }
    const compactInput: React.CSSProperties = { ...inputStyle, padding: '10px 14px', fontSize: 13 }

    return (
        <div style={{ paddingBottom: NAV_SAFE_AREA }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <h1 style={{ fontSize: 20, fontWeight: 700, color: C.text }}>Objetivos Financeiros</h1>
                    <p style={{ color: C.textMuted, fontSize: 13 }}>{activeGoals.length} metas ativas</p>
                </div>
                <button onClick={openCreate} style={compactBtn}><Plus size={14} /> Nova Meta</button>
            </div>

            {/* Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
                <div style={{ ...compactCard, padding: '12px 14px' }}>
                    <p style={{ fontSize: 11, color: C.textMuted, marginBottom: 2 }}>Total Alvo</p>
                    <p style={{ fontSize: 18, fontWeight: 700, color: C.gold, lineHeight: 1.2 }}>{fmt(totalTarget)}</p>
                </div>
                <div style={{ ...compactCard, padding: '12px 14px' }}>
                    <p style={{ fontSize: 11, color: C.textMuted, marginBottom: 2 }}>Acumulado</p>
                    <p style={{ fontSize: 18, fontWeight: 700, color: C.emerald, lineHeight: 1.2 }}>{fmt(totalCurrent)}</p>
                </div>
                <div style={{ ...compactCard, padding: '12px 14px' }}>
                    <p style={{ fontSize: 11, color: C.textMuted, marginBottom: 2 }}>Progresso</p>
                    <p style={{ fontSize: 18, fontWeight: 700, color: C.text, lineHeight: 1.2 }}>
                        {totalTarget > 0 ? ((totalCurrent / totalTarget) * 100).toFixed(0) : 0}%
                    </p>
                </div>
            </div>

            {/* Active goals */}
            {activeGoals.length === 0 && completedGoals.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 16px' }} aria-live="polite">
                    <p style={{ fontSize: 40, marginBottom: 12 }}>🎯</p>
                    <p style={{ color: C.textMuted, fontSize: 14, marginBottom: 16 }}>Nenhuma meta definida ainda</p>
                    <button onClick={openCreate} style={compactBtn}><Plus size={14} /> Criar primeira meta</button>
                </div>
            ) : (
                <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10, marginBottom: 20 }}>
                        {activeGoals.map(goal => {
                            const pct = Number(goal.target_amount) > 0
                                ? Math.min((Number(goal.current_amount) / Number(goal.target_amount)) * 100, 100) : 0
                            const remaining = Number(goal.target_amount) - Number(goal.current_amount)
                            const days = daysUntil(goal.deadline)

                            return (
                                <motion.div key={goal.id} layout style={{ ...compactCard, padding: '14px 16px', borderLeft: `3px solid ${goal.color}` }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                                        <div style={{ display: 'flex', gap: 10, alignItems: 'center', cursor: 'pointer' }} onClick={() => openEdit(goal)}>
                                            <span style={{ fontSize: 24 }}>{goal.icon}</span>
                                            <div>
                                                <p style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{goal.name}</p>
                                                {days && <p style={{ fontSize: 11, color: days === 'Vencido' ? C.red : C.textMuted }}>{days} restantes</p>}
                                            </div>
                                        </div>
                                        <button onClick={() => handleDelete(goal.id)} style={{ background: 'none', border: 'none', color: C.textMuted, cursor: 'pointer', padding: 4, opacity: 0.4 }}>
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                    {/* Values */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                        <span style={{ fontSize: 11, color: C.textMuted }}>{fmt(Number(goal.current_amount))}</span>
                                        <span style={{ fontSize: 11, color: C.textMuted }}>{fmt(Number(goal.target_amount))}</span>
                                    </div>
                                    {/* Progress bar */}
                                    <div style={{ height: 8, borderRadius: 4, background: C.secondary, overflow: 'hidden', marginBottom: 10 }}>
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${pct}%` }}
                                            transition={{ duration: 0.8, ease: 'easeOut' }}
                                            style={{ height: '100%', borderRadius: 4, background: goal.color }}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{pct.toFixed(0)}% · Faltam {fmt(Math.max(remaining, 0))}</span>

                                        {showAddAmount === goal.id ? (
                                            <div style={{ display: 'flex', gap: 6 }}>
                                                <input
                                                    type="number" step="0.01" min="0" value={addAmountValue}
                                                    onChange={e => setAddAmountValue(e.target.value)}
                                                    style={{ ...compactInput, width: 100, padding: '6px 10px', fontSize: 12 }}
                                                    placeholder="R$"
                                                    autoFocus
                                                />
                                                <button onClick={() => handleAddAmount(goal.id)} style={{ ...compactBtn, padding: '6px 10px', fontSize: 11 }}>+</button>
                                                <button onClick={() => { setShowAddAmount(null); setAddAmountValue('') }} style={{ ...compactBtnOut, padding: '6px 8px', fontSize: 11 }}>
                                                    <X size={10} />
                                                </button>
                                            </div>
                                        ) : (
                                            <button onClick={() => setShowAddAmount(goal.id)} style={{ ...compactBtn, padding: '6px 12px', fontSize: 11 }}>
                                                <Plus size={10} /> Depositar
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            )
                        })}
                    </div>

                    {/* Completed */}
                    {completedGoals.length > 0 && (
                        <>
                            <p style={{ fontSize: 13, fontWeight: 600, color: C.textMuted, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                <CheckCircle2 size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: -2 }} />
                                Metas Alcançadas ({completedGoals.length})
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {completedGoals.map(goal => (
                                    <div key={goal.id} style={{ ...compactCard, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, opacity: 0.7 }}>
                                        <span style={{ fontSize: 20 }}>{goal.icon}</span>
                                        <div style={{ flex: 1 }}>
                                            <p style={{ fontSize: 13, fontWeight: 600, color: C.text, textDecoration: 'line-through' }}>{goal.name}</p>
                                        </div>
                                        <p style={{ fontSize: 13, fontWeight: 700, color: C.emerald }}>{fmt(Number(goal.target_amount))} ✓</p>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </>
            )}

            {/* Modal Create/Edit */}
            <AnimatePresence>
                {showModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', padding: 16 }}
                        onClick={() => setShowModal(false)}>
                        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
                            onClick={e => e.stopPropagation()}
                            style={{ ...cardHlStyle, width: '100%', maxWidth: 420, padding: 20, maxHeight: '90vh', overflowY: 'auto' }} role="dialog">
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                                <h2 style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{editingGoal ? 'Editar' : 'Nova'} Meta</h2>
                                <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: C.textMuted, cursor: 'pointer' }}><X size={18} /></button>
                            </div>

                            {/* Icon picker */}
                            <div style={{ marginBottom: 12 }}>
                                <label style={{ fontSize: 11, color: C.textMuted, display: 'block', marginBottom: 4 }}>Ícone</label>
                                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                    {ICONS.map(ic => (
                                        <button key={ic} onClick={() => setFIcon(ic)}
                                            style={{
                                                width: 36, height: 36, borderRadius: 8, border: fIcon === ic ? `2px solid ${C.gold}` : `1px solid ${C.border}`,
                                                background: fIcon === ic ? C.secondary : 'transparent', fontSize: 18, cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            }}>
                                            {ic}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div style={{ marginBottom: 12 }}>
                                <label style={{ fontSize: 11, color: C.textMuted, display: 'block', marginBottom: 4 }}>Nome da meta *</label>
                                <input value={fName} onChange={e => setFName(e.target.value)} placeholder="Ex: Viagem, Carro novo..." style={compactInput} />
                            </div>

                            <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: 11, color: C.textMuted, display: 'block', marginBottom: 4 }}>Valor alvo (R$) *</label>
                                    <input type="number" step="0.01" min="0" value={fTarget} onChange={e => setFTarget(e.target.value)} style={compactInput} placeholder="0,00" />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: 11, color: C.textMuted, display: 'block', marginBottom: 4 }}>Prazo</label>
                                    <input type="date" value={fDeadline} onChange={e => setFDeadline(e.target.value)} style={compactInput} />
                                </div>
                            </div>

                            <div style={{ marginBottom: 20 }}>
                                <label style={{ fontSize: 11, color: C.textMuted, display: 'block', marginBottom: 4 }}>Cor</label>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    {['#D4AF37', '#34d399', '#f87171', '#3b82f6', '#a78bfa', '#fb923c', '#f472b6'].map(c => (
                                        <button key={c} onClick={() => setFColor(c)}
                                            style={{
                                                width: 28, height: 28, borderRadius: '50%', background: c, border: fColor === c ? '3px solid white' : '2px solid transparent',
                                                cursor: 'pointer', boxShadow: fColor === c ? `0 0 0 2px ${c}` : 'none',
                                            }} />
                                    ))}
                                </div>
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

export default function GoalsPage() {
    return (
        <ErrorBoundary fallbackTitle="Erro nos Objetivos">
            <GoalsContent />
        </ErrorBoundary>
    )
}
