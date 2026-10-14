'use client'

import { useState, useCallback } from 'react'

type Quote = {
    ticker: string; price: number; change: number; changePct: number
    name: string; currency: string; timestamp: number
}

export function useQuotes() {
    const [quotes, setQuotes] = useState<Record<string, Quote>>({})
    const [loading, setLoading] = useState(false)

    const fetchQuotes = useCallback(async (tickers: string[]) => {
        if (tickers.length === 0) return
        setLoading(true)
        try {
            const res = await fetch(`/api/investments/quote?tickers=${tickers.join(',')}`)
            if (!res.ok) return
            const json = await res.json()
            const map: Record<string, Quote> = {}
            for (const q of json.data?.quotes ?? []) {
                map[q.ticker] = q
            }
            setQuotes(prev => ({ ...prev, ...map }))
        } catch { }
        finally { setLoading(false) }
    }, [])

    return { quotes, loading, fetchQuotes }
}
