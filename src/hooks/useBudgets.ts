'use client'

import { useCallback, useEffect, useState } from 'react'

export type BudgetWithSpent = {
    id: string
    category_id: string
    category_name: string
    category_icon: string
    category_color: string
    amount: number        // limite do orçamento
    spent: number         // total gasto no período
    alert_threshold: number
    period: string
    created_at: string
    updated_at: string
}

export function useBudgets() {
    const [budgets, setBudgets] = useState<BudgetWithSpent[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchBudgets = useCallback(async () => {
        setLoading(true)
        setError(null)

        try {
            const res = await fetch('/api/budgets')
            if (!res.ok) {
                const body = await res.json().catch(() => ({}))
                throw new Error(body.error || `HTTP ${res.status}`)
            }
            const json = await res.json()
            setBudgets(json.data ?? [])
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Erro ao carregar orçamentos'
            setError(message)
            setBudgets([])
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchBudgets()
    }, [fetchBudgets])

    const createBudget = useCallback(async (payload: {
        category_id: string
        amount: number | string
        alert_threshold?: number
        period?: string
    }) => {
        try {
            const res = await fetch('/api/budgets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })
            if (!res.ok) {
                const body = await res.json().catch(() => ({}))
                throw new Error(body.error || `HTTP ${res.status}`)
            }
            await fetchBudgets()
            return { error: null }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Erro ao criar orçamento'
            return { error: message }
        }
    }, [fetchBudgets])

    const updateBudget = useCallback(async (id: string, payload: Record<string, unknown>) => {
        try {
            const res = await fetch('/api/budgets', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, ...payload }),
            })
            if (!res.ok) {
                const body = await res.json().catch(() => ({}))
                throw new Error(body.error || `HTTP ${res.status}`)
            }
            await fetchBudgets()
            return { error: null }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Erro ao atualizar orçamento'
            return { error: message }
        }
    }, [fetchBudgets])

    const deleteBudget = useCallback(async (id: string) => {
        try {
            const res = await fetch(`/api/budgets?id=${id}`, { method: 'DELETE' })
            if (!res.ok) {
                const body = await res.json().catch(() => ({}))
                throw new Error(body.error || `HTTP ${res.status}`)
            }
            await fetchBudgets()
            return { error: null }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Erro ao excluir orçamento'
            return { error: message }
        }
    }, [fetchBudgets])

    return {
        budgets,
        loading,
        error,
        fetchBudgets,
        createBudget,
        updateBudget,
        deleteBudget,
    }
}
