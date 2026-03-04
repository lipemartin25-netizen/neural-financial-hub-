'use client'

import { useCallback, useEffect, useState } from 'react'

export type DashboardAlert = {
    text: string
    type: 'warning' | 'danger'
    href: string
}

export type DashboardGoal = {
    id: string
    name: string
    target: number
    current: number
    pct: number
    color: string
    icon: string
    status: string
}

export type DashboardTx = {
    id: string
    description: string
    amount: number
    type: string
    category_id: string | null
    date: string
}

export type DashboardData = {
    totalBalance: number
    monthIncome: number
    monthExpense: number
    totalInvested: number
    totalInvCurrent: number
    recentTx: DashboardTx[]
    goals: DashboardGoal[]
    alerts: DashboardAlert[]
}

export function useDashboard() {
    const [data, setData] = useState<DashboardData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchDashboard = useCallback(async () => {
        setLoading(true)
        setError(null)

        try {
            const res = await fetch('/api/dashboard')
            if (!res.ok) {
                const body = await res.json().catch(() => ({}))
                throw new Error(body.error || `HTTP ${res.status}`)
            }
            const json = await res.json()
            setData(json.data ?? null)
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Erro ao carregar dashboard'
            setError(message)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchDashboard()
    }, [fetchDashboard])

    return { data, loading, error, refetch: fetchDashboard }
}
