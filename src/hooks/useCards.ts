'use client'

import { useCallback, useEffect, useState } from 'react'

export type InvoiceItem = {
    id: string
    description: string
    amount: number
    date: string
    category_id: string | null
}

export type CardData = {
    id: string
    name: string
    bank_name: string | null
    last4: string
    limit: number
    used: number
    closing_day: number
    due_day: number
    color: string
    icon: string | null
    invoice: InvoiceItem[]
}

export function useCards() {
    const [cards, setCards] = useState<CardData[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchCards = useCallback(async () => {
        setLoading(true)
        setError(null)

        try {
            const res = await fetch('/api/cards')
            if (!res.ok) {
                const body = await res.json().catch(() => ({}))
                throw new Error(body.error || `HTTP ${res.status}`)
            }
            const json = await res.json()
            setCards(json.data ?? [])
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Erro ao carregar cartões'
            setError(message)
            setCards([])
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchCards()
    }, [fetchCards])

    const createCard = useCallback(async (payload: {
        name: string
        bank_name?: string
        last4?: string
        credit_limit: number | string
        closing_day?: number | string
        due_day?: number | string
        color?: string
    }) => {
        try {
            const res = await fetch('/api/cards', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })
            if (!res.ok) {
                const body = await res.json().catch(() => ({}))
                throw new Error(body.error || `HTTP ${res.status}`)
            }
            await fetchCards()
            return { error: null }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Erro ao criar cartão'
            return { error: message }
        }
    }, [fetchCards])

    const updateCard = useCallback(async (id: string, payload: Record<string, unknown>) => {
        try {
            const res = await fetch('/api/cards', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, ...payload }),
            })
            if (!res.ok) {
                const body = await res.json().catch(() => ({}))
                throw new Error(body.error || `HTTP ${res.status}`)
            }
            await fetchCards()
            return { error: null }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Erro ao atualizar cartão'
            return { error: message }
        }
    }, [fetchCards])

    const deleteCard = useCallback(async (id: string) => {
        try {
            const res = await fetch(`/api/cards?id=${id}`, { method: 'DELETE' })
            if (!res.ok) {
                const body = await res.json().catch(() => ({}))
                throw new Error(body.error || `HTTP ${res.status}`)
            }
            await fetchCards()
            return { error: null }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Erro ao excluir cartão'
            return { error: message }
        }
    }, [fetchCards])

    return { cards, loading, error, fetchCards, createCard, updateCard, deleteCard }
}
