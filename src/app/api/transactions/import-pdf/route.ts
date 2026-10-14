import { createClient } from '@/lib/supabase/server'
import { GoogleGenAI } from '@google/genai'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const apiKey = process.env.GEMINI_API_KEY
        if (!apiKey) return NextResponse.json({ error: 'GEMINI_API_KEY não configurada' }, { status: 500 })

        const formData = await request.formData()
        const file = formData.get('file') as File
        const accountId = formData.get('account_id') as string

        if (!file || !accountId) {
            return NextResponse.json({ error: 'Arquivo e conta são obrigatórios' }, { status: 400 })
        }

        // Verificar conta pertence ao user
        const { data: account } = await supabase
            .from('accounts').select('id').eq('id', accountId).eq('user_id', user.id).single()
        if (!account) return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 })

        // Converter file pra base64
        const arrayBuffer = await file.arrayBuffer()
        const base64 = Buffer.from(arrayBuffer).toString('base64')
        const mimeType = file.type || 'application/pdf'

        const ai = new GoogleGenAI({ apiKey })

        const prompt = `Analise este extrato bancário brasileiro e extraia TODAS as transações.

Para cada transação, retorne:
- date: data no formato YYYY-MM-DD
- description: descrição da transação
- amount: valor absoluto (número positivo)
- type: "income" para créditos/entradas, "expense" para débitos/saídas

Responda APENAS com um JSON array. Exemplo:
[
  {"date": "2026-03-01", "description": "PIX RECEBIDO FULANO", "amount": 500.00, "type": "income"},
  {"date": "2026-03-02", "description": "COMPRA CARTAO SUPERMERCADO", "amount": 150.30, "type": "expense"}
]

REGRAS:
- Extraia TODAS as transações visíveis
- Use formato brasileiro de data convertido para YYYY-MM-DD
- Amount sempre positivo
- Ignore saldos, cabeçalhos e rodapés
- Se não conseguir extrair nada, retorne []`

        const response = await ai.models.generateContent({
            model: 'gemini-1.5-flash',
            contents: [{
                role: 'user',
                parts: [
                    { inlineData: { mimeType, data: base64 } },
                    { text: prompt },
                ],
            }],
        })

        const text = response.text ?? ''
        const jsonMatch = text.match(/\[[\s\S]*\]/)

        if (!jsonMatch) {
            return NextResponse.json({ error: 'Não foi possível extrair transações do extrato', rawResponse: text.substring(0, 500) }, { status: 400 })
        }

        const parsed: Array<{ date: string; description: string; amount: number; type: string }> = JSON.parse(jsonMatch[0])

        if (parsed.length === 0) {
            return NextResponse.json({ error: 'Nenhuma transação encontrada no extrato' }, { status: 400 })
        }

        // Validar e inserir
        const valid = parsed.filter(t =>
            t.date && /^\d{4}-\d{2}-\d{2}$/.test(t.date) &&
            t.description && t.amount > 0 &&
            ['income', 'expense'].includes(t.type)
        )

        const toInsert = valid.map(t => ({
            user_id: user.id,
            account_id: accountId,
            amount: t.amount,
            type: t.type as 'income' | 'expense',
            description: t.description,
            date: t.date,
            notes: 'Importado via extrato PDF (IA)',
            ai_categorized: false,
        }))

        const { error: insertError } = await supabase.from('transactions').insert(toInsert)
        if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })

        // Auto-categorize
        const { data: insertedTxs } = await supabase
            .from('transactions')
            .select('id')
            .eq('user_id', user.id)
            .eq('notes', 'Importado via extrato PDF (IA)')
            .is('category_id', null)
            .order('created_at', { ascending: false })
            .limit(valid.length)

        if (insertedTxs && insertedTxs.length > 0) {
            // Fire and forget categorization
            fetch(new URL('/api/ai/categorize', request.url).toString(), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', cookie: request.headers.get('cookie') ?? '' },
                body: JSON.stringify({ transaction_ids: insertedTxs.map(t => t.id) }),
            }).catch(() => { })
        }

        return NextResponse.json({
            data: {
                imported: valid.length,
                total_found: parsed.length,
                skipped: parsed.length - valid.length,
                sample: valid.slice(0, 5),
            },
        })
    } catch (err: unknown) {
        return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 })
    }
}
