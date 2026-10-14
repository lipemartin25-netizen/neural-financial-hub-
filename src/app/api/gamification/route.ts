import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { BADGES, getLevelFromXP, XP_ACTIONS } from '@/lib/badges'
import type { UserStats } from '@/lib/badges'

export async function GET() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        // Buscar ou criar gamification record
        let { data: gam } = await supabase
            .from('user_gamification')
            .select('*')
            .eq('user_id', user.id)
            .single()

        if (!gam) {
            await supabase.from('user_gamification').insert({ user_id: user.id })
            const { data: newGam } = await supabase
                .from('user_gamification')
                .select('*')
                .eq('user_id', user.id)
                .single()
            gam = newGam
        }

        // Buscar badges desbloqueadas
        const { data: unlockedBadges } = await supabase
            .from('user_badges')
            .select('badge_id, unlocked_at')
            .eq('user_id', user.id)

        const unlockedSet = new Set((unlockedBadges ?? []).map(b => b.badge_id))
        const unlockedMap = Object.fromEntries((unlockedBadges ?? []).map(b => [b.badge_id, b.unlocked_at]))

        // Buscar stats para verificar badges
        const { count: txCount } = await supabase
            .from('transactions')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)

        const { count: goalsCompleted } = await supabase
            .from('goals')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('is_completed', true)

        const { data: profile } = await supabase
            .from('profiles')
            .select('neural_score')
            .eq('id', user.id)
            .single()

        const { data: familyMembership } = await supabase
            .from('family_members')
            .select('id')
            .eq('user_id', user.id)
            .limit(1)
            .single()

        // Check investimentos
        const { data: investments } = await supabase
            .from('accounts')
            .select('balance')
            .eq('user_id', user.id)
            .eq('type', 'investment')

        const totalInvested = (investments ?? []).reduce((s, i) => s + (Number(i.balance) ?? 0), 0)

        const stats: UserStats = {
            totalTransactions: txCount ?? 0,
            totalGoalsCompleted: goalsCompleted ?? 0,
            totalBudgetsOnTrack: gam?.total_budgets_on_track ?? 0,
            currentStreak: gam?.current_streak ?? 0,
            longestStreak: gam?.longest_streak ?? 0,
            xp: gam?.xp ?? 0,
            level: gam?.level ?? 1,
            daysActive: gam?.current_streak ?? 0,
            hasFamily: !!familyMembership,
            totalInvested,
            totalCategories: 0,
            neuralScore: profile?.neural_score ?? 0,
        }

        // Verificar badges novas
        const newBadges: string[] = []
        let xpToAdd = 0
        for (const badge of BADGES) {
            if (!unlockedSet.has(badge.id) && badge.condition(stats)) {
                newBadges.push(badge.id)
                xpToAdd += badge.xpReward
                unlockedSet.add(badge.id)
            }
        }

        // Salvar badges novas e XP
        if (newBadges.length > 0) {
            await supabase.from('user_badges').insert(
                newBadges.map(badge_id => ({ user_id: user.id, badge_id }))
            )

            const newXP = (gam?.xp ?? 0) + xpToAdd
            const newLevel = getLevelFromXP(newXP)

            await supabase.from('user_gamification').update({
                xp: newXP,
                level: newLevel,
                total_transactions: txCount ?? 0,
                total_goals_completed: goalsCompleted ?? 0,
                updated_at: new Date().toISOString(),
            }).eq('user_id', user.id)

            // Atualizar local
            if (gam) {
                gam.xp = newXP
                gam.level = newLevel
            }
        }

        // Update streak
        const today = new Date().toISOString().split('T')[0]
        if (gam?.last_activity_date !== today) {
            const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
            const isConsecutive = gam?.last_activity_date === yesterday
            const newStreak = isConsecutive ? (gam?.current_streak ?? 0) + 1 : 1
            const longestStreak = Math.max(newStreak, gam?.longest_streak ?? 0)

            let streakXP = XP_ACTIONS.daily_login
            if (newStreak === 7) streakXP += XP_ACTIONS.streak_7
            if (newStreak === 30) streakXP += XP_ACTIONS.streak_30

            const updatedXP = (gam?.xp ?? 0) + streakXP
            const updatedLevel = getLevelFromXP(updatedXP)

            await supabase.from('user_gamification').update({
                current_streak: newStreak,
                longest_streak: longestStreak,
                last_activity_date: today,
                xp: updatedXP,
                level: updatedLevel,
                updated_at: new Date().toISOString(),
            }).eq('user_id', user.id)

            if (gam) {
                gam.current_streak = newStreak
                gam.longest_streak = longestStreak
                gam.xp = updatedXP
                gam.level = updatedLevel
            }
        }

        // Montar resposta
        const allBadges = BADGES.map(b => ({
            ...b,
            unlocked: unlockedSet.has(b.id),
            unlocked_at: unlockedMap[b.id] ?? null,
        }))

        return NextResponse.json({
            data: {
                xp: gam?.xp ?? 0,
                level: gam?.level ?? 1,
                currentStreak: gam?.current_streak ?? 0,
                longestStreak: gam?.longest_streak ?? 0,
                badges: allBadges,
                newBadges,
                stats,
            },
        })
    } catch (err: unknown) {
        return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 })
    }
}

// POST — adicionar XP manual (para ações) — COM RATE LIMIT
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { action } = await request.json()
        const xp = XP_ACTIONS[action as keyof typeof XP_ACTIONS] ?? 0

        if (xp === 0) return NextResponse.json({ success: true, xp: 0 })

        // Anti-farming: verificar última vez que essa ação deu XP (cooldown 30s)
        const { data: gam } = await supabase
            .from('user_gamification')
            .select('xp, level, last_xp_action, last_xp_action_at')
            .eq('user_id', user.id)
            .single()

        if (gam?.last_xp_action === action && gam?.last_xp_action_at) {
            const lastActionTime = new Date(gam.last_xp_action_at).getTime()
            const now = Date.now()
            const cooldownMs = 30_000 // 30 segundos entre mesma ação
            if (now - lastActionTime < cooldownMs) {
                return NextResponse.json({ success: true, xp: 0, throttled: true })
            }
        }

        const newXP = (gam?.xp ?? 0) + xp
        const newLevel = getLevelFromXP(newXP)
        const leveledUp = newLevel > (gam?.level ?? 1)

        await supabase.from('user_gamification').upsert({
            user_id: user.id,
            xp: newXP,
            level: newLevel,
            last_xp_action: action,
            last_xp_action_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        })

        return NextResponse.json({ success: true, xp, newXP, newLevel, leveledUp })
    } catch (err: unknown) {
        return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 })
    }
}
