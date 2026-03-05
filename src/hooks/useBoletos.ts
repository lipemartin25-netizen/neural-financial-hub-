
'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Boleto } from '@/types/database'
import { useTransactions } from './useTransactions'

export type BoletoFilters = {
    status?: 'pending' | 'paid' | 'overdue' | 'cancelled' | 'scheduled'
    search?: string
}

export function useBoletos(initialFilters: BoletoFilters = {}) {
    const [boletos, setBoletos] = useState<Boleto[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const supabase = createClient()
    const { createTransaction } = useTransactions()

    const fetchBoletos = useCallback(async (filters: BoletoFilters = {}) => {
        setLoading(true)
        setError(null)

        let query = supabase.from('boletos').select('*').order('due_date', { ascending: true })

        if (filters.status && filters.status !== 'all') query = query.eq('status', filters.status)
        if (filters.search) query = query.ilike('beneficiary_name', `%${filters.search}%`)

        try {
            const { data, error: err } = await query
            if (err) throw err
            setBoletos(data || [])
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }, [supabase])

    useEffect(() => {
        fetchBoletos(initialFilters)
    }, [fetchBoletos, initialFilters])

    const createBoleto = useCallback(async (payload: any) => {
        try {
            const { error: err } = await supabase.from('boletos').insert([payload])
            if (err) throw err
            await fetchBoletos(initialFilters)
            return { error: null }
        } catch (err: any) {
            return { error: err.message }
        }
    }, [supabase, fetchBoletos, initialFilters])

    const updateBoleto = useCallback(async (id: string, payload: any) => {
        try {
            const { error: err } = await supabase.from('boletos').update(payload).eq('id', id)
            if (err) throw err
            await fetchBoletos(initialFilters)
            return { error: null }
        } catch (err: any) {
            return { error: err.message }
        }
    }, [supabase, fetchBoletos, initialFilters])

    const markAsPaid = useCallback(async (id: string, accountId?: string) => {
        if (!accountId) {
            return { error: 'Por favor, selecione uma conta para realizar o pagamento.' }
        }

        try {
            // 1. Buscar dados do boleto
            const { data: boleto, error: bErr } = await supabase.from('boletos').select('*').eq('id', id).single()
            if (bErr) throw bErr

            // 2. Criar transação de despesa vinculada
            const { success, error: txErr } = await createTransaction({
                account_id: accountId,
                amount: boleto.amount,
                type: 'expense',
                description: `Pagto: ${boleto.beneficiary_name}`,
                date: new Date().toISOString().split('T')[0],
                notes: `Boleto ID: ${id}`
            })

            if (!success) throw new Error(txErr || 'Erro ao gerar transação')

            // 3. Atualizar boleto
            await updateBoleto(id, {
                status: 'paid',
                payment_date: new Date().toISOString(),
                account_id: accountId
            })

            return { error: null }
        } catch (err: any) {
            return { error: err.message }
        }
    }, [supabase, updateBoleto, createTransaction])

    const exportarCSV = useCallback(() => {
        const headers = ['Beneficiário', 'Valor', 'Vencimento', 'Status']
        const rows = boletos.map(b => [
            b.beneficiary_name,
            b.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
            b.due_date,
            b.status
        ])

        const BOM = '\uFEFF'
        const csvContent = BOM + [
            headers.join(';'),
            ...rows.map(r => r.join(';'))
        ].join('\n')

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', 'boletos.csv')
        link.click()
    }, [boletos])

    return {
        boletos,
        loading,
        error,
        fetchBoletos,
        createBoleto,
        updateBoleto,
        markAsPaid,
        exportarCSV
    }
}
