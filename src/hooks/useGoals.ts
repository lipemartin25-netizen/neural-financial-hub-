'use client'

import { useCallback, useEffect, useState } from 'react'
import type { Goal } from '@/types/database'

export function useGoals() {
    const [goals, setGoals] = useState<Goal[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchGoals = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const res = await fetch('/api/goals')
            if (!res.ok) {
                const body = await res.json().catch(() => ({}))
                throw new Error(body.error || `HTTP ${res.status}`)
            }
            const json = await res.json()
            setGoals(json.data ?? [])
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Erro ao carregar metas'
            setError(message)
            setGoals([])
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchGoals()
    }, [fetchGoals])

    const createGoal = useCallback(async (payload: {
        name: string
        target_amount: number | string
        target_date?: string
        monthly_contribution?: number | string
        icon?: string
        color?: string
    }) => {
        try {
            const res = await fetch('/api/goals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })
            if (!res.ok) {
                const body = await res.json().catch(() => ({}))
                throw new Error(body.error || `HTTP ${res.status}`)
            }
            await fetchGoals()
            return { error: null }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Erro ao criar meta'
            return { error: message }
        }
    }, [fetchGoals])

    const updateGoal = useCallback(async (id: string, payload: Record<string, unknown>) => {
        try {
            const res = await fetch('/api/goals', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, ...payload }),
            })
            if (!res.ok) {
                const body = await res.json().catch(() => ({}))
                throw new Error(body.error || `HTTP ${res.status}`)
            }
            await fetchGoals()
            return { error: null }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Erro ao atualizar meta'
            return { error: message }
        }
    }, [fetchGoals])

    const deleteGoal = useCallback(async (id: string) => {
        try {
            const res = await fetch(`/api/goals?id=${id}`, { method: 'DELETE' })
            if (!res.ok) {
                const body = await res.json().catch(() => ({}))
                throw new Error(body.error || `HTTP ${res.status}`)
            }
            await fetchGoals()
            return { error: null }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Erro ao excluir meta'
            return { error: message }
        }
    }, [fetchGoals])

    const addFunds = useCallback(async (id: string, amountToAdd: number) => {
        const goal = goals.find(g => g.id === id)
        if (!goal) return { error: 'Meta não encontrada' }
        return updateGoal(id, {
            current_amount: goal.current_amount + amountToAdd
        })
    }, [goals, updateGoal])

    return {
        goals,
        loading,
        error,
        fetchGoals,
        createGoal,
        updateGoal,
        deleteGoal,
        addFunds,
    }
}
