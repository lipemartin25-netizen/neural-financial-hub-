'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Plus, Trash2, Loader2, X, ChevronDown, Sparkles, CheckCircle2 } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import { C, cardStyle, cardHlStyle, inputStyle, btnGoldStyle, btnOutlineStyle } from '@/lib/theme'
import { toast } from 'sonner'
import { CATEGORIES } from '@/lib/constants'

type Rule = {
    id: string; pattern: string; match_type: string; category_id: string | null
    rename_to: string | null; set_type: string | null; is_active: boolean
    times_applied: number
    categories: { id: string; name: string; icon: string; color: string } | null
}

export default function RulesPage() {
    const [rules, setRules] = useState<Rule[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [saving, setSaving] = useState(false)
    const [deleting, setDeleting] = useState<string | null>(null)
    const [categorizing, setCategorizing] = useState(false)

    // Form
    const [pattern, setPattern] = useState('')
    const [matchType, setMatchType] = useState('contains')
    const [categoryId, setCategoryId] = useState('')
    const [renameTo, setRenameTo] = useState('')

    const fetchRules = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/rules')
            if (!res.ok) throw new Error()
            const json = await res.json()
            setRules(json.data ?? [])
        } catch { setRules([]) }
        finally { setLoading(false) }
    }, [])

    useEffect(() => { fetchRules() }, [fetchRules])

    const handleCreate = async () => {
        if (!pattern) { toast.error('Padrão é obrigatório'); return }
        if (!categoryId) { toast.error('Selecione uma categoria'); return }
        setSaving(true)

        try {
            const res = await fetch('/api/rules', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pattern, match_type: matchType, category_id: categoryId, rename_to: renameTo || null }),
            })
            if (!res.ok) { const j = await res.json(); throw new Error(j.error) }
            toast.success('Regra criada!', { style: { background: C.card, color: C.text, border: `1px solid ${C.border}` } })
            setShowModal(false); setPattern(''); setRenameTo(''); setCategoryId('')
            fetchRules()
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Erro')
        } finally { setSaving(false) }
    }

    const handleDelete = async (id: string) => {
        setDeleting(id)
        try {
            await fetch(`/api/rules?id=${id}`, { method: 'DELETE' })
            fetchRules()
            toast.success('Regra excluída', { style: { background: C.card, color: C.text, border: `1px solid ${C.border}` } })
        } catch { } finally { setDeleting(null) }
    }

    const handleCategorizeAll = async () => {
        setCategorizing(true)
        try {
            const res = await fetch('/api/ai/categorize', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
            const json = await res.json()
            if (!res.ok) throw new Error(json.error)
            const d = json.data
            toast.success(`${d.categorized} transações categorizadas! (${d.ruleMatches} por regras, ${d.aiMatches} por IA)`, {
                duration: 5000,
                style: { background: C.card, color: C.text, border: `1px solid ${C.border}` },
            })
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Erro ao categorizar')
        } finally { setCategorizing(false) }
    }

    const MATCH_LABELS: Record<string, string> = { contains: 'Contém', starts_with: 'Começa com', exact: 'Exato' }

    const selectStyle: React.CSSProperties = { ...inputStyle, appearance: 'none', cursor: 'pointer' }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <h1 style={{ fontSize: 24, fontWeight: 700, color: C.text }}>
                        <Zap size={22} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle', color: C.gold }} />
                        Regras Automáticas
                    </h1>
                    <p style={{ fontSize: 14, color: C.textMuted, marginTop: 4 }}>
                        Crie regras para categorizar transações automaticamente
                    </p>
                </motion.div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button onClick={handleCategorizeAll} disabled={categorizing} style={{ ...btnOutlineStyle, opacity: categorizing ? 0.7 : 1 }}>
                        {categorizing ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Sparkles size={16} />}
                        {categorizing ? 'Categorizando...' : 'Categorizar Tudo'}
                    </button>
                    <button onClick={() => setShowModal(true)} style={btnGoldStyle}>
                        <Plus size={16} /> Nova Regra
                    </button>
                </div>
            </div>

            {/* Info Card */}
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
                style={{ ...cardHlStyle, padding: 20, marginBottom: 24, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <Sparkles size={18} style={{ color: C.gold, flexShrink: 0, marginTop: 2 }} />
                <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Como funciona</p>
                    <p style={{ fontSize: 12, color: C.textMuted, marginTop: 4, lineHeight: 1.6 }}>
                        1. Crie regras com padrões de texto (ex: &quot;UBER&quot; → Transporte)<br />
                        2. Novas transações serão categorizadas automaticamente<br />
                        3. Transações sem regra são enviadas para a IA Gemini classificar<br />
                        4. Clique em &quot;Categorizar Tudo&quot; para processar transações pendentes
                    </p>
                </div>
            </motion.div>

            {/* Rules List */}
            {loading ? (
                <div style={{ ...cardStyle, padding: 60, display: 'flex', justifyContent: 'center' }}>
                    <Loader2 size={28} style={{ color: C.gold, animation: 'spin 1s linear infinite' }} />
                </div>
            ) : rules.length === 0 ? (
                <div style={{ ...cardStyle, padding: 60, textAlign: 'center' }}>
                    <Zap size={40} style={{ color: 'rgba(107,114,128,0.3)', margin: '0 auto 16px' }} />
                    <p style={{ fontSize: 16, fontWeight: 500, color: C.textMuted }}>Nenhuma regra criada</p>
                    <p style={{ fontSize: 13, color: 'rgba(107,114,128,0.5)', marginTop: 8 }}>
                        Crie regras para categorizar automaticamente com um clique
                    </p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {rules.map((rule, i) => (
                        <motion.div key={rule.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.04 }}
                            style={{ ...cardStyle, padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                                <div style={{
                                    width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    backgroundColor: C.secondary, fontSize: 18,
                                }}>
                                    {rule.categories?.icon ?? '📦'}
                                </div>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <span style={{ fontSize: 13, color: C.gold, fontFamily: 'monospace', backgroundColor: C.secondary, padding: '2px 8px', borderRadius: 6 }}>
                                            {rule.pattern}
                                        </span>
                                        <span style={{ fontSize: 10, color: C.textMuted, backgroundColor: C.secondary, padding: '2px 6px', borderRadius: 4 }}>
                                            {MATCH_LABELS[rule.match_type] ?? rule.match_type}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', gap: 8, marginTop: 4, alignItems: 'center' }}>
                                        <span style={{ fontSize: 12, color: C.textMuted }}>→ {rule.categories?.name ?? 'Sem categoria'}</span>
                                        {rule.rename_to && <span style={{ fontSize: 11, color: C.textMuted2 }}>| Renomear: {rule.rename_to}</span>}
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                {rule.times_applied > 0 && (
                                    <span style={{ fontSize: 11, color: C.emerald, display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <CheckCircle2 size={12} /> {rule.times_applied}x
                                    </span>
                                )}
                                <button onClick={() => handleDelete(rule.id)} disabled={deleting === rule.id}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 8, color: 'rgba(248,113,113,0.5)' }}
                                    onMouseEnter={e => (e.currentTarget.style.color = C.red)}
                                    onMouseLeave={e => (e.currentTarget.style.color = 'rgba(248,113,113,0.5)')}>
                                    {deleting === rule.id ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Trash2 size={14} />}
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Modal Create */}
            <AnimatePresence>
                {showModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.6)', padding: 16 }}
                        onClick={() => setShowModal(false)}>
                        <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                            onClick={e => e.stopPropagation()} style={{ ...cardHlStyle, width: '100%', maxWidth: 460, padding: 24 }}>

                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                                <h2 style={{ fontSize: 18, fontWeight: 700, color: C.text }}>Nova Regra</h2>
                                <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: C.textMuted, cursor: 'pointer' }}><X size={20} /></button>
                            </div>

                            <div style={{ marginBottom: 16 }}>
                                <label style={{ display: 'block', fontSize: 13, color: C.textMuted, marginBottom: 6 }}>Padrão de texto</label>
                                <input value={pattern} onChange={e => setPattern(e.target.value)} placeholder="Ex: UBER, NETFLIX, IFOOD..." style={inputStyle} />
                                <p style={{ fontSize: 11, color: C.textMuted2, marginTop: 4 }}>Quando uma transação corresponder a este padrão, a regra será aplicada</p>
                            </div>

                            <div style={{ marginBottom: 16 }}>
                                <label style={{ display: 'block', fontSize: 13, color: C.textMuted, marginBottom: 6 }}>Tipo de correspondência</label>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    {[
                                        { v: 'contains', l: 'Contém' },
                                        { v: 'starts_with', l: 'Começa com' },
                                        { v: 'exact', l: 'Exato' },
                                    ].map(m => (
                                        <button key={m.v} onClick={() => setMatchType(m.v)} style={{
                                            flex: 1, padding: '8px 0', borderRadius: 8, fontSize: 12, cursor: 'pointer',
                                            backgroundColor: matchType === m.v ? 'rgba(201,168,88,0.1)' : C.secondary,
                                            border: matchType === m.v ? '1px solid rgba(201,168,88,0.3)' : `1px solid ${C.border}`,
                                            color: matchType === m.v ? C.gold : C.textMuted,
                                        }}>{m.l}</button>
                                    ))}
                                </div>
                            </div>

                            <div style={{ marginBottom: 16 }}>
                                <label style={{ display: 'block', fontSize: 13, color: C.textMuted, marginBottom: 6 }}>Categoria destino</label>
                                <div style={{ position: 'relative' }}>
                                    <select value={categoryId} onChange={e => setCategoryId(e.target.value)} style={selectStyle}>
                                        <option value="">Selecione</option>
                                        {CATEGORIES.map(cat => <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>)}
                                    </select>
                                    <ChevronDown size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: C.textMuted, pointerEvents: 'none' }} />
                                </div>
                            </div>

                            <div style={{ marginBottom: 20 }}>
                                <label style={{ display: 'block', fontSize: 13, color: C.textMuted, marginBottom: 6 }}>Renomear para (opcional)</label>
                                <input value={renameTo} onChange={e => setRenameTo(e.target.value)} placeholder="Ex: Uber Viagem" style={inputStyle} />
                            </div>

                            <div style={{ display: 'flex', gap: 12 }}>
                                <button onClick={() => setShowModal(false)} style={{ ...btnOutlineStyle, flex: 1, padding: '12px 0' }}>Cancelar</button>
                                <button onClick={handleCreate} disabled={saving} style={{ ...btnGoldStyle, flex: 1, padding: '12px 0', opacity: saving ? 0.7 : 1 }}>
                                    {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Zap size={16} />}
                                    {saving ? 'Criando...' : 'Criar Regra'}
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
