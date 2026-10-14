import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import webpush from 'web-push'
if (process.env.VAPID_EMAIL && process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
        process.env.VAPID_EMAIL,
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    )
}
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        const { title, body, userId } = await request.json()
        // Buscar subscriptions do user alvo
        const targetUserId = userId ?? user.id
        const { data: subs } = await supabase
            .from('push_subscriptions')
            .select('*')
            .eq('user_id', targetUserId)
        if (!subs || subs.length === 0) {
            return NextResponse.json({ sent: 0, message: 'Nenhuma subscription encontrada' })
        }
        const payload = JSON.stringify({
            title: title ?? 'Neural Finance Hub',
            body: body ?? 'Você tem uma nova notificação',
            icon: '/icons/icon-192x192.png',
            badge: '/icons/icon-72x72.png',
            data: { url: '/dashboard' },
        })
        let sent = 0
        const failed: string[] = []
        for (const sub of subs) {
            try {
                await webpush.sendNotification({
                    endpoint: sub.endpoint,
                    keys: { p256dh: sub.p256dh, auth: sub.auth },
                }, payload)
                sent++
            } catch {
                failed.push(sub.endpoint)
                // Remover subscriptions inválidas
                await supabase.from('push_subscriptions')
                    .delete()
                    .eq('id', sub.id)
            }
        }
        return NextResponse.json({ sent, failed: failed.length })
    } catch (err: unknown) {
        return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 })
    }
}
