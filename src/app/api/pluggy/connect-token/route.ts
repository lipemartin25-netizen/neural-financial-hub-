import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getPluggyClient } from '@/lib/pluggy'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
    try {
        const cookieStore = await cookies()
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll()
                    },
                    setAll() { },
                },
            }
        )
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        const pluggy = getPluggyClient()
        // Opcionalmente receber itemId para reconexão
        const body = await request.json().catch(() => ({}))
        const { itemId } = body
        const connectToken = await pluggy.createConnectToken(itemId || undefined)
        return NextResponse.json({ connectToken })
    } catch (error: any) {
        console.error('[Pluggy] Connect token error:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to create connect token' },
            { status: 500 }
        )
    }
}
