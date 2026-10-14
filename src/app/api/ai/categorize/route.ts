import { createClient } from '@/lib/supabase/server'
import { GoogleGenAI } from '@google/genai'
import { NextRequest, NextResponse } from 'next/server'

const CATEGORIES_MAP: Record<string, { name: string; icon: string }> = {
    housing: { name: 'Moradia', icon: '🏠' },
    food: { name: 'Alimentação', icon: '🍔' },
    transport: { name: 'Transporte', icon: '🚗' },
    health: { name: 'Saúde', icon: '💊' },
    education: { name: 'Educação', icon: '📚' },
    entertainment: { name: 'Lazer', icon: '🎬' },
    shopping: { name: 'Compras', icon: '🛍️' },
    subscriptions: { name: 'Assinaturas', icon: '📱' },
    utilities: { name: 'Contas', icon: '⚡' },
    insurance: { name: 'Seguros', icon: '🛡️' },
    pets: { name: 'Pets', icon: '🐾' },
    clothing: { name: 'Vestuário', icon: '👕' },
    personal: { name: 'Pessoal', icon: '🧴' },
    other_expense: { name: 'Outros', icon: '📦' },
    salary: { name: 'Salário', icon: '💰' },
    freelance: { name: 'Freelance', icon: '💻' },
    investments_return: { name: 'Investimentos', icon: '📈' },
    rental: { name: 'Aluguel', icon: '🏠' },
    gift: { name: 'Presente', icon: '🎁' },
    refund: { name: 'Reembolso', icon: '💵' },
    other_income: { name: 'Outros', icon: '💰' },
}

const VALID_IDS = Object.keys(CATEGORIES_MAP)

// POST — categorizar uma lista de transações via IA
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await request.json()
        const { transaction_ids } = body as { transaction_ids?: string[] }

        // Se não passar IDs, buscar transações sem categoria
        let txIds = transaction_ids

        if (!txIds || txIds.length === 0) {
            const { data: uncategorized } = await supabase
                .from('transactions')
                .select('id')
                .eq('user_id', user.id)
                .is('category_id', null)
                .order('created_at', { ascending: false })
                .limit(50)

            txIds = (uncategorized ?? []).map(t => t.id)
        }

        if (txIds.length === 0) {
            return NextResponse.json({ data: { categorized: 0, message: 'Nenhuma transação sem categoria' } })
        }

        // Buscar transações
        const { data: transactions } = await supabase
            .from('transactions')
            .select('id, description, amount, type, date')
            .eq('user_id', user.id)
            .in('id', txIds)

        if (!transactions || transactions.length === 0) {
            return NextResponse.json({ data: { categorized: 0 } })
        }

        // Primeiro: tentar regras automáticas do usuário
        const { data: rules } = await supabase
            .from('auto_rules')
            .select('*')
            .eq('user_id', user.id)
            .eq('is_active', true)

        const userRules = rules ?? []
        const toAI: typeof transactions = []
        let ruleMatches = 0

        for (const tx of transactions) {
            const desc = tx.description.toLowerCase()
            const matchedRule = userRules.find(r => {
                const pattern = (r.pattern as string).toLowerCase()
                if (r.match_type === 'contains') return desc.includes(pattern)
                if (r.match_type === 'starts_with') return desc.startsWith(pattern)
                if (r.match_type === 'exact') return desc === pattern
                return desc.includes(pattern) // default
            })

            if (matchedRule) {
                await supabase.from('transactions').update({
                    category_id: matchedRule.category_id,
                    ai_categorized: true,
                    ai_confidence: 1.0,
                    ai_reviewed: false,
                    updated_at: new Date().toISOString(),
                }).eq('id', tx.id)
                ruleMatches++
            } else {
                toAI.push(tx)
            }
        }

        // Se sobrou, mandar pro Gemini
        let aiMatches = 0

        if (toAI.length > 0) {
            const apiKey = process.env.GEMINI_API_KEY
            if (!apiKey) {
                return NextResponse.json({
                    data: { categorized: ruleMatches, ruleMatches, aiMatches: 0, skipped: toAI.length, message: 'GEMINI_API_KEY não configurada' },
                })
            }

            const ai = new GoogleGenAI({ apiKey })

            const txList = toAI.map((tx, i) =>
                `${i + 1}. "${tx.description}" | R$ ${Number(tx.amount).toFixed(2)} | ${tx.type} | ${tx.date}`
            ).join('\n')

            const categoryList = VALID_IDS.map(id =>
                `${id}: ${CATEGORIES_MAP[id].name}`
            ).join('\n')

            const prompt = `Você é um classificador financeiro brasileiro. Categorize cada transação com a categoria mais adequada.

CATEGORIAS DISPONÍVEIS:
${categoryList}

TRANSAÇÕES:
${txList}

Responda APENAS com um JSON array. Cada item: {"idx": número, "category_id": "id_da_categoria", "confidence": 0.0 a 1.0}
Exemplo: [{"idx":1,"category_id":"food","confidence":0.95}]

REGRAS:
- Use APENAS os IDs de categoria listados acima
- Considere o contexto brasileiro (Nubank, iFood, Uber, CPFL, Sabesp, etc)
- confidence >= 0.8 para matches claros, 0.5-0.8 para inferências
- Se impossível classificar, use "other_expense" ou "other_income"
`

            try {
                const response = await ai.models.generateContent({
                    model: 'gemini-2.0-flash',
                    contents: prompt,
                })

                const text = response.text ?? ''
                // Extrair JSON do response
                const jsonMatch = text.match(/\[[\s\S]*\]/)
                if (jsonMatch) {
                    const results: Array<{ idx: number; category_id: string; confidence: number }> = JSON.parse(jsonMatch[0])

                    for (const result of results) {
                        const tx = toAI[result.idx - 1]
                        if (!tx) continue
                        if (!VALID_IDS.includes(result.category_id)) continue

                        // Buscar o category record real do usuário ou default
                        const { data: catRecord } = await supabase
                            .from('categories')
                            .select('id')
                            .or(`user_id.eq.${user.id},is_default.eq.true`)
                            .ilike('name', `%${CATEGORIES_MAP[result.category_id].name}%`)
                            .limit(1)
                            .single()

                        const categoryId = catRecord?.id ?? null

                        if (categoryId) {
                            await supabase.from('transactions').update({
                                category_id: categoryId,
                                ai_categorized: true,
                                ai_confidence: Math.min(1, Math.max(0, result.confidence)),
                                ai_reviewed: false,
                                updated_at: new Date().toISOString(),
                            }).eq('id', tx.id)
                            aiMatches++
                        }
                    }
                }
            } catch (aiErr) {
                console.error('AI categorization error:', aiErr)
                // Não falhar — retornar o que conseguiu com regras
            }
        }

        return NextResponse.json({
            data: {
                categorized: ruleMatches + aiMatches,
                ruleMatches,
                aiMatches,
                total: transactions.length,
            },
        })
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Internal error'
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
