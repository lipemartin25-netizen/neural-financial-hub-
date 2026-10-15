import Stripe from 'stripe'
const key = process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder'
export const stripe = new Stripe(key, {
    apiVersion: '2025-01-27.acacia' as any,
    typescript: true,
})
export const PLANS = {
    pro: {
        name: 'Pro',
        priceId: process.env.STRIPE_PRICE_PRO || '',
        price: 29.90,
        features: [
            '100 mensagens IA/dia',
            'Contas ilimitadas',
            'Cartões ilimitados',
            'Metas ilimitadas',
            'Relatórios avançados',
            'Import PDF com IA Vision',
            'Wealth Lab completo',
        ],
    },
    family: {
        name: 'Family',
        priceId: process.env.STRIPE_PRICE_FAMILY || '',
        price: 49.90,
        features: [
            'Tudo do Pro',
            '200 mensagens IA/dia',
            'Até 5 membros família',
            'Metas compartilhadas',
            'Dashboard familiar',
            'Controle de permissões',
        ],
    },
    mei: {
        name: 'MEI',
        priceId: process.env.STRIPE_PRICE_MEI || '',
        price: 19.90,
        features: [
            '50 mensagens IA/dia',
            '10 contas',
            'Controle PJ + PF',
            'DAS automático',
            'Relatório fiscal',
            'Projeção faturamento',
        ],
    },
} as const
export type PlanKey = keyof typeof PLANS
