import { PluggyClient } from 'pluggy-sdk'

let client: PluggyClient | null = null

export function getPluggyClient(): PluggyClient {
    if (!client) {
        client = new PluggyClient({
            clientId: process.env.PLUGGY_CLIENT_ID!,
            clientSecret: process.env.PLUGGY_CLIENT_SECRET!,
        })
    }
    return client
}

// Helpers para compatibilidade com código legado
export async function createConnectToken(userId?: string) {
    return getPluggyClient().createConnectToken(userId)
}

export async function fetchAccounts(itemId: string) {
    return getPluggyClient().fetchAccounts(itemId)
}

export async function fetchTransactions(accountId: string, filters: { from?: string, to?: string, pageSize?: number, page?: number } = {}) {
    return getPluggyClient().fetchTransactions(accountId, filters)
}

export async function fetchItem(itemId: string) {
    return getPluggyClient().fetchItem(itemId)
}

export async function fetchInvoices(accountId: string, from?: string, to?: string) {
    return getPluggyClient().fetchInvoices(accountId, { from, to })
}

/**
 * Mapeia categorias do Pluggy para as categorias internas do Neural Finance Hub
 */
export function mapPluggyCategory(pluggyCategory?: string | null): string {
    if (!pluggyCategory) return 'other_expense'

    const cat = pluggyCategory.toLowerCase()

    // Mapeamento (Exemplos comuns do Pluggy)
    if (cat.includes('food') || cat.includes('alimentação') || cat.includes('restaurante')) return 'food'
    if (cat.includes('transport') || cat.includes('transporte') || cat.includes('viagem') || cat.includes('combustível')) return 'transport'
    if (cat.includes('housing') || cat.includes('moradia') || cat.includes('aluguel') || cat.includes('casa')) return 'housing'
    if (cat.includes('health') || cat.includes('saúde') || cat.includes('farmácia')) return 'health'
    if (cat.includes('education') || cat.includes('educação')) return 'education'
    if (cat.includes('entertainment') || cat.includes('lazer') || cat.includes('streaming')) return 'entertainment'
    if (cat.includes('shopping') || cat.includes('compras') || cat.includes('e-commerce')) return 'shopping'
    if (cat.includes('service') || cat.includes('assinatura') || cat.includes('subscriptions')) return 'subscriptions'
    if (cat.includes('utilities') || cat.includes('contas') || cat.includes('luz') || cat.includes('água')) return 'utilities'
    if (cat.includes('insurance') || cat.includes('seguro')) return 'insurance'
    if (cat.includes('pet')) return 'pets'
    if (cat.includes('personal') || cat.includes('cuidados pessoais')) return 'personal'
    if (cat.includes('salary') || cat.includes('salário') || cat.includes('income') || cat.includes('receita')) return 'salary'
    if (cat.includes('investment') || cat.includes('investimento')) return 'investments_return'

    return 'other_expense'
}
