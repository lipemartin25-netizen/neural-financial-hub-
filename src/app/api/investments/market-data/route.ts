// src/app/api/investments/market-data/route.ts
import { NextResponse } from 'next/server';
import { MarketDataService } from '@/lib/investments/market-data';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const symbolsParam = searchParams.get('symbols');

        // Se não passar símbolos, podemos buscar os trending ou os que o usuário já possui
        if (!symbolsParam) {
            const supabase = await createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                // Tenta buscar símbolos da carteira do usuário para atualizar preços
                const { data: positions } = await supabase
                    .from('investment_positions')
                    .select('symbol')
                    .limit(10); // Limite para evitar abuso

                const mySymbols = positions?.map(p => p.symbol) || [];
                if (mySymbols.length > 0) {
                    const quotes = await MarketDataService.fetchQuotes(mySymbols);
                    return NextResponse.json({ data: quotes });
                }
            }

            // Default: Trending assets
            const trending = await MarketDataService.getTrendingAssets();
            return NextResponse.json({ data: trending });
        }

        const symbols = symbolsParam.split(',').map(s => s.trim().toUpperCase());
        const quotes = await MarketDataService.fetchQuotes(symbols);

        return NextResponse.json({ data: quotes });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
