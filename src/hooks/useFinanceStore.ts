import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
    TransactionWithCategory,
    Boleto,
    Account,
    Category,
    Budget,
    Goal,
    Asset,
    Liability,
    RetirementPlan
} from '@/types/database'

interface FinanceState {
    transactions: TransactionWithCategory[]
    boletos: Boleto[]
    accounts: Account[]
    categories: Category[]
    loading: boolean
    error: string | null

    // Budgets
    budgets: Budget[]
    fetchBudgets: (month?: string) => Promise<void>
    upsertBudget: (payload: Partial<Budget>) => Promise<{ error?: string }>
    deleteBudget: (id: string) => Promise<{ error?: string }>

    // Goals
    goals: Goal[]
    fetchGoals: () => Promise<void>
    addGoal: (payload: Partial<Goal>) => Promise<{ error?: string }>
    updateGoal: (id: string, payload: Partial<Goal>) => Promise<{ error?: string }>
    deleteGoal: (id: string) => Promise<{ error?: string }>

    // Assets
    assets: Asset[]
    fetchAssets: () => Promise<void>
    addAsset: (payload: Partial<Asset>) => Promise<{ error?: string }>
    updateAsset: (id: string, payload: Partial<Asset>) => Promise<{ error?: string }>
    deleteAsset: (id: string) => Promise<{ error?: string }>

    // Liabilities
    liabilities: Liability[]
    fetchLiabilities: () => Promise<void>
    addLiability: (payload: Partial<Liability>) => Promise<{ error?: string }>
    updateLiability: (id: string, payload: Partial<Liability>) => Promise<{ error?: string }>
    deleteLiability: (id: string) => Promise<{ error?: string }>

    // Retirement
    retirementPlan: RetirementPlan | null
    fetchRetirement: () => Promise<void>
    saveRetirement: (payload: Partial<RetirementPlan>) => Promise<{ error?: string }>

    // Reports
    reportData: { monthly: any[]; categories: any[] } | null
    fetchReportData: () => Promise<void>

    // Core Actions
    fetchTransactions: (filters?: any) => Promise<void>
    fetchBoletos: (filters?: any) => Promise<void>
    fetchAccounts: () => Promise<void>
    fetchCategories: () => Promise<void>

    addTransaction: (tx: any) => Promise<{ error: string | null }>
    updateTransaction: (id: string, updates: any) => Promise<{ error: string | null }>
    deleteTransaction: (id: string) => Promise<{ error: string | null }>
    addBoleto: (boleto: any) => Promise<{ error: string | null }>
    updateBoleto: (id: string, updates: any) => Promise<{ error: string | null }>
    deleteBoleto: (id: string) => Promise<{ error: string | null }>
    markAsPaid: (id: string, accountId?: string) => Promise<{ error: string | null }>
}

