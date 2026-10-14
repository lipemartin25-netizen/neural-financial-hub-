'use client'

import { motion } from 'framer-motion'
import { useState, useMemo } from 'react'
import { Target, TrendingDown, Zap, Snowflake, Calculator, ArrowRight, Plus, Trash2 } from 'lucide-react'
import { C, cardStyle, cardHlStyle, inputStyle, btnGoldStyle, btnOutlineStyle, fmt } from '@/lib/theme'
import GoldText from '@/components/GoldText'

type Debt = {
    id: string; name: string; balance: number; rate: number; minPayment: number
}

type PayoffResult = {
    name: string; months: number; totalPaid: number; totalInterest: number
}

function calculatePayoff(debts: Debt[], extraPayment: number, strategy: 'avalanche' | 'snowball'): {
    results: PayoffResult[]; totalMonths: number; totalPaid: number; totalInterest: number
} {
    if (debts.length === 0) return { results: [], totalMonths: 0, totalPaid: 0, totalInterest: 0 }

    const sorted = [...debts].sort((a, b) =>
        strategy === 'avalanche' ? b.rate - a.rate : a.balance - b.balance
    )

    const results: PayoffResult[] = []
    let remaining = sorted.map(d => ({ ...d, currentBalance: d.balance }))
    let totalMonths = 0
    let totalPaid = 0
    const maxMonths = 360

    while (remaining.some(d => d.currentBalance > 0) && totalMonths < maxMonths) {
        totalMonths++
        let extra = extraPayment

        for (const debt of remaining) {
            if (debt.currentBalance <= 0) continue

            const monthlyRate = debt.rate / 100 / 12
            const interest = debt.currentBalance * monthlyRate
            let payment = debt.minPayment + (remaining[0].id === debt.id ? extra : 0)

            if (payment > debt.currentBalance + interest) {
                payment = debt.currentBalance + interest
                if (remaining[0].id === debt.id) {
                    extra = extra - (payment - debt.minPayment)
                }
            }

            debt.currentBalance = debt.currentBalance + interest - payment
            totalPaid += payment

            if (debt.currentBalance <= 0.01) {
                debt.currentBalance = 0
                const existing = results.find(r => r.name === debt.name)
                if (!existing) {
                    results.push({
                        name: debt.name, months: totalMonths,
                        totalPaid: 0, totalInterest: 0,
                    })
                }
                // Liberar min payment como extra para próxima
                extra += debt.minPayment
            }
        }

        remaining = remaining.filter(d => d.currentBalance > 0)
    }

    const totalBalance = debts.reduce((s, d) => s + d.balance, 0)
    const totalInterest = totalPaid - totalBalance

    return {
        results: results.map(r => ({ ...r, totalPaid, totalInterest })),
        totalMonths, totalPaid, totalInterest,
    }
}

