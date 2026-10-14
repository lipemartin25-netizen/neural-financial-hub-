'use client'
import { motion } from 'framer-motion'
import {
    Shield, ShieldCheck, ShieldAlert, ShieldX, TrendingUp,
    Loader2, Info, ArrowRight, Wallet, PiggyBank, Target,
    Clock, Banknote, ChevronRight, RefreshCw,
} from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { C, cardStyle, cardHlStyle, btnGoldStyle, btnOutlineStyle, fmt, NAV_SAFE_AREA } from '@/lib/theme'
import GoldText from '@/components/GoldText'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { useApp } from '@/contexts/AppContext'
import { getThemeColors } from '@/lib/themeColors'

type EmergencyData = {
    currentReserve: number
    avgMonthlyExpense: number
    monthsCovered: number
    targets: { minimum: number; recommended: number; comfortable: number }
    targetAmount: number
    progress: number
    status: 'critical' | 'building' | 'almost' | 'complete'
    remaining: number
    suggestedMonthlySaving: number
    monthsToComplete: number
    monthlyIncome: number
    liquidAccounts: Array<{ id: string; name: string; balance: number; type: string }>
    totalLiquid: number
    hasGoal: boolean
    goalId: string | null
    tips: Array<{ icon: string; text: string; priority: 'high' | 'medium' | 'low' }>
    suggestions: Array<{ name: string; desc: string; risk: string; color: string }>
    monthsAnalyzed: number
}

const STATUS_CONFIG = {
    critical: { label: 'Crítico', color: '#EF4444', Icon: ShieldX, bg: 'rgba(239,68,68,0.08)' },
    building: { label: 'Construindo', color: '#F59E0B', Icon: ShieldAlert, bg: 'rgba(245,158,11,0.08)' },
    almost: { label: 'Quase lá', color: '#3B82F6', Icon: Shield, bg: 'rgba(59,130,246,0.08)' },
    complete: { label: 'Completa', color: '#10B981', Icon: ShieldCheck, bg: 'rgba(16,185,129,0.08)' },
}

const TYPE_LABELS: Record<string, string> = {
    checking: 'Corrente', savings: 'Poupança', cash: 'Dinheiro', wallet: 'Carteira',
}

