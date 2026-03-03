'use client'

import { motion } from 'framer-motion'
import { Building2, PiggyBank, TrendingUp, Wallet, Plus, Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { C, cardStyle, cardHlStyle, btnGoldStyle, btnOutlineStyle, fmt } from '@/lib/theme'
import GoldText from '@/components/GoldText'

const ICON_MAP: Record<string, any> = { checking: Building2, savings: PiggyBank, investment: TrendingUp, cash: Wallet }
const TYPE_MAP: Record<string, string> = { checking: 'Conta Corrente', savings: 'Poupança', investment: 'Investimento', cash: 'Dinheiro' }

const ACCOUNTS = [
    { id: '1', name: 'Nubank', type: 'checking', institution: 'Nubank', balance: 12450.80, color: '#8B5CF6' },
    { id: '2', name: 'Itaú', type: 'checking', institution: 'Itaú Unibanco', balance: 8320.45, color: '#003399' },
    { id: '3', name: 'Inter', type: 'checking', institution: 'Banco Inter', balance: 3200, color: '#FF7A00' },
    { id: '4', name: 'Poupança BB', type: 'savings', institution: 'Banco do Brasil', balance: 45000, color: '#FFEF00' },
    { id: '5', name: 'XP', type: 'investment', institution: 'XP Investimentos', balance: 128500, color: '#1D1D1B' },
    { id: '6', name: 'Tesouro Direto', type: 'investment', institution: 'Tesouro Nacional', balance: 67800, color: '#009B3A' },
    { id: '7', name: 'Carteira', type: 'cash', institution: '', balance: 350, color: '#6B7280' },
]

export default function AccountsPage() {
    const [showValues, setShowValues] = useState(true)
    const display = (v: number) => showValues ? fmt(v) : '•••••'
    const total = ACCOUNTS.reduce((s, a) => s + a.balance, 0)

    const byType: Record<string, typeof ACCOUNTS> = {}
    ACCOUNTS.forEach(a => { if (!byType[a.type]) byType[a.type] = []; byType[a.type].push(a) })

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <h1 style={{ fontSize: 24, fontWeight: 700, color: C.text }}>Saldos & Bancos</h1>
                    <p style={{ fontSize: 14, color: C.textMuted, marginTop: 4 }}>Todas as suas contas em um só lugar</p>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <button onClick={() => setShowValues(!showValues)} style={btnOutlineStyle}>
                        {showValues ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    <button style={btnGoldStyle}><Plus size={16} /> Nova Conta</button>
                </div>
            </div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ ...cardHlStyle, padding: 32, textAlign: 'center', marginBottom: 32 }}>
                <p style={{ fontSize: 14, color: C.textMuted }}>Patrimônio Total</p>
                <p style={{ fontSize: 36, fontWeight: 700, marginTop: 4 }}><GoldText>{display(total)}</GoldText></p>
                <p style={{ fontSize: 12, color: C.textMuted, marginTop: 8 }}>{ACCOUNTS.length} contas conectadas</p>
            </motion.div>

            {Object.entries(byType).map(([type, accounts], gi) => {
                const Icon = ICON_MAP[type] || Wallet
                return (
                    <div key={type} style={{ marginBottom: 32 }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.textMuted, marginBottom: 12 }}>
                            <Icon size={16} /> {TYPE_MAP[type]}
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
                            {accounts.map((acc, i) => (
                                <motion.div key={acc.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: gi * 0.1 + i * 0.05 }}
                                    style={{ ...cardStyle, padding: 20 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                                        <div style={{ width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: `${acc.color}15` }}>
                                            <Icon size={18} style={{ color: acc.color }} />
                                        </div>
                                        <div>
                                            <p style={{ fontSize: 14, fontWeight: 500, color: C.text }}>{acc.name}</p>
                                            {acc.institution && <p style={{ fontSize: 12, color: C.textMuted }}>{acc.institution}</p>}
                                        </div>
                                    </div>
                                    <p style={{ fontSize: 22, fontWeight: 700, color: C.text }}>{display(acc.balance)}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
