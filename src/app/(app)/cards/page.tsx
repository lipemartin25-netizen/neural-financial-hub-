'use client'

import { motion } from 'framer-motion'
import { CreditCard, Plus, Eye, EyeOff, Calendar, AlertTriangle } from 'lucide-react'
import { useState } from 'react'
import { C, cardStyle, btnGoldStyle, btnOutlineStyle, fmt } from '@/lib/theme'

const CARDS = [
    {
        id: '1', name: 'Nubank Mastercard', last4: '4321', limit: 15000, used: 4250, closing: 8, due: 15, color: 'linear-gradient(135deg, #7c3aed, #581c87)',
        invoice: [{ desc: 'iFood', amount: 67.80, date: '28 Fev' }, { desc: 'Amazon', amount: 14.90, date: '27 Fev' }, { desc: 'Posto Shell', amount: 280, date: '26 Fev' }]
    },
    {
        id: '2', name: 'Inter Visa', last4: '8765', limit: 8000, used: 1890, closing: 1, due: 8, color: 'linear-gradient(135deg, #f97316, #c2410c)',
        invoice: [{ desc: 'Uber', amount: 45, date: '01 Mar' }, { desc: 'Spotify', amount: 34.90, date: '28 Fev' }]
    },
    {
        id: '3', name: 'Itaú Platinum', last4: '1234', limit: 25000, used: 12450, closing: 15, due: 22, color: 'linear-gradient(135deg, #1d4ed8, #1e3a5f)',
        invoice: [{ desc: 'Passagem aérea', amount: 2800, date: '20 Fev' }, { desc: 'Hotel', amount: 1450, date: '18 Fev' }]
    },
]

export default function CardsPage() {
    const [showValues, setShowValues] = useState(true)
    const [selected, setSelected] = useState(CARDS[0].id)
    const display = (v: number) => showValues ? fmt(v) : '•••••'
    const card = CARDS.find(c => c.id === selected)!
    const utilization = (card.used / card.limit) * 100

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 700, color: C.text }}>Cartões</h1>
                    <p style={{ fontSize: 14, color: C.textMuted, marginTop: 4 }}>Gerencie seus cartões de crédito</p>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <button onClick={() => setShowValues(!showValues)} style={btnOutlineStyle}>
                        {showValues ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    <button style={btnGoldStyle}><Plus size={16} /> Novo Cartão</button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24 }} className="lg:grid-cols-[2fr_3fr]">
                {/* Card Visuals */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {CARDS.map((c, i) => (
                        <motion.div key={c.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                            onClick={() => setSelected(c.id)}
                            style={{
                                background: c.color, borderRadius: 16, padding: 24, cursor: 'pointer',
                                opacity: selected === c.id ? 1 : 0.6,
                                outline: selected === c.id ? `2px solid ${C.gold}` : 'none',
                                outlineOffset: 3, transition: 'all 0.3s ease',
                            }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 32 }}>
                                <CreditCard size={28} style={{ color: 'rgba(255,255,255,0.5)' }} />
                            </div>
                            <p style={{ fontFamily: 'monospace', fontSize: 18, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.8)', marginBottom: 16 }}>
                                •••• •••• •••• {c.last4}
                            </p>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                <div>
                                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Fatura atual</p>
                                    <p style={{ fontSize: 18, fontWeight: 700, color: 'white' }}>{display(c.used)}</p>
                                </div>
                                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{c.name}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Invoice Detail */}
                <motion.div key={selected} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    style={{ ...cardStyle, padding: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
                        <div>
                            <h3 style={{ fontWeight: 600, color: C.text }}>{card.name}</h3>
                            <p style={{ fontSize: 12, color: C.textMuted }}>Fatura atual</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <p style={{ fontSize: 12, color: C.textMuted }}>Vencimento</p>
                            <p style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 14, fontWeight: 500, color: C.gold }}>
                                <Calendar size={14} /> Dia {card.due}
                            </p>
                        </div>
                    </div>

                    {/* Utilization */}
                    <div style={{ marginBottom: 24 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 8 }}>
                            <span style={{ color: C.textMuted }}>{utilization.toFixed(0)}% utilizado</span>
                            <span style={{ color: C.textMuted }}>Limite: {display(card.limit)}</span>
                        </div>
                        <div style={{ height: 10, borderRadius: 999, backgroundColor: C.secondary }}>
                            <div style={{
                                height: '100%', width: `${utilization}%`, borderRadius: 999, transition: 'width 0.8s ease',
                                background: utilization > 80 ? C.red : utilization > 60 ? C.yellow : C.goldGrad,
                            }} />
                        </div>
                        {utilization > 80 && (
                            <p style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 8, fontSize: 12, color: C.red }}>
                                <AlertTriangle size={12} /> Utilização alta!
                            </p>
                        )}
                    </div>

                    {/* Items */}
                    <h4 style={{ fontSize: 13, color: C.textMuted, marginBottom: 12 }}>Lançamentos</h4>
                    {card.invoice.map((item, i) => (
                        <div key={i} style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: 12, borderRadius: 8, backgroundColor: C.secondary, marginBottom: 8,
                        }}>
                            <div>
                                <p style={{ fontSize: 14, fontWeight: 500, color: C.text }}>{item.desc}</p>
                                <p style={{ fontSize: 11, color: C.textMuted }}>{item.date}</p>
                            </div>
                            <p style={{ fontSize: 14, fontWeight: 500, color: C.text }}>{display(item.amount)}</p>
                        </div>
                    ))}

                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: `1px solid ${C.border}`, paddingTop: 16, marginTop: 16 }}>
                        <span style={{ fontWeight: 500, color: C.textMuted }}>Total da fatura</span>
                        <span style={{ fontSize: 20, fontWeight: 700, color: C.text }}>{display(card.used)}</span>
                    </div>
                </motion.div>
            </div>
        </div>
    )
}
