import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// ========== GET — Buscar perfil ==========
export async function GET() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()

        if (error) throw error

        return NextResponse.json({
            data: {
                ...data,
                email: user.email,
                auth_provider: user.app_metadata?.provider ?? 'email',
                last_sign_in: user.last_sign_in_at,
            }
        })
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Internal error'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}

// ========== PATCH — Atualizar perfil ==========
export async function PATCH(request: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await request.json()
        const allowed = [
            'full_name', 'phone', 'date_of_birth', 'currency', 'locale',
            'timezone', 'monthly_income', 'financial_goal', 'is_mei',
            'avatar_url',
        ]

        const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
        for (const key of allowed) {
            if (body[key] !== undefined) updates[key] = body[key]
        }

        if (Object.keys(updates).length <= 1) {
            return NextResponse.json({ error: 'Nenhum campo para atualizar' }, { status: 400 })
        }

        const { data, error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', user.id)
            .select()
            .single()

        if (error) throw error
        return NextResponse.json({ data })
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Internal error'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
