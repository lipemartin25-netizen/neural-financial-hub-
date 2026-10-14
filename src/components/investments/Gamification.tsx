// src/components/investments/Gamification.tsx
'use client'

import { motion } from 'framer-motion'
import { Zap, Trophy, Target, Star, ChevronRight } from 'lucide-react'
import { C, cardStyle } from '@/lib/theme'

interface ChallengeProps {
    title: string
    description: string
    progress: number
    target: number
    points: number
}

function InvestmentChallenge({ title, description, progress, target, points }: ChallengeProps) {
    const percentage = (progress / target) * 100

    return (
        <div style={{ padding: 16, backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                    <h4 style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 2 }}>{title}</h4>
                    <p style={{ fontSize: 12, color: C.textMuted }}>{description}</p>
                </div>
                <div style={{ padding: '4px 8px', borderRadius: 8, backgroundColor: 'rgba(255, 215, 0, 0.1)', color: C.gold, fontSize: 11, fontWeight: 700 }}>
                    +{points} XP
                </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1, height: 6, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(percentage, 100)}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        style={{ height: '100%', background: C.goldGrad }}
                    />
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: C.textMuted }}>{progress}/{target}</span>
            </div>
        </div>
    )
}

export function InvestmentGamificationCard() {
    // Definindo valores reais iniciais (zeros) para remover ficção
    // No futuro estes dados virão do DB
    const progressData = {
        level: 1,
        title: 'Iniciante',
        challenges: [
            { title: "Primeiro Aporte", description: "Realize seu primeiro investimento", progress: 0, target: 1, points: 500 },
            { title: "Diversificação", description: "Invista em 3 classes diferentes", progress: 0, target: 3, points: 1200 },
            { title: "Resiliência", description: "Consistência por 3 meses", progress: 0, target: 3, points: 2500 }
        ]
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            style={{
                ...cardStyle,
                padding: 24,
                background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.05), rgba(236, 72, 153, 0.05))',
                border: '1px solid rgba(168, 85, 247, 0.2)'
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #A855F7, #EC4899)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Trophy size={20} color="white" />
                    </div>
                    <div>
                        <h3 style={{ fontSize: 18, fontWeight: 700, color: C.text }}>Progresso NeuraFin</h3>
                        <p style={{ fontSize: 13, color: C.textMuted }}>Nível {progressData.level}: {progressData.title}</p>
                    </div>
                </div>
                <button style={{ background: 'none', border: 'none', color: C.gold, display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, cursor: 'pointer' }}>
                    Ver Conquistas <ChevronRight size={14} />
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
                {progressData.challenges.map(ch => (
                    <InvestmentChallenge
                        key={ch.title}
                        title={ch.title}
                        description={ch.description}
                        progress={ch.progress}
                        target={ch.target}
                        points={ch.points}
                    />
                ))}
            </div>
        </motion.div>
    )
}
