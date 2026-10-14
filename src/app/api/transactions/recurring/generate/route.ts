import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

function getNextDate(current: string, frequency: string): string {
    const d = new Date(current + 'T12:00:00')
    switch (frequency) {
        case 'daily': d.setDate(d.getDate() + 1); break
        case 'weekly': d.setDate(d.getDate() + 7); break
        case 'monthly': d.setMonth(d.getMonth() + 1); break
        case 'yearly': d.setFullYear(d.getFullYear() + 1); break
    }
    return d.toISOString().split('T')[0]
}

// POST — gera transações pendentes para recorrentes atrasadas
export async function POST() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const today = new Date().toISOString().split('T')[0]

        // Buscar recorrentes com next_date <= hoje
        const { data: recurrings, error } = await supabase
            .from('recurring_transactions')
            .select('*')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .lte('next_date', today)

        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        if (!recurrings || recurrings.length === 0) {
            return NextResponse.json({ data: { generated: 0 } })
        }

        let generated = 0

        for (const rec of recurrings) {
            let nextDate = rec.next_date as string

            // Gerar todas as transações atrasadas (até hoje)
            while (nextDate <= today) {
                await supabase.from('transactions').insert({
                    user_id: user.id,
                    account_id: rec.account_id,
                    amount: rec.amount,
                    type: rec.type,
                    description: rec.description,
                    date: nextDate,
                    category_id: rec.category_id,
                    notes: `Auto-gerado (recorrente: ${rec.frequency})`,
                })

                generated++
                nextDate = getNextDate(nextDate, rec.frequency)
            }

            // Atualizar next_date
            await supabase
                .from('recurring_transactions')
                .update({ next_date: nextDate })
                .eq('id', rec.id)
        }

        return NextResponse.json({ data: { generated } })
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Internal error'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
