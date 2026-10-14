// src/components/investments/WhatsAppAssistant.tsx
'use client'

import { motion } from 'framer-motion'
import { MessageSquare, Zap, Smartphone, CheckCircle2, MessageCircle } from 'lucide-react'
import { C, cardStyle, btnGoldStyle } from '@/lib/theme'

export function WhatsAppInvestmentAssistant() {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ ...cardStyle, padding: 40, textAlign: 'center', border: '1px solid rgba(34, 197, 94, 0.2)' }}
        >
            <div style={{ width: 80, height: 80, borderRadius: 24, backgroundColor: 'rgba(34, 197, 94, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                <MessageCircle size={40} style={{ color: '#22C55E' }} />
            </div>

            <h2 style={{ fontSize: 24, fontWeight: 800, color: C.text, marginBottom: 12 }}>Consultoria VIP via WhatsApp</h2>
            <p style={{ fontSize: 16, color: C.textMuted, maxWidth: 500, margin: '0 auto 32px', lineHeight: 1.6 }}>
                Sincronize sua carteira, receba alertas de mercado e execute ordens simples diretamente pelo WhatsApp com a inteligência do NeuraFin.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 40, textAlign: 'left' }}>
                {[
                    'Alertas de dividendos e cupons',
                    'Sugestões de rebalanceamento',
                    'Cadastro de aportes por voz/texto',
                    'Consultoria de IA 24/7'
                ].map((feat) => (
                    <div key={feat} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <CheckCircle2 size={18} style={{ color: '#22C55E' }} />
                        <span style={{ fontSize: 14, color: C.textMuted }}>{feat}</span>
                    </div>
                ))}
            </div>

            <button style={{ ...btnGoldStyle, backgroundColor: '#22C55E', boxShadow: '0 4px 20px -5px rgba(34, 197, 94, 0.4)', padding: '16px 40px', fontSize: 16 }}>
                <Smartphone size={20} /> Ativar Assistente WhatsApp
            </button>

            <p style={{ marginTop: 24, fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>
                Disponível para planos Pro, Family e MEI.
            </p>
        </motion.div>
    )
}
