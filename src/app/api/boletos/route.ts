import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// ========== GET ==========
export async function GET(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status')
        const search = searchParams.get('search')

        let query = supabase
            .from('boletos')
            .select('*')
            .eq('user_id', user.id)
            .order('due_date', { ascending: true })

        if (status) query = query.eq('status', status)
        if (search) query = query.ilike('beneficiary_name', `%${search}%`)

        const { data, error } = await query
        if (error) throw error

        // Auto-detect overdue boletos
        const now = new Date()
        const today = now.toISOString().split('T')[0]
        const processed = (data ?? []).map(b => {
            if (b.status === 'pending' && b.due_date < today) {
                return { ...b, status: 'overdue' as const }
            }
            return b
        })

        return NextResponse.json({ data: processed })
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Internal error'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}

// ========== POST ==========
export async function POST(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await request.json()
        const { beneficiary_name, amount, due_date, type, notes, barcode, is_recurring } = body

        if (!beneficiary_name || !amount || !due_date) {
            return NextResponse.json({ error: 'Campos obrigatórios: beneficiary_name, amount, due_date' }, { status: 400 })
        }

        // Determine status based on due date
        const today = new Date().toISOString().split('T')[0]
        const initialStatus = due_date < today ? 'overdue' : 'pending'

        const { data, error } = await supabase
            .from('boletos')
            .insert({
                user_id: user.id,
                beneficiary_name,
                amount: parseFloat(amount),
                due_date,
                type: type ?? 'utility',
                status: initialStatus,
                notes: notes ?? null,
                barcode: barcode ?? null,
                is_recurring: is_recurring ?? false,
                dda_detected: false,
                ai_categorized: false,
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

// ========== PATCH ==========
export async function PATCH(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await request.json()
        const { id, ...updates } = body

        if (!id) return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 })

        // Verify ownership
        const { data: existing } = await supabase
            .from('boletos')
            .select('id')
            .eq('id', id)
            .eq('user_id', user.id)
            .single()

        if (!existing) return NextResponse.json({ error: 'Boleto não encontrado' }, { status: 404 })

        // Clean forbidden fields
        delete updates.user_id
        delete updates.created_at

        if (updates.amount != null) {
            updates.amount = parseFloat(updates.amount)
        }

        const { data, error } = await supabase
            .from('boletos')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .eq('user_id', user.id)
            .select()
            .single()

        if (error) throw error

        return NextResponse.json({ data })
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Internal error'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}

// ========== DELETE ==========
export async function DELETE(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 })

        const { error } = await supabase
            .from('boletos')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id)

        if (error) throw error

        return NextResponse.json({ success: true })
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Internal error'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
