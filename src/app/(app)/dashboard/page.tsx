'use client'

import { motion } from 'framer-motion'
import {
    Wallet, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
    CreditCard, Target, Bell, Eye, EyeOff, Sparkles,
} from 'lucide-react'
import { useState } from 'react'
import { C, cardStyle, cardHlStyle, fmt } from '@/lib/theme'
import GoldText from '@/components/GoldText'

const SUMMARY = [
    { label: 'Saldo Total', value: 265321.25, icon: Wallet, color: C.gold, positive: true },
    { label: 'Receitas (mês)', value: 17200, icon: ArrowUpRight, color: C.emerald, positive: true },
    { label: 'Despesas (mês)', value: 10300, icon: ArrowDownRight, color: C.red, positive: false },
    { label: 'Investimentos', value: 188400, icon: TrendingUp, color: C.blue, positive: true },
]

const RECENT_TX = [
    { name: 'Salário', desc: 'Empresa XYZ', amount: 12500, type: 'in', icon: '💰', date: 'Hoje' },
    { name: 'Aluguel', desc: 'Apartamento', amount: 2800, type: 'out', icon: '🏠', date: 'Hoje' },
    { name: 'Supermercado', desc: 'Carrefour', amount: 487.32, type: 'out', icon: '🍔', date: 'Ontem' },
    { name: 'Freelance', desc: 'Projeto App', amount: 4500, type: 'in', icon: '💻', date: 'Ontem' },
    { name: 'Netflix', desc: 'Assinatura', amount: 55.90, type: 'out', icon: '📱', date: '27 Fev' },
]

const GOALS_PREVIEW = [
    { name: 'Viagem Europa', pct: 74, color: C.blue },
    { name: 'Reserva Emergência', pct: 90, color: C.emerald },
    { name: 'Carro Novo', pct: 40, color: C.violet },
]

export default function DashboardPage() {
    const [showValues, setShowValues] = useState(true)
    const display = (v: number) => showValues ? fmt(v) : '•••••'

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <h1 style={{ fontSize: 24, fontWeight: 700, color: C.text }}>Bem-vindo de volta 👋</h1>
                    <p style={{ fontSize: 14, color: C.textMuted, marginTop: 4 }}>Aqui está o resumo das suas finanças</p>
                </motion.div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <button onClick={() => setShowValues(!showValues)} style={{
                        ...{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'transparent', color: C.gold, fontWeight: 600, border: `1px solid rgba(201,168,88,0.3)`, borderRadius: 10, padding: '8px 16px', cursor: 'pointer', fontSize: 13 }
                    }}>
                        {showValues ? <EyeOff size={16} /> : <Eye size={16} />}
                        {showValues ? 'Ocultar' : 'Mostrar'}
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
                {SUMMARY.map((s, i) => {
                    const Icon = s.icon
                    return (
                        <motion.div
                            key={s.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.08 }}
                            style={{ ...cardStyle, padding: 20 }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                <span style={{ fontSize: 13, color: C.textMuted }}>{s.label}</span>
                                <Icon size={16} style={{ color: s.color }} />
                            </div>
                            <p style={{ fontSize: 22, fontWeight: 700, color: s.label === 'Saldo Total' ? C.gold : s.positive ? C.emerald : C.red }}>
                                {display(s.value)}
                            </p>
                        </motion.div>
                    )
                })}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24, ...(typeof window !== 'undefined' && window.innerWidth >= 1024 ? { gridTemplateColumns: '2fr 1fr' } : {}) }}>
                {/* Recent Transactions */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                    style={{ ...cardStyle, padding: 24 }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 600, color: C.text }}>Últimas Transações</h3>
                        <a href="/transactions" style={{ fontSize: 12, color: C.gold, textDecoration: 'none' }}>Ver todas →</a>
                    </div>

                    {RECENT_TX.map((tx, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.35 + i * 0.05 }}
                            style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '12px 0',
                                borderBottom: i < RECENT_TX.length - 1 ? `1px solid ${C.border}` : 'none',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{
                                    width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    backgroundColor: tx.type === 'in' ? 'rgba(201,168,88,0.08)' : C.secondary, fontSize: 18,
                                }}>
                                    {tx.icon}
                                </div>
                                <div>
                                    <p style={{ fontSize: 14, fontWeight: 500, color: C.text }}>{tx.name}</p>
                                    <p style={{ fontSize: 12, color: C.textMuted }}>{tx.desc} · {tx.date}</p>
                                </div>
                            </div>
                            <p style={{ fontSize: 14, fontWeight: 600, color: tx.type === 'in' ? C.emerald : C.text }}>
                                {tx.type === 'in' ? '+' : '-'}{display(tx.amount)}
                            </p>
                        </motion.div>
                    ))}
                </motion.div>

                {/* Right Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    {/* Goals */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                        style={{ ...cardStyle, padding: 24 }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <h3 style={{ fontSize: 16, fontWeight: 600, color: C.text }}>Metas</h3>
                            <a href="/goals" style={{ fontSize: 12, color: C.gold, textDecoration: 'none' }}>Ver todas →</a>
                        </div>

                        {GOALS_PREVIEW.map((g, i) => (
                            <div key={g.name} style={{ marginBottom: i < GOALS_PREVIEW.length - 1 ? 16 : 0 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                    <span style={{ fontSize: 13, color: C.text }}>{g.name}</span>
                                    <span style={{ fontSize: 12, fontWeight: 600, color: g.color }}>{g.pct}%</span>
                                </div>
                                <div style={{ height: 6, borderRadius: 999, backgroundColor: C.secondary }}>
                                    <div style={{ height: '100%', width: `${g.pct}%`, borderRadius: 999, background: g.color, transition: 'width 1s ease' }} />
                                </div>
                            </div>
                        ))}
                    </motion.div>

                    {/* AI Insight */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                        style={{ ...cardHlStyle, padding: 24 }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                            <Sparkles size={16} style={{ color: C.gold }} />
                            <h3 style={{ fontSize: 14, fontWeight: 600, color: C.gold }}>Insight da IA</h3>
                        </div>
                        <p style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.6 }}>
                            Seus gastos com alimentação subiram 18% vs mês passado. Movendo R$ 5k da poupança para Tesouro Selic, você ganharia R$ 42/mês a mais.
                        </p>
                        <a href="/ai" style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 12,
                            fontSize: 12, fontWeight: 600, color: C.gold, textDecoration: 'none',
                        }}>
                            <Sparkles size={12} /> Ver análise completa
                        </a>
                    </motion.div>
                </div>
            </div>
        </div>
    )
}
