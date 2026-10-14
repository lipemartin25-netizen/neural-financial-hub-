'use client'

import { motion, AnimatePresence } from 'framer-motion'
import {
    Users, UserPlus, Copy, Crown, Shield, Eye, LogOut, Plus,
    Target, Loader2, Check, X, Share2, Heart,
} from 'lucide-react'
import { useState } from 'react'
import { C, cardStyle, cardHlStyle, inputStyle, btnGoldStyle, btnOutlineStyle, fmt } from '@/lib/theme'
import { toast } from 'sonner'
import { useFamily } from '@/hooks/useFamily'
import type { FamilyMember, FamilyGoal } from '@/hooks/useFamily'

const ROLE_CONFIG: Record<string, { icon: typeof Crown; label: string; color: string }> = {
    owner: { icon: Crown, label: 'Dono', color: C.gold },
    admin: { icon: Shield, label: 'Admin', color: '#a78bfa' },
    member: { icon: Users, label: 'Membro', color: C.emerald },
    viewer: { icon: Eye, label: 'Visualizador', color: C.textMuted },
}

export default function FamilyPage() {
    const {
        data, loading, hasFamily,
        createFamily, joinFamily, leaveFamily,
        updateMemberRole, removeMember,
        createGoal, contributeToGoal,
    } = useFamily()

    const [tab, setTab] = useState<'create' | 'join'>('create')
    const [familyName, setFamilyName] = useState('')
    const [inviteCode, setInviteCode] = useState('')
    const [submitting, setSubmitting] = useState(false)

    const [showGoalModal, setShowGoalModal] = useState(false)
    const [showContributeModal, setShowContributeModal] = useState<FamilyGoal | null>(null)

    const [goalName, setGoalName] = useState('')
    const [goalTarget, setGoalTarget] = useState('')
    const [copied, setCopied] = useState(false)

    // ===================== SEM FAMÍLIA =====================
    if (!loading && !hasFamily) {
        return (
            <div style={{ padding: '24px' }}>
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 24 }}>
                    <h1 style={{ fontSize: 24, fontWeight: 700, color: C.text }}>
                        <Users size={22} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle', color: C.gold }} />
                        Família
                    </h1>
                    <p style={{ fontSize: 14, color: C.textMuted, marginTop: 4 }}>Gerencie finanças em família</p>
                </motion.div>

                <div style={{ maxWidth: 480, margin: '40px auto' }}>
                    {/* Tab Selector */}
                    <div style={{ display: 'flex', marginBottom: 24, borderRadius: 12, overflow: 'hidden', border: `1px solid ${C.border}` }}>
                        {[
                            { v: 'create' as const, label: 'Criar Família' },
                            { v: 'join' as const, label: 'Entrar com Código' },
                        ].map(t => (
                            <button key={t.v} onClick={() => setTab(t.v)} style={{
                                flex: 1, padding: '12px 0', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600,
                                backgroundColor: tab === t.v ? 'rgba(201,168,88,0.08)' : 'transparent',
                                color: tab === t.v ? C.gold : C.textMuted,
                                transition: 'all 0.2s',
                            }}>{t.label}</button>
                        ))}
                    </div>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        style={{ ...cardHlStyle, padding: 32, textAlign: 'center' }}>
                        {tab === 'create' ? (
                            <>
                                <Heart size={40} style={{ color: C.gold, margin: '0 auto 16px' }} />
                                <h2 style={{ fontSize: 20, fontWeight: 700, color: C.text, marginBottom: 8 }}>Criar Grupo Familiar</h2>
                                <p style={{ fontSize: 13, color: C.textMuted, marginBottom: 24 }}>
                                    Compartilhe metas, despesas e conquistas financeiras em família
                                </p>
                                <input value={familyName} onChange={e => setFamilyName(e.target.value)}
                                    placeholder="Nome da família (ex: Família Silva)"
                                    style={{ ...inputStyle, textAlign: 'center', marginBottom: 16 }} />
                                <button disabled={submitting || !familyName.trim()} onClick={async () => {
                                    setSubmitting(true)
                                    try { await createFamily(familyName); toast.success('Família criada!') }
                                    catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'Erro') }
                                    setSubmitting(false)
                                }} style={{ ...btnGoldStyle, width: '100%', padding: '14px 0', opacity: (!familyName.trim() || submitting) ? 0.5 : 1 }}>
                                    {submitting ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Plus size={16} />}
                                    Criar Família
                                </button>
                            </>
                        ) : (
                            <>
                                <UserPlus size={40} style={{ color: C.gold, margin: '0 auto 16px' }} />
                                <h2 style={{ fontSize: 20, fontWeight: 700, color: C.text, marginBottom: 8 }}>Entrar em uma Família</h2>
                                <p style={{ fontSize: 13, color: C.textMuted, marginBottom: 24 }}>
                                    Peça o código de convite para o dono do grupo
                                </p>
                                <input value={inviteCode} onChange={e => setInviteCode(e.target.value)}
                                    placeholder="Cole o código de convite"
                                    style={{ ...inputStyle, textAlign: 'center', marginBottom: 16, letterSpacing: 2, fontFamily: 'monospace' }} />
                                <button disabled={submitting || !inviteCode.trim()} onClick={async () => {
                                    setSubmitting(true)
                                    try {
                                        const result = await joinFamily(inviteCode)
                                        toast.success(`Entrou na família "${result.family_name}"!`)
                                    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'Erro') }
                                    setSubmitting(false)
                                }} style={{ ...btnGoldStyle, width: '100%', padding: '14px 0', opacity: (!inviteCode.trim() || submitting) ? 0.5 : 1 }}>
                                    {submitting ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <UserPlus size={16} />}
                                    Entrar
                                </button>
                            </>
                        )}
                    </motion.div>
                </div>
            </div>
        )
    }

    // ===================== LOADING =====================
    if (loading) {
        return (
            <div style={{ padding: 60, textAlign: 'center' }}>
                <Loader2 size={32} style={{ color: C.gold, animation: 'spin 1s linear infinite', margin: '0 auto' }} />
                <p style={{ color: C.textMuted, marginTop: 12 }}>Carregando família...</p>
                <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        )
    }

    // ===================== COM FAMÍLIA =====================
    const family = data!.family!
    const members = data!.members
    const goals = data!.goals
    const myRole = data!.myRole
    const isAdmin = ['owner', 'admin'].includes(myRole)

    const copyInviteCode = () => {
        navigator.clipboard.writeText(family.invite_code)
        setCopied(true)
        toast.success('Código copiado!')
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div style={{ padding: '24px' }}>
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 700, color: C.text }}>
                        <Users size={22} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle', color: C.gold }} />
                        {family.name}
                    </h1>
                    <p style={{ fontSize: 14, color: C.textMuted, marginTop: 4 }}>
                        {members.length} membro{members.length !== 1 ? 's' : ''} · Seu papel: {ROLE_CONFIG[myRole]?.label}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={copyInviteCode} style={{ ...btnOutlineStyle, gap: 6, display: 'flex', alignItems: 'center' }}>
                        {copied ? <Check size={14} /> : <Copy size={14} />}
                        {copied ? 'Copiado!' : family.invite_code}
                    </button>
                    {myRole !== 'viewer' && (
                        <button onClick={() => setShowGoalModal(true)} style={{ ...btnGoldStyle, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Plus size={16} /> Meta Familiar
                        </button>
                    )}
                </div>
            </motion.div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 24 }}>
                {/* ========== Membros ========== */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    style={{ ...cardStyle, padding: 24 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 600, color: C.text, marginBottom: 16 }}>👨👩👧👦 Membros</h3>
                    {members.map((m: FamilyMember) => {
                        const rc = ROLE_CONFIG[m.role] ?? ROLE_CONFIG.member
                        const RoleIcon = rc.icon
                        const name = m.nickname ?? m.profile?.full_name ?? m.profile?.email ?? 'Membro'
                        const initial = name.charAt(0).toUpperCase()
                        return (
                            <div key={m.id} style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: 12, borderRadius: 12, marginBottom: 8,
                                backgroundColor: C.secondary,
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{
                                        width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        background: m.role === 'owner' ? C.goldGrad : C.secondary,
                                        border: `1px solid ${m.role === 'owner' ? 'rgba(201,168,88,0.3)' : C.border}`,
                                        fontSize: 16, fontWeight: 700, color: m.role === 'owner' ? C.bg : C.text,
                                    }}>
                                        {initial}
                                    </div>
                                    <div>
                                        <p style={{ fontSize: 14, fontWeight: 500, color: C.text }}>{name}</p>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                                            <RoleIcon size={10} style={{ color: rc.color }} />
                                            <span style={{ fontSize: 11, color: rc.color }}>{rc.label}</span>
                                        </div>
                                    </div>
                                </div>
                                {isAdmin && m.role !== 'owner' && (
                                    <div style={{ display: 'flex', gap: 4 }}>
                                        <select
                                            value={m.role}
                                            onChange={e => updateMemberRole(m.id, e.target.value)}
                                            style={{
                                                padding: '4px 8px', borderRadius: 6, fontSize: 11,
                                                backgroundColor: C.bg, border: `1px solid ${C.border}`, color: C.text,
                                                cursor: 'pointer',
                                            }}
                                        >
                                            <option value="admin">Admin</option>
                                            <option value="member">Membro</option>
                                            <option value="viewer">Viewer</option>
                                        </select>
                                        <button onClick={() => {
                                            if (confirm(`Remover ${name}?`)) removeMember(m.id)
                                        }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(248,113,113,0.5)', padding: 4 }}>
                                            <X size={14} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        )
                    })}

                    {/* Sair da família */}
                    <button onClick={async () => {
                        const msg = myRole === 'owner'
                            ? 'Isso vai EXCLUIR a família inteira. Tem certeza?'
                            : 'Tem certeza que quer sair da família?'
                        if (!confirm(msg)) return
                        try { await leaveFamily(); toast.success('Saiu da família') }
                        catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'Erro') }
                    }} style={{
                        ...btnOutlineStyle, width: '100%', marginTop: 16, padding: '10px 0',
                        color: C.red, borderColor: 'rgba(248,113,113,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                    }}>
                        <LogOut size={14} /> {myRole === 'owner' ? 'Excluir Família' : 'Sair da Família'}
                    </button>
                </motion.div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    {/* ========== Orçamentos Compartilhados (Fase 3) ========== */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                        style={{ ...cardStyle, padding: 24 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <h3 style={{ fontSize: 15, fontWeight: 600, color: C.text }}>💰 Orçamentos da Família</h3>
                            {isAdmin && (
                                <button onClick={() => toast.info('Funcionalidade de criação em breve')} style={{
                                    padding: '4px 8px', borderRadius: 6, fontSize: 11, background: 'rgba(201,168,88,0.1)', color: C.gold, border: 'none', cursor: 'pointer'
                                }}>+ Novo</button>
                            )}
                        </div>
                        {data?.budgets && data.budgets.length > 0 ? data.budgets.map((b: any) => {
                            const pct = Math.min(100, (b.spent / b.amount) * 100)
                            return (
                                <div key={b.id} style={{ marginBottom: 16 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                        <span style={{ fontSize: 13, color: C.text }}>{b.categories?.icon} {b.categories?.name}</span>
                                        <span style={{ fontSize: 13, fontWeight: 700, color: pct >= 90 ? C.red : pct >= 70 ? C.yellow : C.emerald }}>{pct.toFixed(0)}%</span>
                                    </div>
                                    <div style={{ height: 6, borderRadius: 99, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                                        <div style={{ width: `${pct}%`, height: '100%', background: pct >= 90 ? C.red : C.gold, transition: 'width 0.5s' }} />
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                                        <span style={{ fontSize: 10, color: C.textMuted }}>Gasto: {fmt(b.spent)}</span>
                                        <span style={{ fontSize: 10, color: C.textMuted }}>Limite: {fmt(b.amount)}</span>
                                    </div>
                                </div>
                            )
                        }) : (
                            <div style={{ textAlign: 'center', padding: '20px 0' }}>
                                <p style={{ fontSize: 12, color: C.textMuted }}>Nenhum orçamento compartilhado.</p>
                            </div>
                        )}
                    </motion.div>

                    {/* ========== Metas Familiares ========== */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                        <div style={{ ...cardStyle, padding: 24 }}>
                            <h3 style={{ fontSize: 15, fontWeight: 600, color: C.text, marginBottom: 16 }}>🎯 Metas da Família</h3>
                            {goals.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: 32 }}>
                                    <Target size={32} style={{ color: 'rgba(107,114,128,0.3)', margin: '0 auto 12px' }} />
                                    <p style={{ fontSize: 13, color: C.textMuted }}>Nenhuma meta familiar ainda</p>
                                </div>
                            ) : goals.map((g: FamilyGoal) => {
                                const pct = g.target_amount > 0 ? Math.min(100, (g.current_amount / g.target_amount) * 100) : 0
                                return (
                                    <div key={g.id} style={{
                                        padding: 16, borderRadius: 12, marginBottom: 12,
                                        backgroundColor: g.is_completed ? 'rgba(52,211,153,0.05)' : C.secondary,
                                        border: `1px solid ${g.is_completed ? 'rgba(52,211,153,0.2)' : 'transparent'}`,
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                            <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>
                                                {g.icon} {g.name}
                                            </span>
                                            <span style={{ fontSize: 12, fontWeight: 600, color: g.is_completed ? C.emerald : C.gold }}>
                                                {pct.toFixed(0)}%
                                            </span>
                                        </div>
                                        <div style={{ height: 6, borderRadius: 999, backgroundColor: 'rgba(0,0,0,0.3)', marginBottom: 8 }}>
                                            <div style={{
                                                height: '100%', width: `${pct}%`, borderRadius: 999,
                                                background: g.is_completed ? C.emerald : C.goldGrad,
                                                transition: 'width 0.8s ease',
                                            }} />
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: 12, color: C.textMuted }}>
                                                {fmt(g.current_amount)} / {fmt(g.target_amount)}
                                            </span>
                                            {!g.is_completed && myRole !== 'viewer' && (
                                                <button onClick={() => setShowContributeModal(g)} style={{
                                                    padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                                                    backgroundColor: 'rgba(201,168,88,0.1)', border: `1px solid rgba(201,168,88,0.2)`,
                                                    color: C.gold, cursor: 'pointer',
                                                }}>
                                                    <Plus size={10} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 2 }} /> Contribuir
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Transações compartilhadas */}
            {data!.sharedTransactions.length > 0 && (
                <div style={{ ...cardStyle, padding: 24, marginTop: 24 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 600, color: C.text, marginBottom: 16 }}>
                        <Share2 size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
                        Transações Compartilhadas
                    </h3>
                    {data!.sharedTransactions.slice(0, 10).map(st => {
                        const tx = st.transactions
                        if (!tx) return null
                        return (
                            <div key={st.id} style={{
                                display: 'flex', justifyContent: 'space-between', padding: '10px 0',
                                borderBottom: `1px solid ${C.border}`,
                            }}>
                                <div>
                                    <p style={{ fontSize: 13, color: C.text }}>{tx.description ?? 'Transação'}</p>
                                    <p style={{ fontSize: 11, color: C.textMuted }}>{tx.date}</p>
                                </div>
                                <span style={{ fontSize: 13, fontWeight: 600, color: tx.type === 'income' ? C.emerald : C.red }}>
                                    {tx.type === 'income' ? '+' : '-'}{fmt(tx.amount)}
                                </span>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
