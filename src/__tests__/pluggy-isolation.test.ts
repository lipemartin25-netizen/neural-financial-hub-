import { describe, it, expect } from 'vitest'
import {
    getPluggyClient,
    createConnectToken,
    fetchAccounts,
    fetchTransactions,
    fetchItem,
    fetchInvoices,
    mapPluggyCategory,
    PluggyDisabledError
} from '../lib/pluggy'

describe('Pluggy isolation and fail-closed stubs', () => {
    it('getPluggyClient retorna null sem instanciar conexao externa', () => {
        expect(getPluggyClient()).toBeNull()
    })

    it('createConnectToken lanca PluggyDisabledError explicitamente', async () => {
        await expect(createConnectToken('user-123')).rejects.toThrow(PluggyDisabledError)
    })

    it('fetchAccounts lanca PluggyDisabledError', async () => {
        await expect(fetchAccounts('item-123')).rejects.toThrow(PluggyDisabledError)
    })

    it('fetchTransactions lanca PluggyDisabledError', async () => {
        await expect(fetchTransactions('acc-123')).rejects.toThrow(PluggyDisabledError)
    })

    it('fetchItem lanca PluggyDisabledError', async () => {
        await expect(fetchItem('item-123')).rejects.toThrow(PluggyDisabledError)
    })

    it('fetchInvoices lanca PluggyDisabledError', async () => {
        await expect(fetchInvoices('acc-123')).rejects.toThrow(PluggyDisabledError)
    })

    it('mapPluggyCategory degrada para categoria generica segura', () => {
        expect(mapPluggyCategory(null)).toBe('other_expense')
        expect(mapPluggyCategory('SOME_UNKNOWN_CAT')).toBe('other_expense')
    })
})