function EmergencyFundContent() {
    const router = useRouter()
    const { theme } = useApp()
    const TC = getThemeColors(theme)
    const [data, setData] = useState<EmergencyData | null>(null)
    const [loading, setLoading] = useState(true)
    const [selectedTarget, setSelectedTarget] = useState<'minimum' | 'recommended' | 'comfortable'>('recommended')

    const fetchData = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/emergency-fund')
            if (!res.ok) throw new Error()
            const json = await res.json()
            setData(json.data)
        } catch {
            setData(null)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { fetchData() }, [fetchData])

    if (loading) {
        return (
            <div style={{ paddingBottom: NAV_SAFE_AREA }}>
                <h1 style={{ fontSize: 20, fontWeight: 700, color: TC.text, marginBottom: 8 }}>Reserva de Emergência</h1>
                <p style={{ fontSize: 13, color: TC.textMuted, marginBottom: 24 }}>Calculando sua proteção financeira...</p>
                <div style={{ ...cardStyle, borderRadius: 12, padding: 80, display: 'flex', justifyContent: 'center' }}>
                    <Loader2 size={32} style={{ color: TC.gold, animation: 'spin 1s linear infinite' }} />
                </div>
                <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        )
    }

    if (!data) {
        return (
            <div style={{ paddingBottom: NAV_SAFE_AREA }}>
                <h1 style={{ fontSize: 20, fontWeight: 700, color: TC.text }}>Reserva de Emergência</h1>
                <div style={{ ...cardStyle, borderRadius: 12, padding: 40, textAlign: 'center', marginTop: 24 }}>
                    <p style={{ color: TC.textMuted }}>Erro ao calcular sua reserva.</p>
                    <button onClick={fetchData} style={{ ...btnOutlineStyle, marginTop: 16, padding: '8px 16px', fontSize: 13 }}>Tentar novamente</button>
                </div>
            </div>
        )
    }

    const cfg = STATUS_CONFIG[data.status]
    const StatusIcon = cfg.Icon

    // Calcular progresso baseado no target selecionado
    const currentTarget = data.targets[selectedTarget]
    const currentProgress = currentTarget > 0 ? Math.min((data.currentReserve / currentTarget) * 100, 100) : 0
    const currentRemaining = Math.max(0, currentTarget - data.currentReserve)

    // SVG ring
    const r = 75
    const circ = 2 * Math.PI * r
    const offset = circ - (currentProgress / 100) * circ

    const compactCard: React.CSSProperties = { ...cardStyle, borderRadius: 12 }
    const compactBtn: React.CSSProperties = { ...btnGoldStyle, padding: '8px 16px', fontSize: 13 }
    const compactBtnOut: React.CSSProperties = { ...btnOutlineStyle, padding: '8px 16px', fontSize: 13 }

    return (
        <div style={{ paddingBottom: NAV_SAFE_AREA }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <h1 style={{ fontSize: 20, fontWeight: 700, color: TC.text }}>Reserva de Emergência</h1>
                    <p style={{ color: TC.textMuted, fontSize: 13 }}>Sua rede de segurança financeira</p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={fetchData} style={compactBtnOut}><RefreshCw size={14} /></button>
                    {!data.hasGoal && (
                        <button onClick={() => router.push('/goals')} style={compactBtn}>
                            <Target size={14} /> Criar Meta
                        </button>
                    )}
                </div>
            </div>

            {/* Hero — Score Ring + Status */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                style={{ ...cardHlStyle, padding: 32, marginBottom: 16, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 32 }}>
                {/* Ring */}
                <div style={{ position: 'relative', width: 190, height: 190 }}>
                    <svg width="190" height="190" style={{ transform: 'rotate(-90deg)' }}>
                        <circle cx="95" cy="95" r={r} fill="none" stroke={TC.secondary} strokeWidth="12" />
                        <motion.circle cx="95" cy="95" r={r} fill="none" stroke={cfg.color} strokeWidth="12"
                            strokeLinecap="round" strokeDasharray={circ}
                            initial={{ strokeDashoffset: circ }}
                            animate={{ strokeDashoffset: offset }}
                            transition={{ duration: 1.5, delay: 0.3 }} />
                    </svg>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <StatusIcon size={24} style={{ color: cfg.color, marginBottom: 4 }} />
                        <span style={{ fontSize: 28, fontWeight: 800, color: cfg.color }}>{currentProgress.toFixed(0)}%</span>
                        <span style={{ fontSize: 11, color: TC.textMuted }}>da meta</span>
                    </div>
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px',
                        borderRadius: 999, backgroundColor: cfg.bg, marginBottom: 12,
                    }}>
                        <StatusIcon size={14} style={{ color: cfg.color }} />
                        <span style={{ fontSize: 12, fontWeight: 600, color: cfg.color }}>{cfg.label}</span>
                    </div>
                    <p style={{ fontSize: 13, color: TC.textMuted, marginBottom: 12 }}>Sua reserva atual</p>
                    <p style={{ fontSize: 32, fontWeight: 800, lineHeight: 1.1 }}>
                        <GoldText>{fmt(data.currentReserve)}</GoldText>
                    </p>
                    <p style={{ fontSize: 12, color: TC.textMuted, marginTop: 4 }}>
                        Cobre <strong style={{ color: TC.text }}>{data.monthsCovered} meses</strong> de despesas
                    </p>

                    <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
                        <div>
                            <p style={{ fontSize: 10, color: TC.textMuted }}>Gasto Médio/Mês</p>
                            <p style={{ fontSize: 14, fontWeight: 600, color: TC.text }}>{fmt(data.avgMonthlyExpense)}</p>
                        </div>
                        <div>
                            <p style={{ fontSize: 10, color: TC.textMuted }}>Falta</p>
                            <p style={{ fontSize: 14, fontWeight: 600, color: currentRemaining > 0 ? TC.red : TC.emerald }}>
                                {currentRemaining > 0 ? fmt(currentRemaining) : '✓ Completa'}
                            </p>
                        </div>
                        {data.monthsToComplete > 0 && currentRemaining > 0 && (
                            <div>
                                <p style={{ fontSize: 10, color: TC.textMuted }}>Tempo Estimado</p>
                                <p style={{ fontSize: 14, fontWeight: 600, color: TC.text }}>
                                    {data.monthsToComplete} meses
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>

            {/* Target Selector */}
            <div style={{ ...compactCard, padding: '14px 16px', marginBottom: 16 }}>
                <p style={{ fontSize: 11, color: TC.textMuted, marginBottom: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Meta de Reserva
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                    {([
                        { key: 'minimum' as const, label: '3 Meses', desc: 'Mínimo', value: data.targets.minimum, icon: '🛡️' },
                        { key: 'recommended' as const, label: '6 Meses', desc: 'Recomendado', value: data.targets.recommended, icon: '⭐' },
                        { key: 'comfortable' as const, label: '12 Meses', desc: 'Confortável', value: data.targets.comfortable, icon: '🏆' },
                    ]).map(t => {
                        const active = selectedTarget === t.key
                        const filled = data.currentReserve >= t.value
                        return (
                            <button key={t.key} onClick={() => setSelectedTarget(t.key)}
                                style={{
                                    padding: 12, borderRadius: 10, cursor: 'pointer', textAlign: 'center',
                                    border: active ? `2px solid ${TC.gold}` : `1px solid ${TC.border}`,
                                    backgroundColor: active ? 'rgba(201,168,88,0.06)' : 'transparent',
                                    transition: 'all 0.2s',
                                }}>
                                <span style={{ fontSize: 20, display: 'block', marginBottom: 4 }}>{t.icon}</span>
                                <p style={{ fontSize: 12, fontWeight: 600, color: active ? TC.gold : TC.text }}>{t.label}</p>
                                <p style={{ fontSize: 10, color: TC.textMuted }}>{t.desc}</p>
                                <p style={{ fontSize: 13, fontWeight: 700, color: filled ? TC.emerald : TC.text, marginTop: 4 }}>
                                    {fmt(t.value)}
                                </p>
                                {filled && <p style={{ fontSize: 9, color: TC.emerald, marginTop: 2 }}>✓ Atingida</p>}
                            </button>
                        )
                    })}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
                {/* Dicas & Insights */}
                <div style={{ ...compactCard, padding: '16px' }}>
                    <h3 style={{ fontSize: 14, fontWeight: 600, color: TC.text, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Info size={16} style={{ color: TC.gold }} /> Análise Personalizada
                    </h3>
                    {data.tips.map((tip, i) => (
                        <div key={i} style={{
                            display: 'flex', alignItems: 'flex-start', gap: 10, padding: 12, borderRadius: 10,
                            backgroundColor: TC.secondary, marginBottom: 8,
                            borderLeft: `3px solid ${tip.priority === 'high' ? TC.red : tip.priority === 'medium' ? TC.yellow : TC.emerald}`,
                        }}>
                            <span style={{ fontSize: 18, flexShrink: 0 }}>{tip.icon}</span>
                            <p style={{ fontSize: 12, color: TC.text, lineHeight: 1.5, opacity: 0.85 }}>{tip.text}</p>
                        </div>
                    ))}

                    {/* Plano de ação */}
                    {currentRemaining > 0 && data.suggestedMonthlySaving > 0 && (
                        <div style={{
                            padding: 14, borderRadius: 10, marginTop: 8,
                            background: 'rgba(201,168,88,0.04)', border: `1px solid rgba(201,168,88,0.15)`,
                        }}>
                            <p style={{ fontSize: 12, fontWeight: 600, color: TC.gold, marginBottom: 6 }}>
                                📋 Plano Sugerido
                            </p>
                            <p style={{ fontSize: 12, color: TC.text, lineHeight: 1.5, opacity: 0.85 }}>
                                Guardando <strong>{fmt(data.suggestedMonthlySaving)}</strong> por mês
                                (≈20% da sua renda), você completa a reserva em <strong>{data.monthsToComplete} meses</strong>.
                            </p>

                            {/* Timeline visual */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
                                <div style={{ width: 24, height: 24, borderRadius: 999, backgroundColor: 'rgba(201,168,88,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Clock size={12} style={{ color: TC.gold }} />
                                </div>
                                <div style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: TC.secondary, overflow: 'hidden' }}>
                                    <motion.div initial={{ width: 0 }} animate={{ width: `${currentProgress}%` }}
                                        transition={{ duration: 1 }}
                                        style={{ height: '100%', borderRadius: 2, backgroundColor: TC.gold }} />
                                </div>
                                <div style={{ width: 24, height: 24, borderRadius: 999, backgroundColor: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <ShieldCheck size={12} style={{ color: TC.emerald }} />
                                </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                                <span style={{ fontSize: 9, color: TC.textMuted }}>Hoje</span>
                                <span style={{ fontSize: 9, color: TC.emerald }}>{data.monthsToComplete} meses</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Contas Líquidas + Onde Guardar */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {/* Liquidez */}
                    <div style={{ ...compactCard, padding: '16px' }}>
                        <h3 style={{ fontSize: 14, fontWeight: 600, color: TC.text, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Wallet size={16} style={{ color: TC.gold }} /> Liquidez Disponível
                        </h3>
                        <div style={{
                            padding: 14, borderRadius: 10, backgroundColor: TC.secondary,
                            textAlign: 'center', marginBottom: 12,
                        }}>
                            <p style={{ fontSize: 10, color: TC.textMuted }}>Total em Contas Líquidas</p>
                            <p style={{ fontSize: 24, fontWeight: 700, color: TC.emerald }}>{fmt(data.totalLiquid)}</p>
                        </div>
                        {data.liquidAccounts.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: 12 }}>
                                <p style={{ fontSize: 12, color: TC.textMuted, marginBottom: 8 }}>Nenhuma conta líquida cadastrada</p>
                                <button onClick={() => router.push('/accounts')} style={{ ...compactBtnOut, fontSize: 11 }}>
                                    Adicionar Conta
                                </button>
                            </div>
                        ) : (
                            data.liquidAccounts.map(acc => (
                                <div key={acc.id} style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '8px 10px', borderRadius: 8, marginBottom: 4,
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <PiggyBank size={14} style={{ color: TC.textMuted }} />
                                        <div>
                                            <p style={{ fontSize: 12, fontWeight: 500, color: TC.text }}>{acc.name}</p>
                                            <p style={{ fontSize: 10, color: TC.textMuted }}>{TYPE_LABELS[acc.type] ?? acc.type}</p>
                                        </div>
                                    </div>
                                    <span style={{ fontSize: 12, fontWeight: 600, color: TC.text }}>{fmt(acc.balance)}</span>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Onde Guardar */}
                    <div style={{ ...compactCard, padding: '16px' }}>
                        <h3 style={{ fontSize: 14, fontWeight: 600, color: TC.text, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Banknote size={16} style={{ color: TC.gold }} /> Onde Guardar
                        </h3>
                        <p style={{ fontSize: 11, color: TC.textMuted, marginBottom: 12 }}>
                            Sua reserva deve ser mantida em investimentos seguros e com liquidez diária.
                        </p>
                        {data.suggestions.map((s, i) => (
                            <div key={i} style={{
                                display: 'flex', alignItems: 'center', gap: 10, padding: 10,
                                borderRadius: 8, backgroundColor: TC.secondary, marginBottom: 6,
                            }}>
                                <div style={{
                                    width: 8, height: 8, borderRadius: 999,
                                    backgroundColor: s.color, flexShrink: 0,
                                }} />
                                <div style={{ flex: 1 }}>
                                    <p style={{ fontSize: 12, fontWeight: 600, color: TC.text }}>{s.name}</p>
                                    <p style={{ fontSize: 10, color: TC.textMuted }}>{s.desc}</p>
                                </div>
                                <span style={{
                                    fontSize: 9, fontWeight: 600, padding: '2px 6px', borderRadius: 4,
                                    backgroundColor: `${s.color}15`, color: s.color,
                                }}>{s.risk}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                style={{ ...compactCard, padding: '16px', marginTop: 16 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: TC.text, marginBottom: 12 }}>Ações Rápidas</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8 }}>
                    {[
                        { label: 'Criar Meta de Reserva', icon: '🎯', href: '/goals', show: !data.hasGoal },
                        { label: 'Adicionar Conta Poupança', icon: '🏦', href: '/accounts', show: true },
                        { label: 'Ver Investimentos', icon: '📈', href: '/investments', show: true },
                        { label: 'Simular Aposentadoria', icon: '🧮', href: '/aposentadoria', show: true },
                        { label: 'Consultar IA', icon: '🤖', href: '/ai', show: true },
                    ].filter(a => a.show).map(a => (
                        <button key={a.label} onClick={() => router.push(a.href)}
                            style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: 12, borderRadius: 10, backgroundColor: TC.secondary,
                                border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left',
                                transition: 'background 0.2s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.backgroundColor = TC.muted }}
                            onMouseLeave={e => { e.currentTarget.style.backgroundColor = TC.secondary }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontSize: 16 }}>{a.icon}</span>
                                <span style={{ fontSize: 12, color: TC.text }}>{a.label}</span>
                            </div>
                            <ChevronRight size={14} style={{ color: TC.textMuted }} />
                        </button>
                    ))}
                </div>
            </motion.div>

            {/* Info Footer */}
            <div style={{ marginTop: 16, padding: '12px 16px', borderRadius: 10, backgroundColor: TC.secondary }}>
                <p style={{ fontSize: 10, color: TC.textMuted, lineHeight: 1.5 }}>
                    📊 Cálculo baseado na média de despesas dos últimos {data.monthsAnalyzed} meses.
                    {data.hasGoal
                        ? ' Usando valor da meta "Reserva de Emergência" como saldo atual.'
                        : ' Estimando 30% do saldo líquido como reserva (crie uma meta para valores mais precisos).'}
                </p>
            </div>
            <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    )
}

export default function EmergencyFundPage() {
    return (
        <ErrorBoundary fallbackTitle="Erro na Reserva de Emergência">
            <EmergencyFundContent />
        </ErrorBoundary>
    )
}
