// src/components/investments/Dashboard.tsx
'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { PieChart, TrendingUp, Wallet, ArrowUpRight, ArrowDownRight, Globe, Shield, Loader2 } from 'lucide-react'
import { C, cardStyle, cardHlStyle, fmt, fmtPct } from '@/lib/theme'
import { useAdvancedInvestments } from '@/hooks/useAdvancedInvestments'

export function InvestmentDashboard() {
    const { positions, marketQuotes, loading: advLoading, totalValue } = useAdvancedInvestments()
    const [marketData, setMarketData] = useState<any[]>([])
    const [itemLoading, setItemLoading] = useState(true)

    useEffect(() => {
        async function fetchMarket() {
            try {
                const res = await fetch('/api/investments/market-data')
                const json = await res.json()
                if (json.data) setMarketData(json.data)
            } catch (e) {
                console.error(e)
            } finally {
                setItemLoading(false)
            }
        }
        fetchMarket()
    }, [])

    const allocation = useMemo(() => {
        if (!positions.length) return { stocks: 0, fixed: 0 }
        const stocks = positions.filter((p: any) => p.type === 'renda_variavel' || p.type === 'stock').reduce((acc, p: any) => acc + (p.current_value || 0), 0)
        const fixed = positions.filter((p: any) => p.type === 'renda_fixa' || p.type === 'bond').reduce((acc, p: any) => acc + (p.current_value || 0), 0)
        const total = stocks + fixed
        if (total === 0) return { stocks: 0, fixed: 0 }
        return {
            stocks: Math.round((stocks / total) * 100),
            fixed: Math.round((fixed / total) * 100)
        }
    }, [positions])

    const loading = advLoading || itemLoading

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
            {/* Portfólio Consolidado */}
            <div style={{ gridColumn: '1 / -1' }}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{ ...cardHlStyle, padding: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 24 }}
                >
                    <div>
                        <p style={{ fontSize: 14, color: C.textMuted, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Globe size={16} /> Patrimônio Consolidado (W1 Global View)
                        </p>
                        <h2 style={{ fontSize: 36, fontWeight: 800, color: C.text }}>{fmt(totalValue || 0)}</h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 12px', borderRadius: 999, backgroundColor: 'rgba(52,211,153,0.1)', color: C.emerald, fontSize: 13, fontWeight: 600 }}>
                                <ArrowUpRight size={14} /> +0,00%
                            </span>
                            <span style={{ fontSize: 13, color: C.textMuted }}>Sua rentabilidade real</span>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 24 }}>
                        <div style={{ textAlign: 'right' }}>
                            <p style={{ fontSize: 12, color: C.textMuted, marginBottom: 4 }}>Ações/Variável</p>
                            <p style={{ fontSize: 18, fontWeight: 700, color: C.blue }}>{allocation.stocks}%</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <p style={{ fontSize: 12, color: C.textMuted, marginBottom: 4 }}>Renda Fixa</p>
                            <p style={{ fontSize: 18, fontWeight: 700, color: C.emerald }}>{allocation.fixed}%</p>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Destaques da B3 - Dados Reais */}
            {loading ? (
                <div style={{ gridColumn: '1 / -1', padding: 40, textAlign: 'center' }}>
                    <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', color: C.gold }} />
                    <p style={{ color: C.textMuted, marginTop: 12 }}>Conectando com a B3...</p>
                </div>
            ) : marketData.map((quote, i) => (
                <motion.div
                    key={quote.symbol}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    style={{ ...cardStyle, padding: 24 }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                        <div style={{ padding: '8px 12px', borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.03)', fontSize: 14, fontWeight: 700, color: C.gold, border: '1px solid rgba(201,168,88,0.1)' }}>
                            {quote.symbol}
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <span style={{
                                fontSize: 12,
                                fontWeight: 700,
                                color: quote.changePercent >= 0 ? C.emerald : C.red,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 2
                            }}>
                                {quote.changePercent >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                                {fmtPct(quote.changePercent)}
                            </span>
                        </div>
                    </div>
                    <h3 style={{ fontSize: 14, color: C.textMuted, marginBottom: 4 }}>{quote.name}</h3>
                    <p style={{ fontSize: 24, fontWeight: 700, color: C.text }}>{fmt(quote.price)}</p>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', marginTop: 8 }}>Fonte: Brapi / B3</p>
                </motion.div>
            ))}
        </div>
    )
}
