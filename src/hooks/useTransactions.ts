
'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { TransactionWithCategory } from '@/types/database'

export type TransactionFilters = {
    type?: 'income' | 'expense' | 'transfer'
    account_id?: string
    category_id?: string
    date_from?: string
    date_to?: string
    page?: number
    limit?: number
}

export function useTransactions(initialFilters: TransactionFilters = {}) {
    const [transactions, setTransactions] = useState<TransactionWithCategory[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [count, setCount] = useState(0)
    const supabase = createClient()

    const fetchTransactions = useCallback(async (filters: TransactionFilters = {}) => {
        setLoading(true)
        setError(null)

        let query = supabase
            .from('transactions')
            .select('*, categories(id, name, icon, color), accounts(id, name, type, color)', { count: 'exact' })
            .order('date', { ascending: false })
            .order('created_at', { ascending: false })

        if (filters.type) query = query.eq('type', filters.type)
        if (filters.account_id) query = query.eq('account_id', filters.account_id)
        if (filters.category_id) query = query.eq('category_id', filters.category_id)
        if (filters.date_from) query = query.gte('date', filters.date_from)
        if (filters.date_to) query = query.lte('date', filters.date_to)

        const page = filters.page ?? 1
        const limit = filters.limit ?? 100
        const offset = (page - 1) * limit
        query = query.range(offset, offset + limit - 1)

        try {
            const { data, count: total, error: err } = await query
            if (err) throw err
            setTransactions((data as any) ?? [])
            setCount(total ?? 0)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }, [supabase])

    useEffect(() => {
        fetchTransactions(initialFilters)
    }, [fetchTransactions, initialFilters])

    const createTransaction = useCallback(async (payload: {
        account_id: string
        amount: number | string
        type: 'income' | 'expense' | 'transfer'
        description: string
        date?: string
        category_id?: string | null
        notes?: string | null
        is_recurring?: boolean
        tags?: string[] | null
    }) => {
        try {
            // 1. Inserir transação
            const { data: tx, error: txErr } = await supabase
                .from('transactions')
                .insert([{
                    ...payload,
                    amount: Number(payload.amount),
                    date: payload.date || new Date().toISOString().split('T')[0]
                }])
                .select()
                .single()

            if (txErr) throw txErr

            // 2. Buscar saldo atual da conta
            const { data: acc, error: accErr } = await supabase
                .from('accounts')
                .select('balance')
                .eq('id', payload.account_id)
                .single()

            if (accErr) throw accErr

            // 3. Calcular novo saldo
            const currentBalance = Number(acc.balance || 0)
            const amount = Number(payload.amount)
            const newBalance = payload.type === 'income' ? currentBalance + amount : currentBalance - amount

            // 4. Atualizar saldo direto (REMOVIDO RPC conforme pedido)
            const { error: upErr } = await supabase
                .from('accounts')
                .update({ balance: newBalance })
                .eq('id', payload.account_id)

            if (upErr) throw upErr

            await fetchTransactions(initialFilters)
            return { success: true, data: tx, error: null }
        } catch (err: any) {
            console.error('Erro ao criar transação:', err)
            return { success: false, data: null, error: err.message }
        }
    }, [supabase, fetchTransactions, initialFilters])

    const deleteTransaction = useCallback(async (id: string) => {
        try {
            // 1. Buscar transação para reverter saldo
            const { data: tx, error: txErr } = await supabase
                .from('transactions')
                .select('amount, type, account_id')
                .eq('id', id)
                .single()

            if (txErr) throw txErr

            // 2. Deletar
            const { error: delErr } = await supabase
                .from('transactions')
                .delete()
                .eq('id', id)

            if (delErr) throw delErr

            // 3. Reverter saldo
            const { data: acc } = await supabase.from('accounts').select('balance').eq('id', tx.account_id).single()
            if (acc) {
                const currentBalance = Number(acc.balance)
                const amount = Number(tx.amount)
                const newBalance = tx.type === 'income' ? currentBalance - amount : currentBalance + amount
                await supabase.from('accounts').update({ balance: newBalance }).eq('id', tx.account_id)
            }

            await fetchTransactions(initialFilters)
            return { error: null }
        } catch (err: any) {
            return { error: err.message }
        }
    }, [supabase, fetchTransactions, initialFilters])

    return {
        transactions,
        loading,
        error,
        count,
        fetchTransactions,
        createTransaction,
        deleteTransaction,
    }
}
