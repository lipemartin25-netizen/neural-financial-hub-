'use client'
import { useState } from 'react'
import { Check, Crown, Loader2, ExternalLink } from 'lucide-react'
import { C, cardStyle, cardHlStyle, btnGoldStyle, btnOutlineStyle } from '@/lib/theme'
import { PLANS, PlanKey } from '@/lib/stripe'
import { useApp } from '@/contexts/AppContext'
type Props = {
    currentPlan: string
    planStatus?: string
}
export default function PlanCards({ currentPlan, planStatus }: Props) {
    const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
    const { t } = useApp()
    const handleCheckout = async (plan: PlanKey) => {
        setLoadingPlan(plan)
        try {
            const res = await fetch('/api/stripe/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ plan }),
            })
            const json = await res.json()
            if (json.url) window.location.href = json.url
            else alert(json.error || 'Erro ao criar checkout')
        } catch {
            alert('Erro de conexão')
        } finally {
            setLoadingPlan(null)
        }
    }
    const handlePortal = async () => {
        setLoadingPlan('portal')
        try {
            const res = await fetch('/api/stripe/portal', { method: 'POST' })
            const json = await res.json()
            if (json.url) window.location.href = json.url
            else alert(json.error || 'Erro')
        } catch {
            alert('Erro de conexão')
        } finally {
            setLoadingPlan(null)
        }
    }
    const plans: { key: PlanKey; popular?: boolean }[] = [
        { key: 'mei' },
        { key: 'pro', popular: true },
        { key: 'family' },
    ]
    return (
        <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 16 }}>
                {plans.map(({ key, popular }) => {
                    const plan = PLANS[key]
                    const isCurrent = currentPlan === key
                    const style = popular ? cardHlStyle : cardStyle
                    return (
                        <div key={key} style={{ ...style, padding: 24, position: 'relative' }}>
                            {popular && (
                                <div style={{
                                    position: 'absolute', top: -1, left: '50%', transform: 'translateX(-50%)',
                                    padding: '4px 16px', borderRadius: '0 0 8px 8px',
                                    background: C.goldGrad, fontSize: 10, fontWeight: 700, color: C.bg,
                                    textTransform: 'uppercase', letterSpacing: 1,
                                }}>
                                    Popular
                                </div>
                            )}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, marginTop: popular ? 8 : 0 }}>
                                <Crown size={18} style={{ color: C.gold }} />
                                <h3 style={{ fontSize: 18, fontWeight: 700, color: C.text }}>{plan.name}</h3>
                            </div>
                            <div style={{ marginBottom: 16 }}>
                                <span style={{ fontSize: 32, fontWeight: 800, color: C.gold }}>
                                    R$ {plan.price.toFixed(2).replace('.', ',')}
                                </span>
                                <span style={{ fontSize: 13, color: C.textMuted }}>/mês</span>
                            </div>
                            <div style={{ marginBottom: 20 }}>
                                {plan.features.map((f, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                        <Check size={14} style={{ color: C.emerald, flexShrink: 0 }} />
                                        <span style={{ fontSize: 13, color: C.textMuted }}>{f}</span>
                                    </div>
                                ))}
                            </div>
                            {isCurrent ? (
                                <button onClick={handlePortal} disabled={loadingPlan === 'portal'}
                                    style={{ ...btnOutlineStyle, width: '100%', opacity: loadingPlan === 'portal' ? 0.7 : 1 }}>
                                    {loadingPlan === 'portal' ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <ExternalLink size={14} />}
                                    Gerenciar Assinatura
                                </button>
                            ) : (
                                <button onClick={() => handleCheckout(key)} disabled={!!loadingPlan}
                                    style={{
                                        ...(popular ? btnGoldStyle : btnOutlineStyle),
                                        width: '100%',
                                        opacity: loadingPlan ? 0.7 : 1,
                                    }}>
                                    {loadingPlan === key ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : null}
                                    {isCurrent ? 'Plano Atual' : 'Assinar'}
                                </button>
                            )}
                            {isCurrent && (
                                <p style={{ fontSize: 11, color: C.emerald, textAlign: 'center', marginTop: 8 }}>
                                    ✓ Plano ativo
                                </p>
                            )}
                        </div>
                    )
                })}
            </div>
            {currentPlan !== 'free' && planStatus === 'past_due' && (
                <div style={{
                    padding: 12, borderRadius: 10, backgroundColor: 'rgba(248,113,113,0.08)',
                    border: '1px solid rgba(248,113,113,0.2)', fontSize: 13, color: C.red, textAlign: 'center',
                }}>
                    ⚠️ Pagamento pendente. Atualize seu método de pagamento para evitar cancelamento.
                </div>
            )}
            <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    )
}