export default function DebtPlannerPage() {
    const [debts, setDebts] = useState<Debt[]>([
        { id: '1', name: 'Cartão de Crédito', balance: 5000, rate: 15, minPayment: 250 },
        { id: '2', name: 'Empréstimo Pessoal', balance: 12000, rate: 3.5, minPayment: 500 },
    ])
    const [extraPayment, setExtraPayment] = useState(200)
    const [strategy, setStrategy] = useState<'avalanche' | 'snowball'>('avalanche')
    const [newName, setNewName] = useState('')
    const [newBalance, setNewBalance] = useState('')
    const [newRate, setNewRate] = useState('')
    const [newMin, setNewMin] = useState('')

    const result = useMemo(() => calculatePayoff(debts, extraPayment, strategy), [debts, extraPayment, strategy])
    const resultMin = useMemo(() => calculatePayoff(debts, 0, strategy), [debts, strategy])

    const addDebt = () => {
        if (!newName || !newBalance) return
        setDebts(prev => [...prev, {
            id: Date.now().toString(), name: newName,
            balance: parseFloat(newBalance) || 0, rate: parseFloat(newRate) || 0,
            minPayment: parseFloat(newMin) || 0,
        }])
        setNewName(''); setNewBalance(''); setNewRate(''); setNewMin('')
    }

    const removeDebt = (id: string) => setDebts(prev => prev.filter(d => d.id !== id))

    const totalDebt = debts.reduce((s, d) => s + d.balance, 0)
    const monthsSaved = resultMin.totalMonths - result.totalMonths
    const interestSaved = resultMin.totalInterest - result.totalInterest

    return (
        <div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: 24, fontWeight: 700, color: C.text }}>
                    <TrendingDown size={22} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle', color: C.gold }} />
                    Plano de Quitação
                </h1>
                <p style={{ fontSize: 14, color: C.textMuted, marginTop: 4 }}>Elimine suas dívidas com estratégias inteligentes</p>
            </motion.div>

            {/* Strategy Selector */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
                {[
                    { v: 'avalanche' as const, icon: Zap, label: 'Avalanche', desc: 'Paga maior juros primeiro — economiza mais' },
                    { v: 'snowball' as const, icon: Snowflake, label: 'Bola de Neve', desc: 'Paga menor saldo primeiro — motivação rápida' },
                ].map(s => (
                    <motion.button key={s.v} onClick={() => setStrategy(s.v)}
                        whileHover={{ scale: 1.02 }}
                        style={{
                            flex: 1, padding: 20, borderRadius: 16, cursor: 'pointer', textAlign: 'left',
                            background: strategy === s.v ? C.cardHlGrad : C.cardGrad,
                            border: `1px solid ${strategy === s.v ? 'rgba(201,168,88,0.3)' : C.borderGold}`,
                        }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <s.icon size={18} style={{ color: strategy === s.v ? C.gold : C.textMuted }} />
                            <span style={{ fontSize: 14, fontWeight: 600, color: strategy === s.v ? C.gold : C.text }}>{s.label}</span>
                        </div>
                        <p style={{ fontSize: 12, color: C.textMuted }}>{s.desc}</p>
                    </motion.button>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 24 }}>
                {/* Left — Debts List */}
                <div>
                    <div style={{ ...cardStyle, padding: 24, marginBottom: 16 }}>
                        <h3 style={{ fontSize: 15, fontWeight: 600, color: C.text, marginBottom: 16 }}>Suas Dívidas</h3>

                        {debts.map(d => (
                            <div key={d.id} style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: 12, borderRadius: 10, backgroundColor: C.secondary, marginBottom: 8,
                            }}>
                                <div>
                                    <p style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{d.name}</p>
                                    <p style={{ fontSize: 11, color: C.textMuted }}>
                                        {fmt(d.balance)} · {d.rate}% a.m. · Mín: {fmt(d.minPayment)}
                                    </p>
                                </div>
                                <button onClick={() => removeDebt(d.id)}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(248,113,113,0.5)', padding: 4 }}
                                    onMouseEnter={e => e.currentTarget.style.color = C.red}
                                    onMouseLeave={e => e.currentTarget.style.color = 'rgba(248,113,113,0.5)'}>
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}

                        {/* Add debt */}
                        <div style={{ marginTop: 16, padding: 12, borderRadius: 10, border: `1px dashed ${C.border}` }}>
                            <p style={{ fontSize: 12, fontWeight: 600, color: C.textMuted, marginBottom: 8 }}>Adicionar dívida</p>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Nome" style={{ ...inputStyle, padding: '8px 12px', fontSize: 12 }} />
                                <input type="number" value={newBalance} onChange={e => setNewBalance(e.target.value)} placeholder="Saldo (R$)" style={{ ...inputStyle, padding: '8px 12px', fontSize: 12 }} />
                                <input type="number" value={newRate} onChange={e => setNewRate(e.target.value)} placeholder="Juros % a.m." style={{ ...inputStyle, padding: '8px 12px', fontSize: 12 }} step="0.1" />
                                <input type="number" value={newMin} onChange={e => setNewMin(e.target.value)} placeholder="Pgto mínimo" style={{ ...inputStyle, padding: '8px 12px', fontSize: 12 }} />
                            </div>
                            <button onClick={addDebt} style={{ ...btnOutlineStyle, marginTop: 8, width: '100%', padding: '8px 0', fontSize: 12 }}>
                                <Plus size={14} /> Adicionar
                            </button>
                        </div>
                    </div>

                    {/* Extra payment */}
                    <div style={{ ...cardStyle, padding: 24 }}>
                        <h3 style={{ fontSize: 15, fontWeight: 600, color: C.text, marginBottom: 8 }}>Pagamento Extra Mensal</h3>
                        <p style={{ fontSize: 12, color: C.textMuted, marginBottom: 12 }}>Quanto a mais você pode pagar por mês?</p>
                        <input type="number" value={extraPayment} onChange={e => setExtraPayment(parseFloat(e.target.value) || 0)}
                            style={{ ...inputStyle, fontSize: 20, fontWeight: 700, textAlign: 'center' }} step="50" />
                        <div style={{ display: 'flex', gap: 6, marginTop: 8, justifyContent: 'center' }}>
                            {[100, 200, 500, 1000].map(v => (
                                <button key={v} onClick={() => setExtraPayment(v)} style={{
                                    padding: '4px 10px', borderRadius: 6, fontSize: 11, cursor: 'pointer',
                                    backgroundColor: extraPayment === v ? 'rgba(201,168,88,0.1)' : C.secondary,
                                    border: extraPayment === v ? '1px solid rgba(201,168,88,0.3)' : `1px solid transparent`,
                                    color: extraPayment === v ? C.gold : C.textMuted,
                                }}>R$ {v}</button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right — Results */}
                <div>
                    {/* Hero Result */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        style={{ ...cardHlStyle, padding: 24, textAlign: 'center', marginBottom: 16 }}>
                        <Calculator size={20} style={{ color: C.gold, margin: '0 auto 12px' }} />
                        <p style={{ fontSize: 13, color: C.textMuted }}>Dívida total</p>
                        <p style={{ fontSize: 32, fontWeight: 700, marginTop: 4 }}><GoldText>{fmt(totalDebt)}</GoldText></p>
                        <div style={{ height: 1, backgroundColor: C.border, margin: '16px 0' }} />
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            <div>
                                <p style={{ fontSize: 11, color: C.textMuted }}>Livre em</p>
                                <p style={{ fontSize: 24, fontWeight: 700, color: C.emerald }}>{result.totalMonths} <span style={{ fontSize: 12 }}>meses</span></p>
                            </div>
                            <div>
                                <p style={{ fontSize: 11, color: C.textMuted }}>Total de Juros</p>
                                <p style={{ fontSize: 24, fontWeight: 700, color: C.red }}>{fmt(result.totalInterest)}</p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Savings */}
                    {monthsSaved > 0 && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                            style={{ ...cardStyle, padding: 20, marginBottom: 16, borderLeft: `3px solid ${C.emerald}` }}>
                            <p style={{ fontSize: 14, fontWeight: 600, color: C.emerald }}>
                                🎉 Pagando {fmt(extraPayment)} extra/mês você economiza:
                            </p>
                            <div style={{ display: 'flex', gap: 24, marginTop: 8 }}>
                                <div>
                                    <p style={{ fontSize: 20, fontWeight: 700, color: C.emerald }}>{monthsSaved} meses</p>
                                    <p style={{ fontSize: 11, color: C.textMuted }}>mais rápido</p>
                                </div>
                                <div>
                                    <p style={{ fontSize: 20, fontWeight: 700, color: C.emerald }}>{fmt(interestSaved)}</p>
                                    <p style={{ fontSize: 11, color: C.textMuted }}>menos juros</p>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Payoff Order */}
                    <div style={{ ...cardStyle, padding: 24 }}>
                        <h3 style={{ fontSize: 15, fontWeight: 600, color: C.text, marginBottom: 16 }}>
                            Ordem de Quitação ({strategy === 'avalanche' ? 'Avalanche' : 'Bola de Neve'})
                        </h3>
                        {result.results.map((r, i) => (
                            <div key={r.name} style={{
                                display: 'flex', alignItems: 'center', gap: 12, padding: 12,
                                borderRadius: 10, backgroundColor: i === 0 ? 'rgba(201,168,88,0.05)' : 'transparent',
                                marginBottom: 4,
                            }}>
                                <div style={{
                                    width: 28, height: 28, borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    backgroundColor: i === 0 ? 'rgba(201,168,88,0.15)' : C.secondary,
                                    fontSize: 12, fontWeight: 700, color: i === 0 ? C.gold : C.textMuted,
                                }}>{i + 1}</div>
                                <div style={{ flex: 1 }}>
                                    <p style={{ fontSize: 13, fontWeight: 500, color: C.text }}>{r.name}</p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <p style={{ fontSize: 13, fontWeight: 600, color: C.emerald }}>{r.months} meses</p>
                                </div>
                                {i < result.results.length - 1 && <ArrowRight size={12} style={{ color: C.textMuted2 }} />}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
