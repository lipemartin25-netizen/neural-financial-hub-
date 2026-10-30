import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

// Forçar rota dinâmica
export const dynamic = 'force-dynamic'

function getSupabaseAdmin() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) return null
    return createClient(url, key)
}

export async function POST(request: NextRequest) {
    const body = await request.text()
    const sig = request.headers.get('stripe-signature')

    if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
        return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
    }

    let event: Stripe.Event
    try {
        event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
    } catch {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const supabaseAdmin = getSupabaseAdmin()
    if (!supabaseAdmin) {
        return NextResponse.json({ error: 'Supabase credentials not configured' }, { status: 500 })
    }

    // Idempotência: verificar se este evento já foi processado
    const { data: existing } = await supabaseAdmin
        .from('stripe_webhook_events')
        .select('id')
        .eq('event_id', event.id)
        .maybeSingle()

    if (existing) {
        return NextResponse.json({ received: true, duplicate: true })
    }

    // Registrar evento antes de processar (fail-safe)
    await supabaseAdmin.from('stripe_webhook_events').insert({
        event_id: event.id,
        event_type: event.type,
        processed_at: new Date().toISOString(),
    })

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session
                const uid = session.metadata?.supabase_uid
                const plan = session.metadata?.plan as string
                if (uid && plan) {
                    await supabaseAdmin.from('profiles').update({
                        plan,
                        plan_status: 'active',
                        stripe_subscription_id: session.subscription as string,
                        plan_expires_at: null,
                        updated_at: new Date().toISOString(),
                    }).eq('id', uid)
                }
                break
            }
            case 'customer.subscription.updated': {
                const sub = event.data.object as Stripe.Subscription
                const uid = sub.metadata?.supabase_uid
                if (uid) {
                    const status = sub.status === 'active' ? 'active'
                        : sub.status === 'past_due' ? 'past_due'
                            : sub.status === 'canceled' ? 'cancelled'
                                : sub.status
                    await supabaseAdmin.from('profiles').update({
                        plan_status: status,
                        updated_at: new Date().toISOString(),
                    }).eq('id', uid)
                }
                break
            }
            case 'customer.subscription.deleted': {
                const sub = event.data.object as Stripe.Subscription
                const uid = sub.metadata?.supabase_uid
                if (uid) {
                    await supabaseAdmin.from('profiles').update({
                        plan: 'free',
                        plan_status: 'cancelled',
                        stripe_subscription_id: null,
                        stripe_price_id: null,
                        plan_expires_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                    }).eq('id', uid)
                }
                break
            }
            case 'invoice.payment_failed': {
                const invoice = event.data.object as Stripe.Invoice
                const customerId = invoice.customer as string
                const { data: profiles } = await supabaseAdmin
                    .from('profiles')
                    .select('id')
                    .eq('stripe_customer_id', customerId)
                    .limit(1)
                if (profiles?.[0]) {
                    await supabaseAdmin.from('profiles').update({
                        plan_status: 'past_due',
                        updated_at: new Date().toISOString(),
                    }).eq('id', profiles[0].id)
                }
                break
            }
        }
        return NextResponse.json({ received: true })
    } catch (err: unknown) {
        console.error('Webhook error:', err)
        return NextResponse.json({ error: 'Webhook processing error' }, { status: 500 })
    }
}
