import { NextRequest, NextResponse } from 'next/server'

type Quote = {
    ticker: string; price: number; change: number; changePct: number
    name: string; currency: string; timestamp: number
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const tickers = searchParams.get('tickers')

        if (!tickers) return NextResponse.json({ error: 'tickers é obrigatório' }, { status: 400 })

        const tickerList = tickers.split(',').map(t => t.trim().toUpperCase()).filter(Boolean)
        if (tickerList.length === 0) return NextResponse.json({ error: 'Lista vazia' }, { status: 400 })
        if (tickerList.length > 20) return NextResponse.json({ error: 'Máximo 20 tickers' }, { status: 400 })

        // Adicionar sufixo .SA para tickers BR sem sufixo
        const yahooTickers = tickerList.map(t => {
            if (t.endsWith('.SA') || t.endsWith('.F') || t.includes('.')) return t
            // Verificar se parece ticker BR (4-6 chars, letras+números)
            if (/^[A-Z]{4}\d{1,2}$/.test(t)) return `${t}.SA`
            return t
        })

        const quotes: Quote[] = []
        const errors: string[] = []

        // Yahoo Finance v8 API (free, no key needed)
        for (const ticker of yahooTickers) {
            try {
                const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=2d`
                const res = await fetch(url, {
                    headers: { 'User-Agent': 'Mozilla/5.0' },
                    next: { revalidate: 300 }, // Cache 5 min
                })

                if (!res.ok) {
                    errors.push(`${ticker}: HTTP ${res.status}`)
                    continue
                }

                const json = await res.json()
                const meta = json?.chart?.result?.[0]?.meta

                if (!meta) {
                    errors.push(`${ticker}: dados não encontrados`)
                    continue
                }

                const price = meta.regularMarketPrice ?? 0
                const prevClose = meta.previousClose ?? meta.chartPreviousClose ?? price
                const change = price - prevClose
                const changePct = prevClose > 0 ? (change / prevClose) * 100 : 0

                quotes.push({
                    ticker: ticker.replace('.SA', ''),
                    price,
                    change: Math.round(change * 100) / 100,
                    changePct: Math.round(changePct * 100) / 100,
                    name: meta.shortName ?? meta.symbol ?? ticker,
                    currency: meta.currency ?? 'BRL',
                    timestamp: meta.regularMarketTime ?? Date.now() / 1000,
                })
            } catch (err) {
                errors.push(`${ticker}: ${err instanceof Error ? err.message : 'error'}`)
            }
        }

        return NextResponse.json({
            data: { quotes, errors, timestamp: new Date().toISOString() },
        })
    } catch (err: unknown) {
        return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 })
    }
}
