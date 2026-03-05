import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Supabase admin (sem RLS) para webhook
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { event, data } = body
        console.log('[Pluggy Webhook] Event:', event, 'Data:', JSON.stringify(data))
        if (event === 'item/updated' || event === 'item/created') {
            const itemId = data?.item?.id || data?.id
            if (itemId) {
                // Atualizar status da conexão
                await supabaseAdmin
                    .from('bank_connections')
                    .update({
                        status: data?.item?.status || data?.status || 'UPDATED',
                        last_sync_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                    })
                    .eq('pluggy_item_id', itemId)
            }
        }
        if (event === 'item/error') {
            const itemId = data?.item?.id || data?.id
            if (itemId) {
                await supabaseAdmin
                    .from('bank_connections')
                    .update({
                        status: 'LOGIN_ERROR',
                        updated_at: new Date().toISOString(),
                    })
                    .eq('pluggy_item_id', itemId)
            }
        }
        return NextResponse.json({ received: true })
    } catch (error: any) {
        console.error('[Pluggy Webhook] Error:', error)
        return NextResponse.json({ received: true }, { status: 200 })
    }
}
