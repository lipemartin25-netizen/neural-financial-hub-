'use client'

import { useCallback, useEffect, useState } from 'react'
import type { Boleto } from '@/types/database'

export type BoletoFilters = {
    status?: 'pending' | 'paid' | 'overdue' | 'cancelled' | 'scheduled'
    search?: string
}

export function useBoletos(initialFilters: BoletoFilters = {}) {
    const [boletos, setBoletos] = useState<Boleto[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchBoletos = useCallback(async (filters: BoletoFilters = {}) => {
        setLoading(true)
        setError(null)

        const params = new URLSearchParams()
        if (filters.status) params.set('status', filters.status)
        if (filters.search) params.set('search', filters.search)

        try {
            const res = await fetch(`/api/boletos?${params.toString()}`)
            if (!res.ok) {
                const body = await res.json().catch(() => ({}))
                throw new Error(body.error || `HTTP ${res.status}`)
            }
            const json = await res.json()
            setBoletos(json.data ?? [])
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Erro ao carregar boletos'
            setError(message)
            setBoletos([])
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchBoletos(initialFilters)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const createBoleto = useCallback(async (payload: {
        beneficiary_name: string
        amount: number | string
        due_date: string
        type?: string
        notes?: string | null
        barcode?: string | null
        is_recurring?: boolean
    }) => {
        try {
            const res = await fetch('/api/boletos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })
            if (!res.ok) {
                const body = await res.json().catch(() => ({}))
                throw new Error(body.error || `HTTP ${res.status}`)
            }
            await fetchBoletos(initialFilters)
            return { error: null }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Erro ao criar boleto'
            return { error: message }
        }
    }, [fetchBoletos, initialFilters])

    const updateBoleto = useCallback(async (id: string, payload: Record<string, unknown>) => {
        try {
            const res = await fetch('/api/boletos', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, ...payload }),
            })
            if (!res.ok) {
                const body = await res.json().catch(() => ({}))
                throw new Error(body.error || `HTTP ${res.status}`)
            }
            await fetchBoletos(initialFilters)
            return { error: null }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Erro ao atualizar boleto'
            return { error: message }
        }
    }, [fetchBoletos, initialFilters])

    const deleteBoleto = useCallback(async (id: string) => {
        try {
            const res = await fetch(`/api/boletos?id=${id}`, { method: 'DELETE' })
            if (!res.ok) {
                const body = await res.json().catch(() => ({}))
                throw new Error(body.error || `HTTP ${res.status}`)
            }
            await fetchBoletos(initialFilters)
            return { error: null }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Erro ao excluir boleto'
            return { error: message }
        }
    }, [fetchBoletos, initialFilters])

    const markAsPaid = useCallback(async (id: string) => {
        return updateBoleto(id, {
            status: 'paid',
            payment_date: new Date().toISOString(),
        })
    }, [updateBoleto])

    return {
        boletos,
        loading,
        error,
        fetchBoletos,
        createBoleto,
        updateBoleto,
        deleteBoleto,
        markAsPaid,
    }
}
