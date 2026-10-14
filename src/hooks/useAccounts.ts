'use client'

import { useCallback, useEffect, useState } from 'react'
import type { Account } from '@/types/database'

export function useAccounts() {
    const [accounts, setAccounts] = useState<Account[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchAccounts = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const res = await fetch('/api/accounts')
            if (!res.ok) {
                const body = await res.json().catch(() => ({}))
                throw new Error(body.error || `HTTP ${res.status}`)
            }
            const json = await res.json()
            setAccounts(json.data ?? [])
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Erro ao carregar contas'
            setError(message)
            setAccounts([])
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchAccounts()
    }, [fetchAccounts])

    const createAccount = useCallback(async (payload: {
        name: string
        type: Account['type']
        bank_name?: string | null
        balance?: number
        credit_limit?: number | null
        color?: string
    }) => {
        try {
            const res = await fetch('/api/accounts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })
            if (!res.ok) {
                const body = await res.json().catch(() => ({}))
                throw new Error(body.error || `HTTP ${res.status}`)
            }
            await fetchAccounts()
            return { error: null }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Erro ao criar conta'
            return { error: message }
        }
    }, [fetchAccounts])

    const deleteAccount = useCallback(async (id: string) => {
        try {
            const res = await fetch(`/api/accounts?id=${id}`, { method: 'DELETE' })
            if (!res.ok) {
                const body = await res.json().catch(() => ({}))
                throw new Error(body.error || `HTTP ${res.status}`)
            }
            await fetchAccounts()
            return { error: null }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Erro ao excluir conta'
            return { error: message }
        }
    }, [fetchAccounts])

    const updateAccount = useCallback(async (id: string, payload: Record<string, unknown>) => {
        try {
            const res = await fetch('/api/accounts', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, ...payload }),
            })
            if (!res.ok) {
                const body = await res.json().catch(() => ({}))
                throw new Error(body.error || `HTTP ${res.status}`)
            }
            await fetchAccounts()
            return { error: null }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Erro ao atualizar conta'
            return { error: message }
        }
    }, [fetchAccounts])

    return {
        accounts,
        loading,
        error,
        fetchAccounts,
        createAccount,
        updateAccount,
        deleteAccount,
    }
}
