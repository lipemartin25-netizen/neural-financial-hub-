// src/components/investments/Recommendations.tsx
'use client'

import { motion } from 'framer-motion'
import { Target, Zap, Shield, Clock, Loader2 } from 'lucide-react'
import { C, cardStyle, badgeStyle, fmtPct } from '@/lib/theme'
import { useAdvancedInvestments } from '@/hooks/useAdvancedInvestments'
import { useApp } from '@/contexts/AppContext'
import { getThemeColors } from '@/lib/themeColors'

export function InvestmentRecommendations() {
    const { recommendations, loading } = useAdvancedInvestments()
    const { theme } = useApp()
    const TC = getThemeColors(theme)

    if (loading) {
        return (
            <div style={{ padding: 40, textAlign: 'center' }}>
                <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', color: C.gold }} />
                <p style={{ color: C.textMuted, marginTop: 12 }}>Analisando mercado com Nexus AI...</p>
            </div>
        )
    }

    if (recommendations.length === 0) {
        return (
            <div style={{ ...cardStyle, padding: 40, textAlign: 'center' }}>
                <Target size={48} style={{ color: C.gold, opacity: 0.2, margin: '0 auto 20px' }} />
                <h3 style={{ fontSize: 18, color: C.text }}>Nenhuma recomendação no momento</h3>
                <p style={{ fontSize: 14, color: C.textMuted, marginTop: 8 }}>Cadastre seu perfil de investidor para receber sugestões personalizadas da IA.</p>
            </div>
        )
    }

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
            {recommendations.map((rec, i) => (
                <motion.div
                    key={rec.symbol}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    style={{ ...cardStyle, padding: 24, border: `1px solid rgba(201, 168, 88, 0.15)` }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                <span style={{ fontSize: 18, fontWeight: 700, color: C.text }}>{rec.symbol}</span>
                                <span style={badgeStyle(C.gold, 'rgba(201,168,88,0.1)')}>{rec.asset_type}</span>
                            </div>
                            <span style={{ fontSize: 13, color: TC.textMuted }}>{rec.name}</span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 18, fontWeight: 700, color: C.emerald }}>{fmtPct(rec.expected_return)}</div>
                            <span style={{ fontSize: 11, color: TC.textMuted }}>Expectativa Retorno</span>
                        </div>
                    </div>

                    <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 16, marginBottom: 20 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <Zap size={16} style={{ color: C.gold }} />
                            <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Análise NeuraFin AI</span>
                        </div>
                        <p style={{ fontSize: 13, color: TC.textMuted, lineHeight: 1.6 }}>{rec.rationale}</p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div style={{ padding: 12, border: '1px solid rgba(255,255,255,0.05)', borderRadius: 10 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                <Shield size={14} style={{ color: TC.textMuted }} />
                                <span style={{ fontSize: 11, color: TC.textMuted }}>Risco</span>
                            </div>
                            <span style={{ fontSize: 13, fontWeight: 600, color: rec.risk_level === 'Low' || rec.risk_level === 'low' ? C.emerald : C.orange }}>{rec.risk_level}</span>
                        </div>
                        <div style={{ padding: 12, border: '1px solid rgba(255,255,255,0.05)', borderRadius: 10 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                <Clock size={14} style={{ color: TC.textMuted }} />
                                <span style={{ fontSize: 11, color: TC.textMuted }}>Horizonte</span>
                            </div>
                            <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{rec.time_horizon}</span>
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
    )
}
