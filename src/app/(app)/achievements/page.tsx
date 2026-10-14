'use client'

import { motion } from 'framer-motion'
import { Trophy, Flame, Star, Lock, Loader2, Zap, ChevronRight } from 'lucide-react'
import { C, cardStyle, cardHlStyle, fmt } from '@/lib/theme'
import { useGamification } from '@/hooks/useGamification'
import { getXPProgress, LEVEL_TITLES, BADGES } from '@/lib/badges'
import { useApp } from '@/contexts/AppContext'

const CAT_ICONS: Record<string, string> = {
    beginner: '🌱', finance: '💰', streak: '🔥', social: '👥', mastery: '👑',
}

const CAT_LABELS: Record<string, Record<string, string>> = {
    beginner: { 'pt-BR': 'Iniciante', en: 'Beginner', es: 'Principiante' },
    finance: { 'pt-BR': 'Finanças', en: 'Finance', es: 'Finanzas' },
    streak: { 'pt-BR': 'Sequência', en: 'Streak', es: 'Racha' },
    social: { 'pt-BR': 'Social', en: 'Social', es: 'Social' },
    mastery: { 'pt-BR': 'Maestria', en: 'Mastery', es: 'Maestría' },
}

export default function AchievementsPage() {
    const { data, loading } = useGamification()
    const { t, tBadge, locale } = useApp()

    if (loading || !data) {
        return (
            <div style={{ padding: 60, textAlign: 'center' }}>
                <Loader2 size={32} style={{ color: C.gold, animation: 'spin 1s linear infinite', margin: '0 auto' }} />
                <p style={{ color: C.textMuted, marginTop: 12 }}>{t('common.loading')}</p>
                <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        )
    }

    const xpProgress = getXPProgress(data.xp)
    const levelTitle = LEVEL_TITLES[Math.min(data.level, 10)]?.[locale] ?? LEVEL_TITLES[1]?.[locale]
    const unlockedCount = data.badges.filter(b => b.unlocked).length
    const totalCount = data.badges.filter(b => !b.secret || b.unlocked).length

    const categories = ['beginner', 'finance', 'streak', 'social', 'mastery']

    return (
        <div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: 24, fontWeight: 700, color: C.text }}>
                    <Trophy size={22} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle', color: C.gold }} />
                    {t('gam.achievements')}
                </h1>
                <p style={{ fontSize: 14, color: C.textMuted, marginTop: 4 }}>
                    {unlockedCount}/{totalCount} {t('gam.unlocked').toLowerCase()}
                </p>
            </motion.div>

            {/* ===== STATS BAR ===== */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
                {/* Level + XP */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    style={{ ...cardHlStyle, padding: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <div>
                            <p style={{ fontSize: 11, color: C.textMuted, textTransform: 'uppercase', letterSpacing: 1 }}>{t('gam.level')}</p>
                            <p style={{ fontSize: 32, fontWeight: 800, color: C.gold }}>{data.level}</p>
                            <p style={{ fontSize: 12, color: C.gold, fontWeight: 600 }}>{levelTitle}</p>
                        </div>
                        <div style={{
                            width: 60, height: 60, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: C.goldGrad, fontSize: 28,
                        }}>
                            ⭐
                        </div>
                    </div>
                    <div style={{ marginTop: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: C.textMuted, marginBottom: 4 }}>
                            <span>{t('gam.xp')}</span>
                            <span>{xpProgress.current}/{xpProgress.needed} XP</span>
                        </div>
                        <div style={{ height: 8, borderRadius: 999, backgroundColor: C.secondary }}>
                            <div style={{
                                height: '100%', width: `${xpProgress.pct}%`, borderRadius: 999,
                                background: C.goldGrad, transition: 'width 1s ease',
                            }} />
                        </div>
                    </div>
                </motion.div>

                {/* Streak */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                    style={{ ...cardStyle, padding: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <p style={{ fontSize: 11, color: C.textMuted, textTransform: 'uppercase', letterSpacing: 1 }}>{t('gam.streak')}</p>
                        <Flame size={20} style={{ color: data.currentStreak >= 7 ? C.orange : C.textMuted }} />
                    </div>
                    <p style={{ fontSize: 40, fontWeight: 800, color: data.currentStreak >= 7 ? C.orange : C.text }}>
                        {data.currentStreak}
                    </p>
                    <p style={{ fontSize: 12, color: C.textMuted }}>{t('gam.days')}</p>
                    <p style={{ fontSize: 11, color: C.textMuted2, marginTop: 8 }}>
                        {t('gam.best_streak')}: {data.longestStreak} {t('gam.days')}
                    </p>
                </motion.div>

                {/* Total XP */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    style={{ ...cardStyle, padding: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <p style={{ fontSize: 11, color: C.textMuted, textTransform: 'uppercase', letterSpacing: 1 }}>XP Total</p>
                        <Zap size={20} style={{ color: C.gold }} />
                    </div>
                    <p style={{ fontSize: 40, fontWeight: 800, color: C.gold }}>
                        {data.xp.toLocaleString()}
                    </p>
                    <p style={{ fontSize: 12, color: C.textMuted }}>XP</p>
                    <p style={{ fontSize: 11, color: C.textMuted2, marginTop: 8 }}>
                        {unlockedCount} {t('gam.achievements').toLowerCase()}
                    </p>
                </motion.div>
            </div>

            {/* ===== BADGES POR CATEGORIA ===== */}
            {categories.map((cat, ci) => {
                const catBadges = data.badges.filter(b => b.category === cat && (!b.secret || b.unlocked))
                if (catBadges.length === 0) return null
                return (
                    <motion.div key={cat} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 + ci * 0.05 }}
                        style={{ ...cardStyle, padding: 24, marginBottom: 16 }}>
                        <h3 style={{ fontSize: 15, fontWeight: 600, color: C.text, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 18 }}>{CAT_ICONS[cat]}</span>
                            {CAT_LABELS[cat]?.[locale] ?? cat}
                            <span style={{ fontSize: 11, color: C.textMuted, fontWeight: 400, marginLeft: 'auto' }}>
                                {catBadges.filter(b => b.unlocked).length}/{catBadges.length}
                            </span>
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                            {catBadges.map((badge) => (
                                <div key={badge.id} style={{
                                    display: 'flex', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12,
                                    backgroundColor: badge.unlocked ? 'rgba(201,168,88,0.05)' : C.secondary,
                                    border: `1px solid ${badge.unlocked ? 'rgba(201,168,88,0.15)' : 'transparent'}`,
                                    opacity: badge.unlocked ? 1 : 0.5,
                                    transition: 'all 0.3s',
                                }}>
                                    <div style={{
                                        width: 48, height: 48, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 24, backgroundColor: badge.unlocked ? 'rgba(201,168,88,0.1)' : 'rgba(107,114,128,0.1)',
                                        border: `1px solid ${badge.unlocked ? 'rgba(201,168,88,0.2)' : 'transparent'}`,
                                        filter: badge.unlocked ? 'none' : 'grayscale(1)',
                                    }}>
                                        {badge.unlocked ? badge.icon : '🔒'}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <p style={{ fontSize: 13, fontWeight: 600, color: badge.unlocked ? C.text : C.textMuted }}>
                                            {tBadge(badge.name)}
                                        </p>
                                        <p style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>
                                            {tBadge(badge.description)}
                                        </p>
                                        {badge.unlocked && badge.unlocked_at && (
                                            <p style={{ fontSize: 10, color: C.gold, marginTop: 4 }}>
                                                ✓ {new Date(badge.unlocked_at).toLocaleDateString(locale === 'en' ? 'en-US' : locale === 'es' ? 'es-ES' : 'pt-BR')}
                                            </p>
                                        )}
                                    </div>
                                    {badge.xpReward > 0 && (
                                        <span style={{
                                            padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700,
                                            color: C.gold, backgroundColor: 'rgba(201,168,88,0.1)',
                                        }}>
                                            +{badge.xpReward} XP
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )
            })}
            <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    )
}
