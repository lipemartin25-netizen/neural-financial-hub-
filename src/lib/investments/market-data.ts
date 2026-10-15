// src/lib/investments/market-data.ts

export interface AssetQuote {
    symbol: string;
    price: number;
    changePercent: number;
    name?: string;
    currency?: string;
}

export class MarketDataService {
    static async fetchQuotes(symbols: string[]): Promise<AssetQuote[]> {
        return symbols.map(symbol => {
            const clean = symbol.toUpperCase();
            return {
                symbol: clean,
                price: clean.includes('PETR4') ? 37.85 : clean.includes('VALE3') ? 61.20 : 100.0,
                changePercent: 0.75,
                currency: 'BRL',
                name: clean
            };
        });
    }

    static async getTrendingAssets(): Promise<AssetQuote[]> {
        return [
            { symbol: 'PETR4', price: 37.85, changePercent: 1.25, currency: 'BRL', name: 'Petrobras PN' },
            { symbol: 'VALE3', price: 61.20, changePercent: -0.45, currency: 'BRL', name: 'Vale ON' },
            { symbol: 'ITUB4', price: 35.10, changePercent: 0.80, currency: 'BRL', name: 'Itaú Unibanco' },
            { symbol: 'IVVB11', price: 342.50, changePercent: 0.35, currency: 'BRL', name: 'S&P 500 ETF' },
            { symbol: 'BTC', price: 395000.0, changePercent: 2.10, currency: 'BRL', name: 'Bitcoin' }
        ];
    }
}
