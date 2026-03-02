import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await request.json()
        const { title, recipient, amount, due_date, barcode, category_id, status } = body

        if (!title || !recipient || !amount || !due_date) {
            return NextResponse.json({ error: 'Faltam dados obrigatórios' }, { status: 400 })
        }

        const { data, error } = await supabase
            .from('boletos')
            .insert({
                user_id: user.id,
                title,
                recipient,
                amount,
                due_date,
                barcode: barcode || null,
                category_id: category_id || null,
                status: status || 'pending'
            })
            .select()
            .single()

        if (error) throw error

        return NextResponse.json({ data }, { status: 201 })
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Internal error'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