export const useFinanceStore = create<FinanceState>()(
    persist(
        (set, get) => ({
            transactions: [],
            boletos: [],
            accounts: [],
            categories: [],
            budgets: [],
            goals: [],
            assets: [],
            liabilities: [],
            retirementPlan: null,
            reportData: null,
            loading: false,
            error: null,

            fetchAccounts: async () => {
                try {
                    const res = await fetch('/api/accounts')
                    if (!res.ok) throw new Error('Erro ao buscar contas')
                    const json = await res.json()
                    set({ accounts: json.data || [] })
                } catch (err: any) {
                    console.error(err)
                }
            },

            fetchCategories: async () => {
                try {
                    const res = await fetch('/api/categories')
                    if (!res.ok) throw new Error('Erro ao buscar categorias')
                    const json = await res.json()
                    set({ categories: json.data || [] })
                } catch (err: any) {
                    console.error(err)
                }
            },

            fetchTransactions: async (filters = {}) => {
                set({ loading: true, error: null })
                try {
                    const params = new URLSearchParams(filters)
                    const res = await fetch(`/api/transactions?${params.toString()}`)
                    const json = await res.json()
                    if (!res.ok) throw new Error(json.error)
                    set({ transactions: json.data || [] })
                } catch (err: any) {
                    set({ error: err.message })
                } finally {
                    set({ loading: false })
                }
            },

            fetchBoletos: async (filters = {}) => {
                set({ loading: true, error: null })
                try {
                    const params = new URLSearchParams(filters)
                    const res = await fetch(`/api/boletos?${params.toString()}`)
                    const json = await res.json()
                    if (!res.ok) throw new Error(json.error)
                    set({ boletos: json.data || [] })
                } catch (err: any) {
                    set({ error: err.message })
                } finally {
                    set({ loading: false })
                }
            },

            // ─── BUDGETS ───
            fetchBudgets: async (month) => {
                const res = await fetch(`/api/budgets${month ? `?month=${month}` : ''}`)
                const data = await res.json()
                if (!res.ok) return
                set({ budgets: data })
            },
            upsertBudget: async (payload) => {
                const res = await fetch('/api/budgets', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                })
                const data = await res.json()
                if (!res.ok) return { error: data.error }
                get().fetchBudgets()
                return {}
            },
            deleteBudget: async (id) => {
                const res = await fetch(`/api/budgets?id=${id}`, { method: 'DELETE' })
                if (!res.ok) { const d = await res.json(); return { error: d.error } }
                set({ budgets: get().budgets.filter(b => b.id !== id) })
                return {}
            },

            // ─── GOALS ───
            fetchGoals: async () => {
                const res = await fetch('/api/goals')
                const data = await res.json()
                if (!res.ok) return
                set({ goals: data })
            },
            addGoal: async (payload) => {
                const res = await fetch('/api/goals', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                })
                const data = await res.json()
                if (!res.ok) return { error: data.error }
                set({ goals: [data, ...get().goals] })
                return {}
            },
            updateGoal: async (id, payload) => {
                const res = await fetch('/api/goals', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id, ...payload }),
                })
                const data = await res.json()
                if (!res.ok) return { error: data.error }
                set({ goals: get().goals.map(g => g.id === id ? data : g) })
                return {}
            },
            deleteGoal: async (id) => {
                const res = await fetch(`/api/goals?id=${id}`, { method: 'DELETE' })
                if (!res.ok) { const d = await res.json(); return { error: d.error } }
                set({ goals: get().goals.filter(g => g.id !== id) })
                return {}
            },

            // ─── ASSETS ───
            fetchAssets: async () => {
                const res = await fetch('/api/assets')
                const data = await res.json()
                if (!res.ok) return
                set({ assets: data })
            },
            addAsset: async (payload) => {
                const res = await fetch('/api/assets', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                })
                const data = await res.json()
                if (!res.ok) return { error: data.error }
                set({ assets: [data, ...get().assets] })
                return {}
            },
            updateAsset: async (id, payload) => {
                const res = await fetch('/api/assets', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id, ...payload }),
                })
                const data = await res.json()
                if (!res.ok) return { error: data.error }
                set({ assets: get().assets.map(a => a.id === id ? data : a) })
                return {}
            },
            deleteAsset: async (id) => {
                const res = await fetch(`/api/assets?id=${id}`, { method: 'DELETE' })
                if (!res.ok) { const d = await res.json(); return { error: d.error } }
                set({ assets: get().assets.filter(a => a.id !== id) })
                return {}
            },

            // ─── LIABILITIES ───
            fetchLiabilities: async () => {
                const res = await fetch('/api/liabilities')
                const data = await res.json()
                if (!res.ok) return
                set({ liabilities: data })
            },
            addLiability: async (payload) => {
                const res = await fetch('/api/liabilities', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                })
                const data = await res.json()
                if (!res.ok) return { error: data.error }
                set({ liabilities: [data, ...get().liabilities] })
                return {}
            },
            updateLiability: async (id, payload) => {
                const res = await fetch('/api/liabilities', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id, ...payload }),
                })
                const data = await res.json()
                if (!res.ok) return { error: data.error }
                set({ liabilities: get().liabilities.map(l => l.id === id ? data : l) })
                return {}
            },
            deleteLiability: async (id) => {
                const res = await fetch(`/api/liabilities?id=${id}`, { method: 'DELETE' })
                if (!res.ok) { const d = await res.json(); return { error: d.error } }
                set({ liabilities: get().liabilities.filter(l => l.id !== id) })
                return {}
            },

            // ─── RETIREMENT ───
            fetchRetirement: async () => {
                const res = await fetch('/api/retirement')
                const data = await res.json()
                if (res.ok) set({ retirementPlan: data })
            },
            saveRetirement: async (payload) => {
                const res = await fetch('/api/retirement', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                })
                const data = await res.json()
                if (!res.ok) return { error: data.error }
                set({ retirementPlan: data })
                return {}
            },

            // ─── REPORTS ───
            fetchReportData: async () => {
                const res = await fetch('/api/reports')
                const data = await res.json()
                if (res.ok) set({ reportData: data })
            },

            addTransaction: async (tx) => {
                try {
                    const res = await fetch('/api/transactions', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(tx)
                    })
                    const json = await res.json()
                    if (!res.ok) throw new Error(json.error)

                    await get().fetchTransactions()
                    await get().fetchAccounts() // Refresh balances
                    return { error: null }
                } catch (err: any) {
                    return { error: err.message }
                }
            },

            updateTransaction: async (id, updates) => {
                try {
                    const res = await fetch('/api/transactions', {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id, ...updates })
                    })
                    const json = await res.json()
                    if (!res.ok) throw new Error(json.error)

                    await get().fetchTransactions()
                    await get().fetchAccounts()
                    return { error: null }
                } catch (err: any) {
                    return { error: err.message }
                }
            },

            addBoleto: async (boleto) => {
                try {
                    const res = await fetch('/api/boletos', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(boleto)
                    })
                    const json = await res.json()
                    if (!res.ok) throw new Error(json.error)

                    await get().fetchBoletos()
                    return { error: null }
                } catch (err: any) {
                    return { error: err.message }
                }
            },

            updateBoleto: async (id, updates) => {
                try {
                    const res = await fetch('/api/boletos', {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id, ...updates })
                    })
                    const json = await res.json()
                    if (!res.ok) throw new Error(json.error)

                    await get().fetchBoletos()
                    if (updates.status === 'paid') {
                        await get().fetchTransactions()
                        await get().fetchAccounts()
                    }

                    return { error: null }
                } catch (err: any) {
                    return { error: err.message }
                }
            },

            deleteBoleto: async (id) => {
                try {
                    const res = await fetch(`/api/boletos?id=${id}`, { method: 'DELETE' })
                    if (!res.ok) throw new Error('Erro ao excluir')
                    await get().fetchBoletos()
                    return { error: null }
                } catch (err: any) {
                    return { error: err.message }
                }
            },

            deleteTransaction: async (id) => {
                try {
                    const res = await fetch(`/api/transactions?id=${id}`, { method: 'DELETE' })
                    if (!res.ok) throw new Error('Erro ao excluir')
                    await get().fetchTransactions()
                    await get().fetchAccounts()
                    return { error: null }
                } catch (err: any) {
                    return { error: err.message }
                }
            },

            markAsPaid: async (id, accountId) => {
                return get().updateBoleto(id, {
                    status: 'paid',
                    payment_date: new Date().toISOString(),
                    account_id: accountId
                })
            }
        }),
        {
            name: 'finance-storage',
            partialize: (state) => ({
                transactions: state.transactions,
                boletos: state.boletos,
                accounts: state.accounts,
                categories: state.categories,
                budgets: state.budgets,
                goals: state.goals,
                assets: state.assets,
                liabilities: state.liabilities,
                retirementPlan: state.retirementPlan
            }),
        }
    )
)
