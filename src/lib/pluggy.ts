/**
 * Módulo Pluggy Desativado Temporariamente
 * Arquivos originais salvos em: disabled_features/pluggy/lib/pluggy.ts
 */

export function getPluggyClient(): any {
    return null
}

export async function createConnectToken(_userId?: string): Promise<string> {
    throw new Error('Pluggy integration is currently disabled.')
}

export async function fetchAccounts(_itemId: string): Promise<any> {
    return { results: [] }
}

export async function fetchTransactions(_accountId: string, _filters?: any): Promise<any> {
    return { results: [] }
}

export async function fetchItem(_itemId: string): Promise<any> {
    return null
}

export async function fetchInvoices(_accountId: string, _options?: any): Promise<any> {
    return { results: [] }
}

export function mapPluggyCategory(_pluggyCategory?: string | null): string {
    return 'other_expense'
}
