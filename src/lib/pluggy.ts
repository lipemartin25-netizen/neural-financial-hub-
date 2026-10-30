/**
 * Módulo Pluggy Desativado Temporariamente
 * Arquivos originais salvos em: disabled_features/pluggy/lib/pluggy.ts
 */

export class PluggyDisabledError extends Error {
    constructor() {
        super('Pluggy integration is currently disabled.')
        this.name = 'PluggyDisabledError'
    }
}

export function getPluggyClient(): any {
    return null
}

export async function createConnectToken(_userId?: string): Promise<string> {
    throw new PluggyDisabledError()
}

export async function fetchAccounts(_itemId: string): Promise<any> {
    throw new PluggyDisabledError()
}

export async function fetchTransactions(_accountId: string, _filters?: any): Promise<any> {
    throw new PluggyDisabledError()
}

export async function fetchItem(_itemId: string): Promise<any> {
    throw new PluggyDisabledError()
}

export async function fetchInvoices(_accountId: string, _options?: any): Promise<any> {
    throw new PluggyDisabledError()
}

export function mapPluggyCategory(_pluggyCategory?: string | null): string {
    return 'other_expense'
}
