'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Badge, UserStats } from '@/lib/badges'

type BadgeWithStatus = Badge & { unlocked: boolean; unlocked_at: string | null }

export type GamificationData = {
    xp: number
    level: number
    currentStreak: number
    longestStreak: number
    badges: BadgeWithStatus[]
    newBadges: string[]
    stats: UserStats
}

export function useGamification() {
    const [data, setData] = useState<GamificationData | null>(null)
    const [loading, setLoading] = useState(true)

    const fetchData = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/gamification')
            if (!res.ok) { setLoading(false); return }
            const json = await res.json()
            setData(json.data)
        } catch { } finally { setLoading(false) }
    }, [])

    useEffect(() => { fetchData() }, [fetchData])

    const addXP = async (action: string) => {
        try {
            const res = await fetch('/api/gamification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action }),
            })
            const json = await res.json()
            if (json.leveledUp) {
                await fetchData()
            }
            return json
        } catch { return { xp: 0 } }
    }

    return { data, loading, refetch: fetchData, addXP }
}
