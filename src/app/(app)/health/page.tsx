'use client'

import { motion } from 'framer-motion'
import { CheckCircle2, AlertTriangle, XCircle, ArrowRight, Sparkles, Zap, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'
import { C, cardStyle, cardHlStyle, btnOutlineStyle } from '@/lib/theme'

type Status = 'excellent' | 'good' | 'warning' | 'danger'
type Metric = { name: string; score: number; status: Status; detail: string; tip: string }
type Insight = { icon: string; text: string }
type Action = { label: string; priority: string; color: string; href: string }

type HealthData = {
    overallScore: number
    metrics: Metric[]
    insights: Insight[]
    actions: Action[]
}

const STATUS_CFG = {
    excellent: { label: 'Excelente', color: C.emerald, Icon: CheckCircle2 },
    good: { label: 'Bom', color: C.blue, Icon: CheckCircle2 },
    warning: { label: 'Atenção', color: C.yellow, Icon: AlertTriangle },
    danger: { label: 'Crítico', color: C.red, Icon: XCircle },
}

export default function HealthPage() {
    const router = useRouter()
    const [data, setData] = useState<HealthData | null>(null)
    const [loading, setLoading] = useState(true)

    const fetchData = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/health')
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
            <div>
                <h1 style={{ fontSize: 24, fontWeight: 700, color: C.text, marginBottom: 8 }}>Saúde Financeira</h1>
                <p style={{ fontSize: 14, color: C.textMuted, marginBottom: 24 }}>Analisando suas finanças...</p>
                <div style={{ ...cardStyle, padding: 80, display: 'flex', justifyContent: 'center' }}>
                    <Loader2 size={32} style={{ color: C.gold, animation: 'spin 1s linear infinite' }} />
                </div>
                <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        )
    }

    if (!data) {
        return (
            <div>
                <h1 style={{ fontSize: 24, fontWeight: 700, color: C.text }}>Saúde Financeira</h1>
                <div style={{ ...cardStyle, padding: 40, textAlign: 'center', marginTop: 24 }}>
                    <p style={{ color: C.textMuted }}>Erro ao carregar diagnóstico.</p>
                    <button onClick={fetchData} style={{ ...btnOutlineStyle, marginTop: 16 }}>Tentar novamente</button>
                </div>
            </div>
        )
    }

    const { overallScore, metrics, insights, actions } = data
    const overallColor = overallScore >= 80 ? C.emerald : overallScore >= 65 ? C.blue : overallScore >= 45 ? C.yellow : C.red
    const overallLabel = overallScore >= 80 ? 'Excelente' : overallScore >= 65 ? 'Bom' : overallScore >= 45 ? 'Atenção' : 'Crítico'
    const r = 70, circ = 2 * Math.PI * r, offset = circ - (overallScore / 100) * circ

    return (
        <div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <h1 style={{ fontSize: 24, fontWeight: 700, color: C.text }}>Saúde Financeira</h1>
                <p style={{ fontSize: 14, color: C.textMuted, marginTop: 4 }}>Diagnóstico completo baseado nos seus dados reais</p>
            </motion.div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, marginTop: 24 }}>
                {/* Score Ring */}
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    style={{ ...cardHlStyle, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
                    <div style={{ position: 'relative', width: 180, height: 180 }}>
                        <svg width="180" height="180" style={{ transform: 'rotate(-90deg)' }}>
                            <circle cx="90" cy="90" r={r} fill="none" stroke={C.muted} strokeWidth="10" />
                            <motion.circle cx="90" cy="90" r={r} fill="none" stroke={overallColor} strokeWidth="10" strokeLinecap="round"
                                strokeDasharray={circ} initial={{ strokeDashoffset: circ }} animate={{ strokeDashoffset: offset }}
                                transition={{ duration: 1.5, delay: 0.3 }} />
                        </svg>
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontSize: 42, fontWeight: 700, color: overallColor }}>{overallScore}</span>
                            <span style={{ fontSize: 12, color: C.textMuted }}>de 100</span>
                        </div>
                    </div>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 16, padding: '6px 16px', borderRadius: 999, backgroundColor: `${overallColor}15` }}>
                        {overallScore >= 65 ? <CheckCircle2 size={14} style={{ color: overallColor }} /> : <AlertTriangle size={14} style={{ color: overallColor }} />}
                        <span style={{ fontSize: 14, fontWeight: 500, color: overallColor }}>{overallLabel}</span>
                    </div>
                </motion.div>

                {/* Insights da IA */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                    style={{ ...cardStyle, padding: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                        <Sparkles size={18} style={{ color: C.gold }} />
                        <h3 style={{ fontWeight: 600, color: C.text }}>Insights</h3>
                    </div>
                    {insights.map((ins, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: 14, borderRadius: 12, backgroundColor: C.secondary, marginBottom: 8 }}>
                            <span style={{ fontSize: 18, flexShrink: 0 }}>{ins.icon}</span>
                            <p style={{ fontSize: 13, color: 'rgba(235,230,218,0.8)', lineHeight: 1.5 }}>{ins.text}</p>
                        </div>
                    ))}
                    <button onClick={() => router.push('/ai')} style={{
                        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        marginTop: 8, padding: '10px 0', borderRadius: 12, border: 'none', cursor: 'pointer',
                        backgroundColor: 'rgba(201,168,88,0.05)', color: C.gold, fontSize: 13, fontWeight: 500,
                    }}>
                        <Zap size={14} /> Análise detalhada com IA
                    </button>
                </motion.div>
            </div>

            {/* Métricas individuais */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginTop: 24 }}>
                {metrics.map((m, i) => {
                    const cfg = STATUS_CFG[m.status]
                    return (
                        <motion.div key={m.name} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.05 }}
                            style={{ ...cardStyle, padding: 20 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <cfg.Icon size={16} style={{ color: cfg.color }} />
                                    <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{m.name}</span>
                                </div>
                                <span style={{ fontSize: 18, fontWeight: 700, color: cfg.color }}>{m.score}</span>
                            </div>
                            <div style={{ height: 8, borderRadius: 999, backgroundColor: C.secondary, marginBottom: 12 }}>
                                <motion.div initial={{ width: 0 }} animate={{ width: `${m.score}%` }}
                                    transition={{ duration: 0.8, delay: 0.4 + i * 0.05 }}
                                    style={{ height: '100%', borderRadius: 999, backgroundColor: cfg.color }} />
                            </div>
                            <p style={{ fontSize: 12, color: 'rgba(235,230,218,0.7)', marginBottom: 8 }}>{m.detail}</p>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, padding: 8, borderRadius: 8, backgroundColor: C.secondary }}>
                                <Sparkles size={11} style={{ color: 'rgba(201,168,88,0.5)', marginTop: 2, flexShrink: 0 }} />
                                <p style={{ fontSize: 11, color: C.textMuted }}>{m.tip}</p>
                            </div>
                        </motion.div>
                    )
                })}
            </div>

            {/* Ações Recomendadas */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
                style={{ ...cardStyle, padding: 24, marginTop: 24 }}>
                <h3 style={{ fontWeight: 600, color: C.text, marginBottom: 16 }}>Ações Recomendadas</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 12 }}>
                    {actions.map(a => (
                        <button key={a.label} onClick={() => router.push(a.href)} style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16,
                            borderRadius: 12, backgroundColor: C.secondary, border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left',
                            transition: 'all 0.2s',
                        }}
                            onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.muted }}
                            onMouseLeave={e => { e.currentTarget.style.backgroundColor = C.secondary }}
                        >
                            <div>
                                <p style={{ fontSize: 14, fontWeight: 500, color: C.text }}>{a.label}</p>
                                <span style={{ display: 'inline-block', marginTop: 4, padding: '2px 8px', borderRadius: 999, fontSize: 10, fontWeight: 500, color: a.color, backgroundColor: `${a.color}15` }}>
                                    {a.priority}
                                </span>
                            </div>
                            <ArrowRight size={14} style={{ color: C.textMuted }} />
                        </button>
                    ))}
                </div>
            </motion.div>
        </div>
    )
}
