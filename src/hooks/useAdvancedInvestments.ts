// src/hooks/useAdvancedInvestments.ts
'use client'

import { useState, useEffect, useCallback } from 'react';
import { InvestmentPosition, InvestmentAccount, InvestmentRecommendation, MarketQuote } from '@/types/database';

export function useAdvancedInvestments() {
    const [positions, setPositions] = useState<InvestmentPosition[]>([]);
    const [accounts, setAccounts] = useState<InvestmentAccount[]>([]);
    const [marketQuotes, setMarketQuotes] = useState<Record<string, MarketQuote>>({});
    const [recommendations, setRecommendations] = useState<InvestmentRecommendation[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            // 1. Buscar Posições Reais do DB
            const posRes = await fetch('/api/investments');
            const posJson = await posRes.json();
            const dbPositions = posJson.data || [];

            // Adaptar Investment (antigo) para InvestmentPosition (novo) se necessário
            // Ou buscar da nova tabela se a migração foi feita
            setPositions(dbPositions);

            // 2. Buscar Cotações de Mercado Reais da B3
            const symbols = dbPositions.length > 0
                ? dbPositions.map((p: any) => p.ticker || p.symbol).join(',')
                : 'IBOV,PETR4,VALE3,ITUB4';

            const marketRes = await fetch(`/api/investments/market-data?symbols=${symbols}`);
            const marketJson = await marketRes.json();

            if (marketJson.data) {
                const quotesMap: Record<string, MarketQuote> = {};
                marketJson.data.forEach((q: MarketQuote) => {
                    quotesMap[q.symbol] = q;
                });
                setMarketQuotes(quotesMap);
            }

            // 3. Buscar Recomendações de IA Reais
            const recRes = await fetch('/api/investments/recommendations');
            const recJson = await recRes.json();
            if (recJson.data) setRecommendations(recJson.data);

        } catch (error) {
            console.error('Erro ao carregar dados reais de investimento:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const totalValue = positions.reduce((acc, pos) => {
        const marketPrice = marketQuotes[pos.symbol]?.price || pos.current_price;
        return acc + (pos.quantity * marketPrice);
    }, 0);

    return {
        positions,
        accounts,
        marketQuotes,
        recommendations,
        loading,
        totalValue,
        refresh: fetchData
    };
}
