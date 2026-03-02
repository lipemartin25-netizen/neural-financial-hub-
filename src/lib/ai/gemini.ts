import { GoogleGenAI } from '@google/genai'

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })

export const GEMINI_MODEL = process.env.GEMINI_MODEL ?? 'gemini-3-flash-preview'

/**
 * Generate a text response from Gemini (non-streaming)
 */
export async function generateText(prompt: string, systemInstruction?: string): Promise<string> {
    const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: systemInstruction ? { systemInstruction } : undefined,
    })
    return response.text ?? ''
}

/**
 * Stream a chat response from Gemini
 * Returns an async iterable of text chunks
 */
export async function* streamChat(
    messages: Array<{ role: 'user' | 'model'; text: string }>,
    systemInstruction: string
): AsyncGenerator<string> {
    const contents = messages.map((m) => ({
        role: m.role,
        parts: [{ text: m.text }],
    }))

    const stream = await ai.models.generateContentStream({
        model: GEMINI_MODEL,
        contents,
        config: { systemInstruction },
    })

    for await (const chunk of stream) {
        const text = chunk.text
        if (text) yield text
    }
}

/**
 * Categorize transactions in batch using Structured Output
 */
export async function categorizeTransactions(
    transactions: Array<{ description: string; amount: number }>,
    availableCategories: string[]
): Promise<Array<{ description: string; category: string; confidence: number }>> {
    const prompt = `
Categorize each transaction into one of these categories: ${availableCategories.join(', ')}.
Return a JSON array with exactly ${transactions.length} objects, each with:
- description: the original description
- category: one of the available categories
- confidence: a number between 0 and 1

Transactions to categorize:
${transactions.map((t, i) => `${i + 1}. "${t.description}" (R$ ${t.amount.toFixed(2)})`).join('\n')}
`

    const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
        },
    })

    const text = response.text ?? '[]'
    try {
        return JSON.parse(text)
    } catch {
        return transactions.map((t) => ({
            description: t.description,
            category: 'Outras Despesas',
            confidence: 0.5,
        }))
    }
}

/**
 * Generate financial insights for a user
 */
export async function generateFinancialInsights(context: {
    totalIncome: number
    totalExpense: number
    topCategories: Array<{ name: string; amount: number }>
    monthName: string
}): Promise<string> {
    const prompt = `
Você é um assistente financeiro pessoal inteligente. Analise os dados do mês e gere um insight personalizado em português brasileiro.
Seja direto, prático e motivador. Máximo 3 parágrafos.

Dados de ${context.monthName}:
- Receitas totais: R$ ${context.totalIncome.toFixed(2)}
- Despesas totais: R$ ${context.totalExpense.toFixed(2)}
- Economia: R$ ${(context.totalIncome - context.totalExpense).toFixed(2)}
- Maiores gastos: ${context.topCategories.map((c) => `${c.name} (R$ ${c.amount.toFixed(2)})`).join(', ')}
`
    return generateText(prompt)
}
