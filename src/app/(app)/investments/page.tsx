'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    PieChart,
    TrendingUp,
    Target,
    MessageSquare,
    Plus,
    Eye,
    EyeOff,
    Loader2
} from 'lucide-react'
import { C, cardStyle, btnGoldStyle, btnOutlineStyle } from '@/lib/theme'
import { PluggyConnectButton } from '@/components/pluggy/PluggyConnectButton'

// Import de novos componentes
import { InvestmentDashboard } from '@/components/investments/Dashboard'
import { InvestmentRecommendations } from '@/components/investments/Recommendations'
import { WhatsAppInvestmentAssistant } from '@/components/investments/WhatsAppAssistant'
import { InvestmentGamificationCard } from '@/components/investments/Gamification'

export default function InvestmentsPage() {
    const [activeTab, setActiveTab] = useState<'overview' | 'performance' | 'recommendations' | 'whatsapp'>('overview')
    const [showValues, setShowValues] = useState(true)
    const loading = false // Simulado

    return (
        <div style={{ paddingBottom: 100 }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <h1 style={{ fontSize: 28, fontWeight: 800, color: C.text }}>Investimentos</h1>
                    <p style={{ fontSize: 14, color: C.textMuted, marginTop: 4 }}>
                        Plataforma de Gestão Patrimonial Avançada
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <PluggyConnectButton label="Conectar Corretora" onSuccess={() => window.location.reload()} />
                    <button onClick={() => setShowValues(!showValues)} style={btnOutlineStyle}>
                        {showValues ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    <button style={btnGoldStyle}><Plus size={16} /> Novo Ativo</button>
                </div>
            </div>

            {/* Navegação de Abas - Estilo Revolut/Premium */}
            <div style={{
                display: 'flex',
                gap: 8,
                padding: 4,
                backgroundColor: 'rgba(255,255,255,0.03)',
                borderRadius: 14,
                marginBottom: 32,
                width: 'fit-content'
            }}>
                {[
                    { id: 'overview', icon: PieChart, label: 'Visão Geral' },
                    { id: 'performance', icon: TrendingUp, label: 'Performance' },
                    { id: 'recommendations', icon: Target, label: 'Estratégia IA' },
                    { id: 'whatsapp', icon: MessageSquare, label: 'WhatsApp' },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '10px 20px',
                            borderRadius: 10,
                            border: 'none',
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            backgroundColor: activeTab === tab.id ? 'rgba(201,168,88,0.15)' : 'transparent',
                            color: activeTab === tab.id ? C.gold : C.textMuted,
                        }}
                    >
                        <tab.icon size={16} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Conteúdo Dinâmico */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                >
                    {activeTab === 'overview' && <InvestmentDashboard />}
                    {activeTab === 'performance' && (
                        <div style={{ ...cardStyle, padding: 64, textAlign: 'center' }}>
                            <TrendingUp size={48} style={{ color: C.gold, opacity: 0.3, margin: '0 auto 20px' }} />
                            <h3 style={{ fontSize: 18, color: C.text }}>Análise de Performance</h3>
                            <p style={{ fontSize: 14, color: C.textMuted, marginTop: 8 }}>Sincronize sua conta para ver o histórico de rentabilidade completo.</p>
                        </div>
                    )}
                    {activeTab === 'recommendations' && <InvestmentRecommendations />}
                    {activeTab === 'whatsapp' && <WhatsAppInvestmentAssistant />}
                </motion.div>
            </AnimatePresence>

            {/* Gamificação - Sempre visível no final ou lateral dependendo da largura */}
            <div style={{ marginTop: 40 }}>
                <InvestmentGamificationCard />
            </div>

            <style jsx>{`
                button:hover {
                    background-color: rgba(255,255,255,0.05);
                }
            `}</style>
        </div>
    )
}
