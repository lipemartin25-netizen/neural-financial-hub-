'use client'

import { motion } from 'framer-motion'
import {
    Target, TrendingUp, Shield, ArrowUpRight, ArrowDownRight,
    Sparkles, RefreshCw, ChevronRight, PieChart, Wallet, Plus
} from 'lucide-react'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { C, cardStyle, cardHlStyle, btnGoldStyle, btnOutlineStyle, fmt } from '@/lib/theme'
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { toast } from 'sonner'

export default function WealthLabPage() {
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState<any>(null)

    const fetchInsights = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/predictive')
            const json = await res.json()
            if (json.error) throw new Error(json.error)
            setData(json.data)
        } catch (err: any) {
            toast.error(err.message || 'Falha ao carregar laboratório')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { fetchInsights() }, [fetchInsights])

    const display = (v: number) => fmt(v)

    // Dados para o gráfico Recharts
    const chartData = useMemo(() => {
        if (!data) return []
        const base = data.currentBalance || 0
        const forecast = data.forecastNext30Days || 0
        return [
            { name: 'Hoje', value: base },
            { name: 'Sem. 1', value: base + forecast * 0.25 },
            { name: 'Sem. 2', value: base + forecast * 0.5 },
            { name: 'Sem. 3', value: base + forecast * 0.75 },
            { name: 'Sem. 4', value: base + forecast }
        ]
    }, [data])

    if (loading) {
        return (
            <div style={{ padding: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
                <RefreshCw size={40} style={{ color: C.gold, animation: 'spin 2s linear infinite' }} />
                <p style={{ marginTop: 20, color: C.textMuted, fontSize: 16, textAlign: 'center' }}>Nexus AI está processando seus dados financeiros...</p>
                <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        )
    }

    return (
        <div style={{ padding: '0 0 40px' }}>
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 30 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <div style={{ padding: 8, borderRadius: 10, background: 'rgba(201,168,88,0.1)', color: C.gold }}>
                        <Target size={24} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: 28, fontWeight: 800, color: C.text }}>Wealth Lab</h1>
                        <p style={{ fontSize: 14, color: C.textMuted }}>Sua liberdade financeira, simulada por Inteligência Artificial</p>
                    </div>
                </div>
            </motion.div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }} className="lg:grid-cols-[1.8fr_1fr]">

                {/* Coluna Esquerda: Projeção & Gráfico */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

                    {/* Card de Projeção Principal */}
                    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
                        style={{ ...cardHlStyle, padding: 30, background: 'linear-gradient(135deg, rgba(201,168,88,0.1) 0%, rgba(10,10,10,1) 100%)' }}>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                            <div>
                                <p style={{ fontSize: 14, color: C.textMuted, marginBottom: 6 }}>Patrimônio Projetado (30 dias)</p>
                                <h2 style={{ fontSize: 42, fontWeight: 900, color: C.text }}>{display((data?.currentBalance || 0) + (data?.forecastNext30Days || 0))}</h2>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
                                    <span style={{
                                        padding: '4px 8px', borderRadius: 6, fontSize: 12, fontWeight: 700,
                                        backgroundColor: (data?.forecastNext30Days || 0) >= 0 ? 'rgba(52,211,153,0.1)' : 'rgba(239,68,68,0.1)',
                                        color: (data?.forecastNext30Days || 0) >= 0 ? C.emerald : C.red,
                                        display: 'inline-flex', alignItems: 'center', gap: 4
                                    }}>
                                        {(data?.forecastNext30Days || 0) >= 0 ? <TrendingUp size={12} /> : <ArrowDownRight size={12} />}
                                        {display(Math.abs(data?.forecastNext30Days || 0))}
                                    </span>
                                    <span style={{ fontSize: 12, color: C.textMuted }}>Variação estimada</span>
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <p style={{ fontSize: 12, color: C.textMuted, marginBottom: 4 }}>Score Nexus</p>
                                <div style={{ fontSize: 24, fontWeight: 800, color: C.gold }}>{data?.investmentScore || 0}</div>
                                <div style={{ width: 60, height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden', marginTop: 4 }}>
                                    <div style={{ width: `${data?.investmentScore || 0}%`, height: '100%', background: C.gold }} />
                                </div>
                            </div>
                        </div>

                        <div style={{ height: 300, width: '100%', marginTop: 20 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={C.gold} stopOpacity={0.3} />
                                            <stop offset="95%" stopColor={C.gold} stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: C.textMuted, fontSize: 10 }} />
                                    <YAxis hide />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                        formatter={((v: any) => [display(Number(v)), 'Saldo']) as any}
                                    />
                                    <Area type="monotone" dataKey="value" stroke={C.gold} fillOpacity={1} fill="url(#colorValue)" strokeWidth={3} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 24 }}>
                            <div style={{ padding: 16, borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.border}` }}>
                                <p style={{ fontSize: 12, color: C.textMuted, marginBottom: 4 }}>Saldo Atual</p>
                                <p style={{ fontSize: 18, fontWeight: 700, color: C.text }}>{display(data?.currentBalance || 0)}</p>
                            </div>
                            <div style={{ padding: 16, borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.border}` }}>
                                <p style={{ fontSize: 12, color: C.textMuted, marginBottom: 4 }}>Tendência Mensal</p>
                                <p style={{ fontSize: 18, fontWeight: 700, color: C.gold }}>{data?.monthlyTrend || 'Estável'}</p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Alertas e Riscos */}
                    <div style={{ ...cardStyle, padding: 24 }}>
                        <h3 style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Shield size={18} style={{ color: C.red }} /> Análise de Risco
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {data?.riskAlerts?.length > 0 ? data.riskAlerts.map((risk: string, i: number) => (
                                <div key={i} style={{
                                    padding: 16, borderRadius: 12, backgroundColor: 'rgba(239,68,68,0.05)',
                                    border: '1px solid rgba(239,68,68,0.15)', display: 'flex', gap: 12
                                }}>
                                    <div style={{ color: C.red, marginTop: 2 }}><ArrowDownRight size={16} /></div>
                                    <p style={{ fontSize: 13, color: 'rgba(239,68,68,0.9)', lineHeight: 1.5 }}>{risk}</p>
                                </div>
                            )) : (
                                <div style={{
                                    padding: 16, borderRadius: 12, backgroundColor: 'rgba(52,211,153,0.05)',
                                    border: '1px solid rgba(52,211,153,0.15)', display: 'flex', gap: 12
                                }}>
                                    <div style={{ color: C.emerald, marginTop: 2 }}><Shield size={16} /></div>
                                    <p style={{ fontSize: 13, color: 'rgba(52,211,153,0.9)', lineHeight: 1.5 }}>Nenhum risco crítico detectado para os próximos 30 dias. Excelente gestão!</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Coluna Direita: Recomendações & Metas */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

                    {/* Insights Hub */}
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
                        style={{ ...cardStyle, padding: 24, background: 'rgba(201,168,88,0.02)' }}>
                        <h3 style={{ fontSize: 18, fontWeight: 700, color: C.gold, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Sparkles size={18} /> Nexus Insights
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {data?.savingsRecommendations?.map((rec: string, i: number) => (
                                <div key={i} style={{
                                    padding: 16, borderRadius: 12, backgroundColor: C.secondary,
                                    border: `1px solid ${C.border}`, position: 'relative', overflow: 'hidden'
                                }}>
                                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: C.gold }} />
                                    <p style={{ fontSize: 13, color: C.text, lineHeight: 1.6 }}>{rec}</p>
                                    <button style={{
                                        marginTop: 12, fontSize: 11, fontWeight: 700, color: C.gold,
                                        background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
                                    }}>
                                        Aplicar Agora <ChevronRight size={12} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Wealth Score breakdown */}
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
                        style={{ ...cardStyle, padding: 24 }}>
                        <h3 style={{ fontSize: 17, fontWeight: 700, color: C.text, marginBottom: 16 }}>Health Check</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            <ScoreRow label="Liquidez" value={75} color={C.emerald} />
                            <ScoreRow label="Diversificação" value={45} color={C.gold} />
                            <ScoreRow label="Taxa de Poupança" value={60} color={C.blue} />
                            <ScoreRow label="Controle de Dívida" value={90} color={C.emerald} />
                        </div>
                        <div style={{ marginTop: 24, padding: 16, borderRadius: 12, background: C.secondary, textAlign: 'center' }}>
                            <p style={{ fontSize: 11, color: C.textMuted, marginBottom: 8 }}>Próximo Nível</p>
                            <p style={{ fontSize: 14, fontWeight: 600, color: C.text }}>Mestre das Finanças</p>
                            <div style={{ width: '100%', height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 2, marginTop: 10 }}>
                                <div style={{ width: '70%', height: '100%', background: C.goldGrad, borderRadius: 2 }} />
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    )
}

function ScoreRow({ label, value, color }: { label: string, value: number, color: string }) {
    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: C.textMuted }}>{label}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color }}>{value}%</span>
            </div>
            <div style={{ width: '100%', height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 2 }}>
                <div style={{ width: `${value}%`, height: '100%', backgroundColor: color, borderRadius: 2 }} />
            </div>
        </div>
    )
}
