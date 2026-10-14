'use client'

import { useCallback, useEffect, useState } from 'react'
import type { Investment } from '@/types/database'

export function useInvestments() {
    const [investments, setInvestments] = useState<Investment[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchInvestments = useCallback(async () => {
        setLoading(true)
        setError(null)

        try {
            const res = await fetch('/api/investments')
            if (!res.ok) {
                const body = await res.json().catch(() => ({}))
                throw new Error(body.error || `HTTP ${res.status}`)
            }
            const json = await res.json()
            setInvestments(json.data ?? [])
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Erro ao carregar investimentos'
            setError(message)
            setInvestments([])
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchInvestments()
    }, [fetchInvestments])

    const createInvestment = useCallback(async (payload: {
        ticker: string
        name?: string
        type: string
        invested_amount: number | string
        current_value?: number | string
        monthly_return?: number | string | null
    }) => {
        try {
            const res = await fetch('/api/investments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })
            if (!res.ok) {
                const body = await res.json().catch(() => ({}))
                throw new Error(body.error || `HTTP ${res.status}`)
            }
            await fetchInvestments()
            return { error: null }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Erro ao criar investimento'
            return { error: message }
        }
    }, [fetchInvestments])

    const updateInvestment = useCallback(async (id: string, payload: Record<string, unknown>) => {
        try {
            const res = await fetch('/api/investments', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, ...payload }),
            })
            if (!res.ok) {
                const body = await res.json().catch(() => ({}))
                throw new Error(body.error || `HTTP ${res.status}`)
            }
            await fetchInvestments()
            return { error: null }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Erro ao atualizar investimento'
            return { error: message }
        }
    }, [fetchInvestments])

    const deleteInvestment = useCallback(async (id: string) => {
        try {
            const res = await fetch(`/api/investments?id=${id}`, { method: 'DELETE' })
            if (!res.ok) {
                const body = await res.json().catch(() => ({}))
                throw new Error(body.error || `HTTP ${res.status}`)
            }
            await fetchInvestments()
            return { error: null }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Erro ao excluir investimento'
            return { error: message }
        }
    }, [fetchInvestments])

    return {
        investments,
        loading,
        error,
        fetchInvestments,
        createInvestment,
        updateInvestment,
        deleteInvestment,
    }
}
