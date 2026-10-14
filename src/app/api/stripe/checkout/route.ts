import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { stripe, PLANS, PlanKey } from '@/lib/stripe'
export const dynamic = 'force-dynamic'
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        const { plan } = await request.json() as { plan: PlanKey }
        if (!PLANS[plan]) return NextResponse.json({ error: 'Plano inválido' }, { status: 400 })
        const planData = PLANS[plan]
        if (!planData.priceId) {
            return NextResponse.json({ error: 'Price ID não configurado' }, { status: 500 })
        }
        // Buscar ou criar Stripe Customer
        const { data: profile } = await supabase
            .from('profiles')
            .select('stripe_customer_id, email, full_name')
            .eq('id', user.id)
            .single()
        let customerId = profile?.stripe_customer_id
        if (!customerId) {
            const customer = await stripe.customers.create({
                email: user.email ?? profile?.email,
                name: profile?.full_name ?? undefined,
                metadata: { supabase_uid: user.id },
            })
            customerId = customer.id
            await supabase.from('profiles').update({
                stripe_customer_id: customerId,
            }).eq('id', user.id)
        }

        // Verificar se já tem subscription ativa
        const { data: currentProfile } = await supabase
            .from('profiles')
            .select('plan, plan_status, stripe_subscription_id')
            .eq('id', user.id)
            .single()

        if (currentProfile?.stripe_subscription_id && currentProfile?.plan_status === 'active') {
            return NextResponse.json({
                error: 'Você já tem uma assinatura ativa. Use o portal para alterar seu plano.',
                portal: true,
            }, { status: 400 })
        }
        // Criar Checkout Session
        const origin = request.headers.get('origin') ?? 'http://localhost:3000'
        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [{ price: planData.priceId, quantity: 1 }],
            success_url: `${origin}/settings?payment=success&plan=${plan}`,
            cancel_url: `${origin}/settings?payment=cancelled`,
            metadata: {
                supabase_uid: user.id,
                plan,
            },
            subscription_data: {
                metadata: {
                    supabase_uid: user.id,
                    plan,
                },
            },
        })
        return NextResponse.json({ url: session.url })
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Stripe error'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
